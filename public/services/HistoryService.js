// Interview History Persistence Service

export class HistoryService {
  static async saveInterview(userId, report) {
    const record = {
      user_id: userId,
      type: report.type || "Interview",
      overall_score: report.overallScore !== undefined ? report.overallScore : 0,
      duration: report.duration || "0m",
      date: report.date || new Date().toLocaleDateString(),
      report_data: report,
      created_at: new Date().toISOString()
    };

    const isDemoUser = typeof userId === 'string' && (userId.startsWith('local-') || userId.startsWith('demo-'));

    // Try Supabase first
    try {
      const { supabase, toast } = await import('/app.js');
      if (supabase && typeof supabase.from === 'function' && !isDemoUser) {
        const { error } = await supabase
          .from('interview_history')
          .insert(record);
        
        if (!error) {
          console.log("Interview saved successfully to Supabase.");
          this.saveToLocal(userId, record);
          return;
        }
        console.warn("Supabase interview history save error:", error);
        if (typeof toast === 'function') {
          toast("Cloud sync error — interview saved to local storage. Please check your connection or sign in again.", "warning");
        }
      } else if (isDemoUser && typeof toast === 'function') {
        toast("Using local browser session — interview saved locally. Please check your connection or sign in again to sync.", "warning");
      }
    } catch (e) {
      console.warn("Supabase not available or failed, falling back to LocalStorage:", e);
    }

    // Local Storage Fallback
    this.saveToLocal(userId, record);
  }

  static saveToLocal(userId, record) {
    try {
      const key = `demo_interview_history_${userId}`;
      const existing = this.getLocalHistory(userId);
      existing.unshift(record); // newest first
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.error("Local storage save failed:", e);
    }
  }

  static getLocalHistory(userId) {
    try {
      const key = `demo_interview_history_${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Failed to retrieve local history:", e);
      return [];
    }
  }

  static async getInterviews(userId) {
    try {
      const { supabase } = await import('/app.js');
      if (supabase && typeof supabase.from === 'function') {
        const { data, error } = await supabase
          .from('interview_history')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map(row => ({
            type: row.type || "Interview",
            overallScore: row.overall_score !== undefined ? row.overall_score : 0,
            duration: row.duration || "0m",
            date: row.date || new Date().toLocaleDateString(),
            report_data: row.report_data || row
          }));
        }
        if (error) {
          console.warn("Supabase interview_history table missing or query failed. Falling back to LocalStorage:", error.message || error);
        }
      }
    } catch (e) {
      console.warn("Supabase fetch failed, loading local history:", e);
    }

    // Local fallback
    try {
      const local = this.getLocalHistory(userId);
      if (Array.isArray(local)) {
        return local.map(row => ({
          type: row.type || "Interview",
          overallScore: row.overall_score !== undefined ? row.overall_score : 0,
          duration: row.duration || "0m",
          date: row.date || new Date().toLocaleDateString(),
          report_data: row.report_data || row
        }));
      }
    } catch (e) {
      console.error("Local history retrieval failed:", e);
    }
    return [];
  }
}
