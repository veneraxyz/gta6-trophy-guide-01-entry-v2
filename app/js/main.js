// Boot and wiring: state, hash routing, and the actions every view shares.
import { loadGuideData } from './data.js';
import { loadProgress, loadSettings, saveProgress, saveSettings, exportProgress, parseImport } from './store.js';
import {
  renderChecklist, renderCleanup, renderDetail, renderFilters,
  renderProgress, renderRoadmap, renderStrips,
} from './views.js';

const els = {
  progressCount: document.getElementById('progressCount'),
  progressPct: document.getElementById('progressPct'),
  progressFill: document.getElementById('progressFill'),
  gradeCounts: document.getElementById('gradeCounts'),
  nextUp: document.getElementById('nextUp'),
  missableWarning: document.getElementById('missableWarning'),
  filters: document.getElementById('filters'),
  checklist: document.getElementById('checklist'),
  detailPane: document.getElementById('detailPane'),
  roadmapIntro: document.getElementById('roadmapIntro'),
  roadmapPhases: document.getElementById('roadmapPhases'),
  cleanupContent: document.getElementById('cleanupContent'),
  search: document.getElementById('search'),
  resultCount: document.getElementById('resultCount'),
  spoilerToggle: document.getElementById('spoilerToggle'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
};

const state = {
  earned: loadProgress(),
  spoilerSafe: loadSettings().spoilerSafe,
  filter: 'all',
  query: '',
  view: 'tracker',
  selectedId: null,
  expandedPhase: 'p1',
};

let data = null;

function renderAll() {
  renderProgress(els, data.trophies, state.earned);
  renderStrips(els, data, state, actions);
  renderFilters(els, data.trophies, state, actions);
  renderChecklist(els, data, state, actions);
  renderDetail(els, data, state, actions);
  renderRoadmap(els, data, state, actions);
  renderCleanup(els, data, state, actions);
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === state.view);
  });
  for (const view of ['tracker', 'roadmap', 'cleanup']) {
    document.getElementById(`view-${view}`).hidden = state.view !== view;
  }
  els.spoilerToggle.checked = state.spoilerSafe;
}

function syncHash() {
  const parts = ['#', state.view];
  if (state.view === 'tracker' && state.selectedId) parts.push(`/${state.selectedId}`);
  if (state.view === 'roadmap' && state.expandedPhase) parts.push(`/${state.expandedPhase}`);
  const hash = parts.join('');
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

function readHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const view = parts[0];
  if (view === 'tracker' || view === 'roadmap' || view === 'cleanup') state.view = view;
  if (state.view === 'tracker' && parts[1]) {
    const id = Number(parts[1]);
    if (data.byId.has(id)) state.selectedId = id;
  }
  if (state.view === 'roadmap' && parts[1]) {
    const phase = data.roadmap.phases.find((p) => p.id === parts[1]);
    if (phase) state.expandedPhase = phase.id;
  }
}

const actions = {
  select(id) {
    state.selectedId = id;
    state.view = 'tracker';
    renderAll();
    syncHash();
  },
  toggleEarned(id) {
    if (state.earned.has(id)) state.earned.delete(id);
    else state.earned.add(id);
    saveProgress(state.earned);
    renderAll();
  },
  setFilter(id) {
    state.filter = id;
    renderAll();
  },
  setQuery(q) {
    state.query = q;
    renderChecklist(els, data, state, actions);
  },
  setView(view) {
    state.view = view;
    renderAll();
    syncHash();
  },
  togglePhase(id) {
    state.expandedPhase = state.expandedPhase === id ? null : id;
    renderRoadmap(els, data, state, actions);
    syncHash();
  },
};

async function boot() {
  data = await loadGuideData();
  // Default selection: the next action, so the first viewport pairs the
  // checklist with a guide that matters.
  if (state.selectedId === null) {
    const { nextAction } = await import('./data.js');
    const next = nextAction(data.trophies, data.roadmap, state.earned);
    state.selectedId = next ? next.trophy.id : 1;
  }
  readHash();
  renderAll();
  syncHash();

  els.search.addEventListener('input', () => actions.setQuery(els.search.value));
  els.spoilerToggle.addEventListener('change', () => {
    state.spoilerSafe = els.spoilerToggle.checked;
    saveSettings({ spoilerSafe: state.spoilerSafe });
    renderAll();
  });
  els.exportBtn.addEventListener('click', () => exportProgress(state.earned, { spoilerSafe: state.spoilerSafe }));
  els.importFile.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const { earned, spoilerSafe } = parseImport(await file.text(), new Set(data.trophies.map((t) => t.id)));
      state.earned = earned;
      state.spoilerSafe = spoilerSafe;
      saveProgress(state.earned);
      saveSettings({ spoilerSafe });
      renderAll();
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
    event.target.value = '';
  });
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => actions.setView(tab.dataset.view));
  });
  window.addEventListener('hashchange', () => {
    readHash();
    renderAll();
  });
}

boot();
