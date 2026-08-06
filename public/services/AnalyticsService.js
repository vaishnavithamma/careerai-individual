// Analytics and Badge/Achievement Service for CareerAI

export class AnalyticsService {
  static BADGES = [
    { id: 'tech_expert', name: 'Technical Expert', desc: 'Scored 85+ in Technical Knowledge', icon: '💻' },
    { id: 'problem_solver', name: 'Problem Solver', desc: 'Scored 85+ in Problem Solving', icon: '🧩' },
    { id: 'excellent_comm', name: 'Excellent Communication', desc: 'Scored 85+ in Communication', icon: '📢' },
    { id: 'hr_ready', name: 'HR Ready', desc: 'Scored 80+ overall in HR Interview', icon: '🤝' },
    { id: 'fast_thinker', name: 'Fast Thinker', desc: 'Average response time under 10 seconds', icon: '⚡' },
    { id: 'confident_speaker', name: 'Confident Speaker', desc: 'Scored 85+ in Confidence score', icon: '🎤' }
  ];

  static evaluateAchievements(report) {
    const unlocked = [];

    if (report.type === 'Technical') {
      const { technicalKnowledge, problemSolving, communication, confidence, averageResponseTime } = report.metrics || {};
      if (technicalKnowledge >= 85) unlocked.push('tech_expert');
      if (problemSolving >= 85) unlocked.push('problem_solver');
      if (communication >= 85) unlocked.push('excellent_comm');
      if (confidence >= 85) unlocked.push('confident_speaker');
      if (averageResponseTime && averageResponseTime <= 10) unlocked.push('fast_thinker');
    } else if (report.type === 'HR') {
      const { communication, confidence, averageResponseTime } = report.metrics || {};
      if (report.overallScore >= 80) unlocked.push('hr_ready');
      if (communication >= 85) unlocked.push('excellent_comm');
      if (confidence >= 85) unlocked.push('confident_speaker');
      if (averageResponseTime && averageResponseTime <= 10) unlocked.push('fast_thinker');
    }

    return unlocked;
  }

  static getUnlockedBadges(userId) {
    const key = `unlocked_badges_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  static saveUnlockedBadges(userId, badgeIds) {
    const key = `unlocked_badges_${userId}`;
    const existing = this.getUnlockedBadges(userId);
    const updated = [...new Set([...existing, ...badgeIds])];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }
}
