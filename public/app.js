import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://owhsjcqhnnsjirrpypds.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_a0KhOgRRcqNJSAq4H8ieKw_fIWRausn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// -------- Toast --------
function ensureToastContainer() {
  let c = document.querySelector('.toast-container');
  if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
  return c;
}
export function toast(msg, type = 'success') {
  const c = ensureToastContainer();
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

// -------- Theme --------
export function initTheme() {
  const saved = localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', saved);
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      const next = cur === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      renderThemeIcon(btn, next);
    });
    renderThemeIcon(btn, saved);
  });
}
function renderThemeIcon(btn, theme) {
  btn.innerHTML = theme === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

// -------- Nav scroll --------
export function initNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// -------- Helper for local fallback user session --------
function getLocalDemoUser() {
  const str = localStorage.getItem('demo_user');
  if (!str) return null;
  try { return JSON.parse(str); } catch { return null; }
}

function setLocalDemoUser(user) {
  localStorage.setItem('demo_user', JSON.stringify(user));
}

function clearLocalDemoUser() {
  localStorage.removeItem('demo_user');
}

function isNetworkError(err) {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  return msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('enotfound') || err.status === 0;
}

// -------- Auth actions (Supabase + Local fallback) --------
export async function signInWithGoogle() {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard.html' }
    });
    if (error) throw error;
  } catch (err) {
    if (isNetworkError(err)) {
      const demoUser = {
        id: 'demo-google-user',
        email: 'google.user@example.com',
        user_metadata: { full_name: 'Google User' }
      };
      setLocalDemoUser(demoUser);
      window.location.href = '/dashboard.html';
      return;
    }
    throw err;
  }
}

export async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('Supabase offline/unreachable. Falling back to local authentication.');
      const demoUser = {
        id: 'local-' + btoa(email).replace(/=/g, ''),
        email: email,
        user_metadata: { full_name: email.split('@')[0] }
      };
      setLocalDemoUser(demoUser);
      return demoUser;
    }
    throw err;
  }
}

export async function signUpWithEmail(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard.html',
        data: { full_name: fullName }
      }
    });
    if (error) throw error;
    if (data.user) return data.user;
  } catch (err) {
    if (isNetworkError(err)) {
      console.warn('Supabase offline/unreachable. Falling back to local signup.');
      const demoUser = {
        id: 'local-' + btoa(email).replace(/=/g, ''),
        email: email,
        user_metadata: { full_name: fullName || email.split('@')[0] }
      };
      setLocalDemoUser(demoUser);
      return demoUser;
    }
    throw err;
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (e) {
    console.warn('Supabase signOut notice:', e);
  }
  clearLocalDemoUser();
  window.location.href = '/';
}

export async function getUser() {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) return data.user;
  } catch (e) {
    // network or session error
  }
  return getLocalDemoUser();
}

export async function requireUser() {
  const user = await getUser();
  if (!user) { window.location.href = '/login.html'; return null; }
  return user;
}

// -------- Resume data (Supabase + Local storage fallback) --------
export async function saveResumeData(userId, resumeDoc) {
  try {
    const { error } = await supabase
      .from('resumes')
      .upsert({ user_id: userId, ...resumeDoc, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (!error) return;
  } catch (e) {
    console.warn('Supabase saveResumeData fallback to localStorage:', e);
  }
  localStorage.setItem('demo_resume_' + userId, JSON.stringify(resumeDoc));
}

export async function getResumeData(userId) {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data) return data;
  } catch (e) {
    console.warn('Supabase getResumeData fallback to localStorage:', e);
  }
  const local = localStorage.getItem('demo_resume_' + userId);
  return local ? JSON.parse(local) : null;
}

// -------- Animated counter --------
export function animateCounter(el, target, duration = 1500) {
  const start = performance.now();
  const from = 0;
  const suffix = el.dataset.suffix || '';
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const val = Math.floor(from + (target - from) * (1 - Math.pow(1 - p, 3)));
    el.textContent = val.toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// -------- Global init on load --------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNav();
});