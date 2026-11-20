// Progress and settings live only in the browser: localStorage, plus a
// JSON export/import so progress survives a new browser.
const PROGRESS_KEY = 'leonida-legend-progress-v1';
const SETTINGS_KEY = 'leonida-legend-settings-v1';

export function loadProgress() {
  try {
    const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    if (!Array.isArray(raw)) return new Set();
    return new Set(raw.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

export function saveProgress(earned) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

export function loadSettings() {
  try {
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    return { spoilerSafe: raw.spoilerSafe !== false };
  } catch {
    return { spoilerSafe: true };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportProgress(earned, settings) {
  const payload = {
    app: 'leonida-legend',
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    spoilerSafe: settings.spoilerSafe,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

// Parses an imported file. Returns { earned, spoilerSafe } or throws an Error.
export function parseImport(text, validIds) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const list = Array.isArray(raw) ? raw : raw.earned;
  if (!Array.isArray(list)) throw new Error('That file holds no earned list.');
  const earned = new Set(list.filter((id) => Number.isInteger(id) && validIds.has(id)));
  const spoilerSafe = raw && typeof raw === 'object' && typeof raw.spoilerSafe === 'boolean' ? raw.spoilerSafe : true;
  return { earned, spoilerSafe };
}
