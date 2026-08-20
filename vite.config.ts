import { defineConfig, loadEnv } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  
  const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";

  // Helper to read JSON request bodies safely in Node middleware
  function getRequestBody(req: any): Promise<any> {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk: any) => { body += chunk; });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      });
    });
  }

  // Robustly clean LLM JSON outputs (strip markdown code blocks, preamble text, and extract valid JSON structure)
  function cleanJsonOutput(output: string, expectedType: 'array' | 'object' = 'object'): string {
    if (!output || typeof output !== 'string') return expectedType === 'array' ? '[]' : '{}';
    let clean = output.trim();
    
    // Strip markdown code fences if present (e.g. ```json ... ``` or ``` ...)
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    if (expectedType === 'array') {
      const firstBracket = clean.indexOf('[');
      const lastBracket = clean.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket > firstBracket) {
        return clean.substring(firstBracket, lastBracket + 1);
      }
    } else {
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        return clean.substring(firstBrace, lastBrace + 1);
      }
    }
    return clean;
  }

  // LLM generation helper powered by Google Gemini API (tries supported model identifiers: gemini-2.5-flash -> gemini-flash-latest -> gemini-2.5-pro)
  async function generateLLMText(prompt: string, systemInstruction: string = "", responseJson: boolean = false): Promise<string> {
    if (!GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing from environment.");
      return "";
    }
    
    const modelsToTry = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-pro"];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const payload: any = {
          contents: [
            {
              role: "user",
              parts: [{ text: `${systemInstruction ? systemInstruction + "\n\n" : ""}${prompt}` }]
            }
          ]
        };
        if (responseJson) {
          payload.generationConfig = { responseMimeType: "application/json" };
        }
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data: any = await response.json();
        if (data.error) {
          console.warn(`Gemini model ${model} returned API error:`, data.error.message || data.error);
          continue;
        }
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (rawText) {
          console.log(`\n=================== RAW GEMINI RESPONSE (${model}) START ===================`);
          console.log(rawText);
          console.log(`==================== RAW GEMINI RESPONSE (${model}) END ====================\n`);
          return rawText;
        }
      } catch (err) {
        console.warn(`Gemini API fetch error on model ${model}:`, err);
      }
    }
    console.error("All Gemini API model attempts failed.");
    return "";
  }

  // API middleware plugin
  const apiMiddlewarePlugin = {
    name: "api-middleware",
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
          // Parse path neglecting any query arguments
          const parsedUrl = new URL(req.url || "", `http://${req.headers.host || "localhost"}`);
          const urlPath = parsedUrl.pathname;

          if (!urlPath.startsWith("/api/")) {
            return next();
          }

          try {
            res.setHeader("Content-Type", "application/json");

            // 1. Generate Questions (Gemini API)
            if (urlPath === "/api/generate-questions" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { selectedRole, skills, count, difficulty, round } = body;
              
              if (!GEMINI_API_KEY) {
                return res.end(JSON.stringify({ error: "GEMINI_KEY_MISSING", fallback: true }));
              }

              const prompt = `Generate exactly ${count} simple, foundational, beginner-level interview questions for a ${selectedRole} role.
              The questions must assess these skills: ${(skills || []).join(", ")}.
              Interview Round Type: ${round === "hr" ? "HR Behavioural" : "Technical"}.
              
              CRITICAL QUESTION FORMAT REQUIREMENT:
              - All questions MUST be direct, definition-style questions ONLY (e.g. "What is X?", "Define Y", "Explain the concept of Z").
              - Do NOT ask scenario-based, comparative (X vs Y), troubleshooting, or open-ended system design questions.
              - Keep each question simple, clear, concise, and beginner-friendly.
              
              Return ONLY a JSON array of objects fitting this schema:
              [
                {
                  "text": "The question string (MUST be definition-style: What is X?, Define Y, Explain Z)",
                  "level": "EASY",
                  "keywords": ["key concept 1", "key concept 2"],
                  "idealAnswer": "A simple, clear definition and brief explanation.",
                  "missingPoints": ["essential point 1", "essential point 2"],
                  "improvementSuggestions": ["suggestion 1", "suggestion 2"]
                }
              ]`;

              const systemInstruction = "You are a professional technical interviewer who only outputs valid JSON arrays. You strictly ask simple, direct definition-style questions (What is X?, Define Y, Explain Z).";

              const output = await generateLLMText(prompt, systemInstruction, true);
              const cleanOutput = cleanJsonOutput(output, 'array');
              
              try {
                JSON.parse(cleanOutput);
                return res.end(cleanOutput);
              } catch (e) {
                console.warn("Gemini output is not valid JSON array:", cleanOutput);
                return res.end(JSON.stringify({ error: "INVALID_LLM_JSON" }));
              }
            }

            // 2. Generate Follow-up (Gemini API)
            if (urlPath === "/api/generate-followup" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { questionText, answerText, previousContext, round } = body;

              if (!GEMINI_API_KEY) {
                return res.end(JSON.stringify({ error: "GEMINI_KEY_MISSING" }));
              }

              const isHr = round === "hr";
              const prompt = `You are conducting a ${isHr ? "behavioural HR" : "technical"} job interview.
              Current Question: "${questionText}"
              Candidate Answer: "${answerText}"
              Previous Context: ${JSON.stringify(previousContext)}
              
              ${isHr
                ? "Ask exactly one short, empathetic, conversational follow-up question that digs deeper into the candidate's feelings, motivations, or interpersonal dynamics. Focus on the human side of their story. Do NOT ask technical or coding questions."
                : "Ask exactly one short, precise technical follow-up question to probe their depth of understanding. Do not ask behavioural or soft-skill questions."}
              Output ONLY the question string without any quotes or markdown filler.`;

              const systemInstruction = isHr
                ? "You are a senior HR interviewer. Ask a short follow-up question. Return ONLY plain text without markdown or conversational filler."
                : "You are a senior technical interviewer. Ask a short technical follow-up question. Return ONLY plain text without markdown or conversational filler.";

              const followUp = await generateLLMText(prompt, systemInstruction, false);
              return res.end(JSON.stringify({ followUp: followUp.trim() }));
            }

            // 3. Evaluate Interview (Gemini API)
            if (urlPath === "/api/evaluate-interview" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { selectedRole, round, answers } = body;

              if (!GEMINI_API_KEY) {
                return res.end(JSON.stringify({ error: "GEMINI_KEY_MISSING" }));
              }

              const isHrRound = round === "hr";
              const prompt = `You are an expert ${isHrRound ? "HR" : "technical"} interviewer. Evaluate the following ${round} job interview for the role of ${selectedRole}.

CANDIDATE TRANSCRIPT:
${JSON.stringify(answers, null, 2)}

INSTRUCTIONS:
- Read every question and candidate answer.
- Return ONLY a valid JSON object matching this structure (no markdown, no backticks, no explanatory commentary):
{
  "type": "${isHrRound ? "HR" : "Technical"}",
  "selectedRole": "${selectedRole}",
  "overallScore": 75,
  "roleReadinessScore": 75,
  "hiringRecommendation": "HIRE",
  "verdict": "Interview Ready",
  "strengths": ["Strength 1", "Strength 2"],
  "weakAreas": ["Weakness 1"],
  "recommendedTopics": ["Topic 1"],
  "suggestedResources": [{"title": "Resource 1", "type": "Docs"}],
  "recommendedPractice": ["Practice 1"],
  "metrics": {
    "technicalKnowledge": 75,
    "communication": 80,
    "confidence": 70,
    "problemSolving": 75,
    "behavioralSkills": 75
  },
  "answers": [
    {
      "question": "Question text",
      "answer": "Candidate answer text",
      "keywords": ["kw1", "kw2"],
      "matched": ["kw1"],
      "coverageScore": 70,
      "idealAnswer": "Ideal answer text",
      "missingPoints": ["Missing point 1"],
      "improvementSuggestions": ["Suggestion 1"],
      "scores": {
        "accuracy": 7,
        "communication": 8,
        "confidence": 7,
        "completeness": 7,
        "clarity": 8,
        "problemSolving": 7
      },
      "followUpQuestion": "Follow up question",
      "followUpAnswer": "Follow up answer"
    }
  ]
}`;

              const systemInstruction = "You are an expert technical interviewer. Return ONLY a valid JSON object. Do NOT wrap in markdown code blocks (```json). Do NOT add explanatory text or commentary.";

              const output = await generateLLMText(prompt, systemInstruction, true);
              const cleanOutput = cleanJsonOutput(output, 'object');
              try {
                JSON.parse(cleanOutput);
                return res.end(cleanOutput);
              } catch (e) {
                console.warn("Gemini evaluation output is not valid JSON:", cleanOutput);
                return res.end(JSON.stringify({ error: "INVALID_LLM_JSON" }));
              }
            }

            // 4. Generate Personalized Learning Roadmap (Gemini API)
            if (urlPath === "/api/generate-roadmap" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { selectedRole, skills, missingSkills, interviewWeakPoints } = body;

              if (!GEMINI_API_KEY) {
                return res.end(JSON.stringify({ error: "GEMINI_KEY_MISSING" }));
              }

              const prompt = `You are a senior technical engineering lead and career mentor.
Create a personalized 5-step learning path roadmap for a candidate targetting the role of ${selectedRole || "Software Engineer"}.

CANDIDATE CONTEXT:
- Existing Skills: ${(skills || []).join(", ") || "General Programming"}
- Identified Skill Gaps: ${(missingSkills || []).join(", ") || "Cloud Architecture, Advanced System Design"}
- Recent Mock Interview Weak Points: ${(interviewWeakPoints || []).join(", ") || "None recorded yet"}

REQUIREMENTS:
1. Focus heavily on addressing the candidate's specific skill gaps and mock interview weak points.
2. For EVERY step, include a specific, real, high-quality learning resource URL (e.g. official documentation on MDN, React Docs, Python Docs, or freeCodeCamp/W3Schools) and a resource_label.
3. Include an "impact" weight (number between 5 and 15) for readiness score recalculation.

Return ONLY a valid JSON array of objects fitting this exact schema (no markdown blocks, no backticks, no explanatory filler):
[
  {
    "id": "step-1",
    "task": "Master TypeScript Interfaces & Generics",
    "description": "Learn static typing, interface contracts, and generics to build robust scalable applications.",
    "missingSkill": "TypeScript",
    "impact": 10,
    "reward": "Readiness +10",
    "resource_label": "Official TypeScript Docs: Generics Handbook",
    "resource_url": "https://www.typescriptlang.org/docs/handbook/2/generics.html"
  }
]`;

              const systemInstruction = "You are a senior career advisor who returns ONLY valid JSON arrays of learning roadmap steps. Always provide real resource_url and resource_label per step.";

              const output = await generateLLMText(prompt, systemInstruction, true);
              const cleanOutput = cleanJsonOutput(output, 'array');
              
              try {
                JSON.parse(cleanOutput);
                return res.end(cleanOutput);
              } catch (e) {
                console.warn("Gemini roadmap output is not valid JSON array:", cleanOutput);
                return res.end(JSON.stringify({ error: "INVALID_LLM_JSON" }));
              }
            }

            res.writeHead(404);
            res.end(JSON.stringify({ error: "Not Found" }));

          } catch (err: any) {
            console.error("Vite server middleware error:", err);
            res.writeHead(500);
            res.end(JSON.stringify({ 
              success: false, 
              message: "Internal Server Error", 
              error: err.message || String(err) 
            }));
          }
        });
      }
    };

  return {
    root: "public",
    envDir: "./",
    plugins: [apiMiddlewarePlugin],
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, "public/index.html"),
          login: resolve(__dirname, "public/login.html"),
          signup: resolve(__dirname, "public/signup.html"),
          dashboard: resolve(__dirname, "public/dashboard.html")
        }
      }
    },
    server: {
      port: 5173,
      strictPort: true
    }
  };
});
