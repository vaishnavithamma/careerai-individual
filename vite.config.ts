import { defineConfig, loadEnv } from "vite";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Buffer } from "node:buffer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(__dirname, "../"), "");
  
  const OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
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

  // Clean LLM JSON outputs (strip markdown code blocks and extract JSON structure)
  function cleanJsonOutput(output: string): string {
    let clean = output.replace(/```json/gi, "").replace(/```/g, "").trim();
    const arrayMatch = clean.match(/\[[\s\S]*\]/);
    if (arrayMatch) return arrayMatch[0];
    const objectMatch = clean.match(/\{[\s\S]*\}/);
    if (objectMatch) return objectMatch[0];
    return clean;
  }

  // LLM generation helper
  async function generateLLMText(prompt: string, systemInstruction: string = ""): Promise<string> {
    if (GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\n${prompt}` }] }]
        })
      });
      const data: any = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (OPENAI_API_KEY) {
      const url = "https://api.openai.com/v1/chat/completions";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ]
        })
      });
      const data: any = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }
    return "";
  }

  // API middleware plugin (configureServer is a plugin-level hook, not a server option)
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

            // 1. Generate Questions
            if (urlPath === "/api/generate-questions" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { selectedRole, skills, count, difficulty, round } = body;
              
              if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
                return res.end(JSON.stringify({ error: "API_KEYS_MISSING", fallback: true }));
              }

              const prompt = `Generate exactly ${count} interview questions for a ${selectedRole} role.
              The questions must assess these skills: ${skills.join(", ")}.
              Difficulty: ${difficulty}.
              Interview Round Type: ${round === "hr" ? "HR Behavioural" : "Technical"}.
              
              You MUST return a raw JSON array of objects (no markdown blocks, no enclosing backticks). Each object must fit the schema:
              {
                "text": "The question string",
                "level": "EASY" | "MEDIUM" | "ADVANCED" | "BEHAVIOURAL",
                "keywords": ["key concept 1", "key concept 2"],
                "idealAnswer": "A professional, realistic sample answer that sounds natural.",
                "missingPoints": ["essential point 1", "essential point 2"],
                "improvementSuggestions": ["suggestion 1", "suggestion 2"]
              }`;

              const output = await generateLLMText(prompt, "You are a professional technical interviewer who only outputs valid JSON arrays.");
              const cleanOutput = cleanJsonOutput(output);
              
              // Validate that the output is indeed a parsable JSON array
              try {
                JSON.parse(cleanOutput);
                return res.end(cleanOutput);
              } catch (e) {
                console.warn("LLM output is not valid JSON array:", cleanOutput);
                return res.end(JSON.stringify({ error: "INVALID_LLM_JSON" }));
              }
            }

            // 2. Generate Follow-up
            if (urlPath === "/api/generate-followup" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { questionText, answerText, previousContext, round } = body;

              if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
                return res.end(JSON.stringify({ error: "API_KEYS_MISSING" }));
              }

              const isHr = round === "hr";
              const prompt = `You are conducting a ${isHr ? "behavioural HR" : "technical"} job interview.
              Current Question: "${questionText}"
              Candidate Answer: "${answerText}"
              Previous Context: ${JSON.stringify(previousContext)}
              
              ${isHr
                ? "Ask exactly one short, empathetic, conversational follow-up question that digs deeper into the candidate's feelings, motivations, or interpersonal dynamics. Focus on the human side of their story. Do NOT ask technical or coding questions."
                : "Ask exactly one short, precise technical follow-up question to probe their depth of understanding. Do not ask behavioural or soft-skill questions."}
              Do not include any greeting or conversational filler. Output only the question.`;

              const systemInstruction = isHr
                ? "You are a senior HR interviewer skilled in behavioural interviewing techniques like STAR. You only ask emotionally intelligent, situation-based follow-up questions."
                : "You are a senior technical interviewer. You only ask precise, focused technical follow-up questions.";

              const followUp = await generateLLMText(prompt, systemInstruction);
              return res.end(JSON.stringify({ followUp: followUp.trim() }));
            }

            // 3. Evaluate Interview
            if (urlPath === "/api/evaluate-interview" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { selectedRole, round, answers } = body;

              if (!GEMINI_API_KEY && !OPENAI_API_KEY) {
                return res.end(JSON.stringify({ error: "API_KEYS_MISSING" }));
              }

              const prompt = `Evaluate this ${round} interview performance for a ${selectedRole} position.
              Interview Q&As: ${JSON.stringify(answers)}
              
              Calculate overall score, role readiness, metrics, strengths, weaknesses, suggested resources, and scores out of 10 for each question.
              
              You MUST return a raw JSON object (no markdown blocks, no enclosing backticks) with the schema:
              {
                "type": "${round === "hr" ? "HR" : "Technical"}",
                "selectedRole": "${selectedRole}",
                "overallScore": 82,
                "roleReadinessScore": 82,
                "hiringRecommendation": "STRONG HIRE" | "HIRE" | "NEEDS PRACTICE",
                "strengths": ["strength 1", "strength 2"],
                "weakAreas": ["weakness 1", "weakness 2"],
                "recommendedTopics": ["topic 1", "topic 2"],
                "suggestedResources": [{"title": "resource title", "type": "Docs" | "Course"}],
                "recommendedPractice": ["STAR Method", "Pacing"],
                "answers": [
                  {
                    "question": "Q1 text",
                    "answer": "Candidate answer",
                    "keywords": ["key 1"],
                    "matched": ["key 1"],
                    "coverageScore": 90,
                    "idealAnswer": "Sample response text",
                    "missingPoints": ["missed point 1"],
                    "improvementSuggestions": ["tip 1"],
                    "scores": {
                      "accuracy": 8,
                      "communication": 8,
                      "confidence": 7,
                      "completeness": 8,
                      "clarity": 8,
                      "problemSolving": 7
                    },
                    "followUpQuestion": "follow-up text",
                    "followUpAnswer": "candidate follow-up response"
                  }
                ]
              }`;

              const output = await generateLLMText(prompt, "You are an expert technical interviewer and senior talent manager who only outputs valid JSON.");
              const cleanOutput = cleanJsonOutput(output);
              try {
                JSON.parse(cleanOutput);
                return res.end(cleanOutput);
              } catch (e) {
                console.warn("LLM evaluation output is not valid JSON:", cleanOutput);
                return res.end(JSON.stringify({ error: "INVALID_LLM_JSON" }));
              }
            }

            // 4. TTS (Text-to-Speech)
            if (urlPath === "/api/speak" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { text } = body;

              if (!OPENAI_API_KEY) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ error: "OPENAI_KEY_MISSING" }));
              }

              const response = await fetch("https://api.openai.com/v1/audio/speech", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                  model: "tts-1",
                  input: text,
                  voice: "alloy"
                })
              });

              if (!response.ok) {
                throw new Error("OpenAI TTS failed");
              }

              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              res.setHeader("Content-Type", "audio/mpeg");
              return res.end(buffer);
            }

            // 5. STT (Speech-to-Text)
            if (urlPath === "/api/transcribe" && req.method === "POST") {
              const body = await getRequestBody(req);
              const { audio, filename } = body;

              if (!OPENAI_API_KEY) {
                return res.end(JSON.stringify({ error: "OPENAI_KEY_MISSING" }));
              }

              const audioBuffer = Buffer.from(audio, "base64");
              const formData = new FormData();
              const audioBlob = new Blob([audioBuffer], { type: "audio/wav" });
              formData.append("file", audioBlob, filename || "audio.wav");
              formData.append("model", "whisper-1");

              const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: formData
              });

              const data: any = await response.json();
              return res.end(JSON.stringify({ text: data.text || "" }));
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
    envDir: "../",
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
