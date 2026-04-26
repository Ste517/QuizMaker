export const STORAGE_KEYS = {
  theme: 'quizmaker-theme',
  history: 'quizmaker-history',
  recentJson: 'quizmaker-recent-json'
};

export const MAX_HISTORY_ITEMS = 10;
export const MAX_RECENT_JSON = 3;

export function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if localStorage is full or disabled
  }
}

export function saveRecentJson(rawText, source = 'manuale', summarizeJson) {
  const trimmed = rawText.trim();
  if (!trimmed) return;
  const summary = summarizeJson(trimmed);
  const items = safeRead(STORAGE_KEYS.recentJson, []).filter(item => item.rawText !== trimmed);
  items.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    savedAt: new Date().toISOString(),
    source,
    rawText: trimmed,
    summary
  });
  safeWrite(STORAGE_KEYS.recentJson, items.slice(0, MAX_RECENT_JSON));
}

export function saveQuizResult(result) {
  const items = safeRead(STORAGE_KEYS.history, []);
  items.unshift(result);
  safeWrite(STORAGE_KEYS.history, items.slice(0, MAX_HISTORY_ITEMS));
}
