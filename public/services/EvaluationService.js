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
      return {
        ...data,
        date: new Date().toLocaleDateString()
      };
    }

    console.warn("LLM evaluation failed, falling back to local technical analysis:", data);
    return this.getLocalTechnicalEvaluation(questions, answers, selectedRole);
  }

  static getLocalTechnicalEvaluation(questions, answers, selectedRole) {
    let totalKeywordsCount = 0;
    let totalMatchedKeywords = 0;
    let wordCountSum = 0;
    let responseTimeSum = 0;

    const evaluatedAnswers = answers.map((ans, idx) => {
      const q = questions.find(item => item.text === ans.question) || { keywords: [], idealAnswer: '', missingPoints: [], improvementSuggestions: [] };
      const keywords = q.keywords || [];
      const userText = ans.text || '';
      
      const userWords = userText.toLowerCase().split(/\s+/).filter(Boolean);
      wordCountSum += userWords.length;
      responseTimeSum += ans.duration || 12;

      const matched = keywords.filter(keyword => userText.toLowerCase().includes(keyword.toLowerCase()));
      totalKeywordsCount += keywords.length;
      totalMatchedKeywords += matched.length;

      const coverageScore = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 80;
      
      const accuracyScore = Math.max(2, Math.min(10, Math.round((coverageScore / 10) + 1)));
      const communicationScore = Math.max(3, Math.min(10, Math.round(Math.min(60, userWords.length) / 10 + 3)));
      const confidenceScore = Math.max(4, Math.min(10, Math.round(9 - Math.abs(15 - (ans.duration || 12)) * 0.4)));
      const completenessScore = Math.max(2, Math.min(10, Math.round((accuracyScore * 0.6) + (communicationScore * 0.4))));
      const clarityScore = Math.max(3, Math.min(10, Math.round(accuracyScore * 0.7 + confidenceScore * 0.3)));
      const problemSolvingScore = Math.max(3, Math.min(10, Math.round(accuracyScore * 0.5 + completenessScore * 0.5)));

      return {
        question: ans.question,
        answer: userText,
        keywords,
        matched,
        coverageScore,
        idealAnswer: q.idealAnswer || q.expectedAnswer || "Define technical terms clearly.",
        missingPoints: q.missingPoints || [],
        improvementSuggestions: q.improvementSuggestions || [],
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

    const technicalKnowledge = Math.min(100, Math.round(keywordMatchPct + 15));
    const problemSolving = Math.min(100, Math.round(keywordMatchPct + 10));
    const accuracy = Math.round(keywordMatchPct);
    const communication = Math.min(100, Math.round(Math.min(80, wordCountSum / 10) + 20));
    const confidence = Math.min(100, Math.round(90 - Math.abs(15 - averageResponseTime) * 1.5));
    
    const overallScore = Math.round((technicalKnowledge + problemSolving + accuracy + communication + confidence) / 5);
    const roleReadinessScore = overallScore;

    const strengths = ["Basic capability to answer core programming concepts."];
    const weakAreas = ["Handling boundary cases and high scale limits."];
    const recommendedTopics = ["Edge-case handling in systems design"];
    const suggestedResources = [{ title: "System Design Primer on Github", type: "Repository" }];

    const hiringRecommendation = overallScore >= 80 ? "STRONG HIRE" :
                                 overallScore >= 60 ? "HIRE (With minor training)" : "NEEDS PRACTICE";

    return {
      type: 'Technical',
      selectedRole,
      overallScore,
      roleReadinessScore,
      metrics: {
        technicalKnowledge,
        problemSolving,
        accuracy,
        communication,
        confidence,
        averageResponseTime
      },
      strengths,
      weakAreas,
      recommendedTopics,
      suggestedResources,
      hiringRecommendation,
      answers: evaluatedAnswers,
      date: new Date().toLocaleDateString(),
      duration: Math.round(responseTimeSum / 60) + "m"
    };
  }

  static async evaluateHrInterview(questions, answers) {
    const data = await this.safeFetchJson("/api/evaluate-interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedRole: "General HR Role", round: "hr", answers })
    });

    if (data && !data.error) {
      return {
        ...data,
        date: new Date().toLocaleDateString()
      };
    }

    console.warn("LLM evaluation failed, falling back to local HR analysis:", data);
    return this.getLocalHrEvaluation(questions, answers);
  }

  static getLocalHrEvaluation(questions, answers) {
    let wordCountSum = 0;
    let responseTimeSum = 0;
    let totalKeywordsCount = 0;
    let totalMatchedKeywords = 0;

    const evaluatedAnswers = answers.map((ans, idx) => {
      const q = questions.find(item => item.text === ans.question) || { keywords: [], idealAnswer: '', missingPoints: [], improvementSuggestions: [] };
      const keywords = q.keywords || [];
      const userText = ans.text || '';
      
      const userWords = userText.toLowerCase().split(/\s+/).filter(Boolean);
      wordCountSum += userWords.length;
      responseTimeSum += ans.duration || 14;

      const matched = keywords.filter(keyword => userText.toLowerCase().includes(keyword.toLowerCase()));
      totalKeywordsCount += keywords.length;
      totalMatchedKeywords += matched.length;

      const coverageScore = keywords.length > 0 ? (matched.length / keywords.length) * 100 : 80;
      
      const commScore = Math.max(3, Math.min(10, Math.round(Math.min(60, userWords.length) / 10 + 3)));
      const confScore = Math.max(4, Math.min(10, Math.round(9 - Math.abs(18 - (ans.duration || 14)) * 0.4)));
      const leadScore = Math.max(3, Math.min(10, Math.round((coverageScore / 10) + 1)));
      const adaptScore = Math.max(4, Math.min(10, Math.round(confScore * 0.5 + commScore * 0.5)));
      const teamScore = Math.max(3, Math.min(10, Math.round(leadScore * 0.6 + commScore * 0.4)));
      const profScore = Math.max(4, Math.min(10, Math.round(leadScore * 0.5 + confScore * 0.5)));

      return {
        question: ans.question,
        answer: userText,
        keywords,
        matched,
        idealAnswer: q.idealAnswer || q.expectedAnswer || "Practice structured communication.",
        missingPoints: q.missingPoints || [],
        improvementSuggestions: q.improvementSuggestions || [],
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

    const communication = Math.min(100, Math.round(Math.min(90, wordCountSum / 10) + 15));
    const confidence = Math.min(100, Math.round(85 - Math.abs(18 - averageResponseTime) * 1.2));
    const leadership = Math.min(100, Math.round(keywordMatchPct + 10));
    const professionalism = Math.min(100, Math.round(keywordMatchPct + 15));
    const teamwork = Math.min(100, Math.round(communication * 0.5 + leadership * 0.5));
    const adaptability = Math.min(100, Math.round(90 - Math.abs(12 - averageResponseTime) * 0.8));
    
    const overallScore = Math.round((communication + confidence + leadership + professionalism + teamwork + adaptability) / 6);
    const roleReadinessScore = overallScore;

    const strengths = ["Polite, respectful, and eager to learn."];
    const weaknesses = ["None detected. Solid delivery overall."];
    const recommendations = ["Practice speaking out loud to further polish pacing."];
    const recommendedPractice = ["STAR Method Storytelling", "Active Listening & Empathy Exercises"];

    const hiringRecommendation = overallScore >= 80 ? "STRONG FIT" :
                                 overallScore >= 60 ? "POTENTIAL FIT" : "NEEDS PRACTICE";

    return {
      type: 'HR',
      overallScore,
      roleReadinessScore,
      metrics: {
        communication,
        confidence,
        leadership,
        professionalism,
        teamwork,
        adaptability
      },
      strengths,
      weaknesses,
      recommendations,
      recommendedPractice,
      hiringRecommendation,
      answers: evaluatedAnswers,
      date: new Date().toLocaleDateString(),
      duration: Math.round(responseTimeSum / 60) + "m"
    };
  }
}
