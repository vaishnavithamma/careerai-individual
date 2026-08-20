// Evaluation Service for CareerAI Voice Interview

export class EvaluationService {
  static async safeFetchJson(url, options = {}) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.warn(`HTTP error! status: ${response.status} on ${url}`);
        return { error: `HTTP_${response.status}` };
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.warn(`Invalid content type: ${contentType} on ${url}`);
        return { error: "INVALID_CONTENT_TYPE" };
      }
      return await response.json();
    } catch (e) {
      console.warn(`Fetch failure on ${url}:`, e);
      return { error: "NETWORK_FAILURE" };
    }
  }

  static async evaluateTechnicalInterview(questions, answers, selectedRole) {
    const data = await this.safeFetchJson("/api/evaluate-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedRole, round: "technical", answers })
    });

    if (data && !data.error) {
      if (Array.isArray(data.answers)) {
        return {
          ...data,
          date: data.date || new Date().toLocaleDateString()
        };
      } else if (Array.isArray(data)) {
        // Handle case where LLM returned array of answer evaluations directly
        const local = this.getLocalTechnicalEvaluation(questions, answers, selectedRole);
        return {
          ...local,
          answers: data,
          date: new Date().toLocaleDateString()
        };
      }
    }

    console.warn("LLM evaluation failed or returned invalid format, falling back to local technical analysis:", data);
    return this.getLocalTechnicalEvaluation(questions, answers, selectedRole);
  }

  static getLocalTechnicalEvaluation(questions, answers, selectedRole) {
    let totalKeywordsCount = 0;
    let totalMatchedKeywords = 0;
    let wordCountSum = 0;
    let responseTimeSum = 0;

    const evaluatedAnswers = answers.map((ans, idx) => {
      // Find question by exact text or fallback to index position
      const q = questions.find(item => item.text === ans.question) || questions[idx] || {
        keywords: ["architecture", "concept", "implementation", "solution"],
        idealAnswer: "Provide a structured explanation with key concepts and clear examples.",
        missingPoints: ["Core architectural details", "Edge cases & optimization"],
        improvementSuggestions: ["Be specific about technology choices and trade-offs."]
      };

      const keywords = (q.keywords && q.keywords.length > 0)
        ? q.keywords
        : ["concept", "implementation", "solution", "performance"];

      // Combine main answer and follow-up answer
      const mainText = ans.text || '';
      const followText = ans.followUpAnswer || '';
      const fullUserText = `${mainText} ${followText}`.trim();
      const lowerUserText = fullUserText.toLowerCase();

      const userWords = lowerUserText.split(/\s+/).filter(Boolean);
      wordCountSum += userWords.length;
      responseTimeSum += ans.duration || 15;

      // Smart fuzzy keyword matching
      const matched = keywords.filter(keyword => {
        const kwLower = keyword.toLowerCase();
        if (lowerUserText.includes(kwLower)) return true;
        const kwTokens = kwLower.split(/\s+/).filter(w => w.length > 2);
        return kwTokens.length > 0 && kwTokens.every(tok => lowerUserText.includes(tok));
      });

      const missing = keywords.filter(k => !matched.includes(k));
      totalKeywordsCount += keywords.length;
      totalMatchedKeywords += matched.length;

      const keywordCoveragePct = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 75;
      
      // Calculate realistic metric scores out of 10
      const accuracyScore = Math.max(3, Math.min(10, Math.round((keywordCoveragePct / 100) * 6 + Math.min(4, userWords.length / 15))));
      const communicationScore = Math.max(3, Math.min(10, Math.round(Math.min(70, userWords.length) / 10 + 3)));
      const confidenceScore = Math.max(4, Math.min(10, Math.round(9 - Math.abs(20 - (ans.duration || 15)) * 0.3)));
      const completenessScore = Math.max(3, Math.min(10, Math.round((accuracyScore * 0.5) + (communicationScore * 0.3) + (followText ? 2 : 1))));
      const clarityScore = Math.max(3, Math.min(10, Math.round(accuracyScore * 0.6 + confidenceScore * 0.4)));
      const problemSolvingScore = Math.max(3, Math.min(10, Math.round(accuracyScore * 0.6 + completenessScore * 0.4)));

      // Missing points generator
      let missingPoints = q.missingPoints || [];
      if (missingPoints.length === 0 && missing.length > 0) {
        missingPoints = missing.map(m => `Explanation of key concept: "${m}"`);
      }
      if (missingPoints.length === 0) {
        missingPoints = ["Elaborate further on trade-offs and alternative solutions."];
      }

      // Suggestions generator
      let suggestions = q.improvementSuggestions || [];
      if (suggestions.length === 0) {
        suggestions = [
          "Use concrete real-world code or architectural examples.",
          "Highlight performance and scalability implications."
        ];
      }

      return {
        question: ans.question || q.text,
        answer: mainText || "No main answer recorded.",
        keywords,
        matched,
        coverageScore: Math.round(keywordCoveragePct),
        idealAnswer: q.idealAnswer || q.expectedAnswer || "Explain the concept, state trade-offs, and give an implementation example.",
        missingPoints,
        improvementSuggestions: suggestions,
        scores: {
          accuracy: accuracyScore,
          communication: communicationScore,
          confidence: confidenceScore,
          completeness: completenessScore,
          clarity: clarityScore,
          problemSolving: problemSolvingScore
        },
        followUpQuestion: ans.followUpQuestion || "",
        followUpAnswer: ans.followUpAnswer || ""
      };
    });

    const averageResponseTime = Math.round(responseTimeSum / Math.max(1, answers.length));
    const keywordMatchPct = totalKeywordsCount > 0 ? (totalMatchedKeywords / totalKeywordsCount) * 100 : 70;

    const technicalKnowledge = Math.min(100, Math.max(40, Math.round(keywordMatchPct * 0.7 + 30)));
    const problemSolving = Math.min(100, Math.max(40, Math.round(keywordMatchPct * 0.6 + Math.min(40, wordCountSum / 5))));
    const accuracy = Math.min(100, Math.max(35, Math.round(keywordMatchPct)));
    const communication = Math.min(100, Math.max(40, Math.round(Math.min(80, wordCountSum / 6) + 20)));
    const confidence = Math.min(100, Math.max(40, Math.round(90 - Math.abs(20 - averageResponseTime) * 1.2)));
    const behavioralSkills = Math.min(100, Math.max(40, Math.round((communication + confidence) / 2)));
    
    const overallScore = Math.round((technicalKnowledge + problemSolving + accuracy + communication + confidence) / 5);
    const roleReadinessScore = overallScore;

    const verdict = overallScore >= 85 ? "Excellent" :
                    overallScore >= 70 ? "Interview Ready" :
                    overallScore >= 55 ? "Needs Minor Improvement" : "Needs More Practice";

    const strengths = [
      `Demonstrates familiarity with ${selectedRole} domain concepts.`,
      wordCountSum > 100 ? "Communicates responses with substantial depth and length." : "Direct and concise answering style.",
      communication >= 65 ? "Articulates ideas in a structured and understandable manner." : "Attempts to structure responses logically.",
      confidence >= 65 ? "Maintains confident delivery throughout the session." : "Shows potential to grow in confidence with more practice."
    ];
    const weakAreas = [
      totalMatchedKeywords < totalKeywordsCount ? "Missed some essential technical keywords and deep dive concepts." : "Could improve speed of structured technical delivery.",
      "Consider covering non-happy path failure modes and system bounds."
    ];
    const recommendedTopics = [`Advanced ${selectedRole} Architecture`, "System Design Trade-offs & Edge Cases"];
    const suggestedResources = [
      { title: `${selectedRole} Interview Guide & Best Practices`, type: "Docs" },
      { title: "System Design & Algorithm Patterns", type: "Course" }
    ];

    const hiringRecommendation = overallScore >= 80 ? "STRONG HIRE" :
                                 overallScore >= 60 ? "HIRE" : "NEEDS PRACTICE";

    return {
      type: 'Technical',
      selectedRole,
      overallScore,
      roleReadinessScore,
      verdict,
      metrics: {
        technicalKnowledge,
        problemSolving,
        accuracy,
        communication,
        confidence,
        behavioralSkills,
        averageResponseTime
      },
      strengths,
      weakAreas,
      recommendedTopics,
      suggestedResources,
      hiringRecommendation,
      answers: evaluatedAnswers,
      date: new Date().toLocaleDateString(),
      duration: Math.max(1, Math.round(responseTimeSum / 60)) + "m"
    };
  }

  static async evaluateHrInterview(questions, answers) {
    const data = await this.safeFetchJson("/api/evaluate-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedRole: "General HR Role", round: "hr", answers })
    });

    if (data && !data.error) {
      if (Array.isArray(data.answers)) {
        return {
          ...data,
          date: data.date || new Date().toLocaleDateString()
        };
      } else if (Array.isArray(data)) {
        const local = this.getLocalHrEvaluation(questions, answers);
        return {
          ...local,
          answers: data,
          date: new Date().toLocaleDateString()
        };
      }
    }

    console.warn("LLM evaluation failed or returned invalid format, falling back to local HR analysis:", data);
    return this.getLocalHrEvaluation(questions, answers);
  }

  static getLocalHrEvaluation(questions, answers) {
    let wordCountSum = 0;
    let responseTimeSum = 0;
    let totalKeywordsCount = 0;
    let totalMatchedKeywords = 0;

    const evaluatedAnswers = answers.map((ans, idx) => {
      const q = questions.find(item => item.text === ans.question) || questions[idx] || {
        keywords: ["situation", "task", "action", "result"],
        idealAnswer: "Use the STAR method: Situation, Task, Action, and Result with quantifiable impact.",
        missingPoints: ["Quantifiable impact / Result", "Personal ownership"],
        improvementSuggestions: ["Structure your story clearly."]
      };

      const keywords = (q.keywords && q.keywords.length > 0)
        ? q.keywords
        : ["situation", "action", "result", "teamwork", "learning"];

      const mainText = ans.text || '';
      const followText = ans.followUpAnswer || '';
      const fullUserText = `${mainText} ${followText}`.trim();
      const lowerUserText = fullUserText.toLowerCase();

      const userWords = lowerUserText.split(/\s+/).filter(Boolean);
      wordCountSum += userWords.length;
      responseTimeSum += ans.duration || 18;

      const matched = keywords.filter(keyword => {
        const kwLower = keyword.toLowerCase();
        if (lowerUserText.includes(kwLower)) return true;
        const kwTokens = kwLower.split(/\s+/).filter(w => w.length > 2);
        return kwTokens.length > 0 && kwTokens.every(tok => lowerUserText.includes(tok));
      });

      const missing = keywords.filter(k => !matched.includes(k));
      totalKeywordsCount += keywords.length;
      totalMatchedKeywords += matched.length;

      const keywordCoveragePct = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 75;

      const commScore = Math.max(3, Math.min(10, Math.round(Math.min(70, userWords.length) / 10 + 3)));
      const confScore = Math.max(4, Math.min(10, Math.round(9 - Math.abs(20 - (ans.duration || 18)) * 0.3)));
      const leadScore = Math.max(3, Math.min(10, Math.round((keywordCoveragePct / 100) * 5 + Math.min(5, userWords.length / 15))));
      const adaptScore = Math.max(4, Math.min(10, Math.round(confScore * 0.5 + commScore * 0.5)));
      const teamScore = Math.max(3, Math.min(10, Math.round(leadScore * 0.5 + commScore * 0.5)));
      const profScore = Math.max(4, Math.min(10, Math.round(leadScore * 0.5 + confScore * 0.5)));

      let missingPoints = q.missingPoints || [];
      if (missingPoints.length === 0 && missing.length > 0) {
        missingPoints = missing.map(m => `Highlighting aspects of: "${m}"`);
      }
      if (missingPoints.length === 0) {
        missingPoints = ["Quantify the result or business impact achieved."];
      }

      let suggestions = q.improvementSuggestions || [];
      if (suggestions.length === 0) {
        suggestions = [
          "Follow the STAR method (Situation, Task, Action, Result).",
          "Focus on your specific individual contributions."
        ];
      }

      return {
        question: ans.question || q.text,
        answer: mainText || "No main answer recorded.",
        keywords,
        matched,
        idealAnswer: q.idealAnswer || q.expectedAnswer || "Use STAR framework to articulate clear, impactful examples.",
        missingPoints,
        improvementSuggestions: suggestions,
        scores: {
          communication: commScore,
          confidence: confScore,
          leadership: leadScore,
          adaptability: adaptScore,
          teamwork: teamScore,
          professionalism: profScore
        },
        followUpQuestion: ans.followUpQuestion || "",
        followUpAnswer: ans.followUpAnswer || ""
      };
    });

    const averageResponseTime = Math.round(responseTimeSum / Math.max(1, answers.length));
    const keywordMatchPct = totalKeywordsCount > 0 ? (totalMatchedKeywords / totalKeywordsCount) * 100 : 70;

    const communication = Math.min(100, Math.max(40, Math.round(Math.min(80, wordCountSum / 6) + 20)));
    const confidence = Math.min(100, Math.max(40, Math.round(85 - Math.abs(20 - averageResponseTime) * 1.2)));
    const leadership = Math.min(100, Math.max(40, Math.round(keywordMatchPct * 0.6 + 40)));
    const professionalism = Math.min(100, Math.max(45, Math.round(keywordMatchPct * 0.5 + 45)));
    const teamwork = Math.min(100, Math.max(40, Math.round(communication * 0.5 + leadership * 0.5)));
    const adaptability = Math.min(100, Math.max(40, Math.round(90 - Math.abs(15 - averageResponseTime) * 0.8)));
    
    const overallScore = Math.round((communication + confidence + leadership + professionalism + teamwork + adaptability) / 6);
    const roleReadinessScore = overallScore;

    const behavioralSkills = Math.round((leadership + teamwork + adaptability) / 3);
    const technicalKnowledge = Math.min(100, Math.max(40, Math.round(keywordMatchPct * 0.6 + 40)));
    const problemSolving = Math.min(100, Math.max(40, Math.round((leadership + adaptability) / 2)));

    const verdict = overallScore >= 85 ? "Excellent" :
                    overallScore >= 70 ? "Interview Ready" :
                    overallScore >= 55 ? "Needs Minor Improvement" : "Needs More Practice";

    const strengths = [
      "Articulate delivery with clear professional tone.",
      communication >= 65 ? "Communicates ideas clearly and with good structure." : "Attempts to structure responses logically.",
      confidence >= 65 ? "Demonstrates steady confidence throughout the interview." : "Shows willingness to engage with all questions.",
      leadership >= 65 ? "Shows clear ownership and initiative in past experiences." : "Demonstrates awareness of team dynamics."
    ];
    const weaknesses = [
      "Include more quantifiable metrics when discussing achievements.",
      keywordMatchPct < 50 ? "Responses lack coverage of key behavioral themes (STAR method)." : "Deepen responses with more specific outcome-driven examples."
    ];
    const recommendations = ["Practice speaking out loud using the STAR method (Situation, Task, Action, Result)."];
    const recommendedPractice = ["STAR Method Storytelling", "Executive Presence & Pacing"];

    const hiringRecommendation = overallScore >= 80 ? "STRONG FIT" :
                                 overallScore >= 60 ? "POTENTIAL FIT" : "NEEDS PRACTICE";

    return {
      type: 'HR',
      overallScore,
      roleReadinessScore,
      verdict,
      metrics: {
        technicalKnowledge,
        problemSolving,
        communication,
        confidence,
        behavioralSkills,
        leadership,
        professionalism,
        teamwork,
        adaptability,
        averageResponseTime
      },
      strengths,
      weaknesses,
      recommendations,
      recommendedPractice,
      hiringRecommendation,
      answers: evaluatedAnswers,
      date: new Date().toLocaleDateString(),
      duration: Math.max(1, Math.round(responseTimeSum / 60)) + "m"
    };
  }
}
