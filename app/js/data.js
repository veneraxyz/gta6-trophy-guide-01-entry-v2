// Guide data: loading, labels, and the decisions the app computes from state.
export const KIND_LABELS = {
  story: 'Story',
  side: 'Side quests',
  collectibles: 'Collectibles',
  activities: 'Activities',
  robbery: 'Robberies',
  misc: 'One-off feats',
};

export const GRADE_LABELS = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

export const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'remaining', label: 'Remaining' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'side', label: 'Side quests' },
  { id: 'robbery', label: 'Robberies' },
];

// The one trophy the guides flag as possibly missable.
export const MISSABLE_ID = 28;

export async function loadGuideData() {
  const [trophiesDoc, roadmapDoc] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/roadmap.json').then((r) => r.json()),
  ]);
  const trophies = trophiesDoc.trophies;
  const byId = new Map(trophies.map((t) => [t.id, t]));
  return { trophies, byId, roadmap: roadmapDoc, sourceDocs: trophiesDoc.sources ?? [] };
}

// A story trophy is masked while spoiler-safe is on and it is not yet earned.
export function isMasked(trophy, spoilerSafe, earned) {
  return spoilerSafe && trophy.kind === 'story' && !earned.has(trophy.id);
}

// The next action is the first unearned trophy in roadmap order.
export function nextAction(trophies, roadmap, earned) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  for (const phase of roadmap.phases) {
    for (const id of phase.trophies) {
      if (!earned.has(id)) return { trophy: byId.get(id), phase };
    }
  }
  return null;
}

export function phaseProgress(phase, earned) {
  const done = phase.trophies.filter((id) => earned.has(id)).length;
  return { done, total: phase.trophies.length };
}

export function gradeCounts(trophies, earned) {
  const out = {};
  for (const t of trophies) {
    out[t.grade] = out[t.grade] ?? { done: 0, total: 0 };
    out[t.grade].total += 1;
    if (earned.has(t.id)) out[t.grade].done += 1;
  }
  return out;
}

// Search text for a trophy. A masked trophy contributes nothing searchable,
// so a search can never leak a hidden story name.
export function searchText(trophy, spoilerSafe, earned) {
  if (isMasked(trophy, spoilerSafe, earned)) return '';
  const steps = (trophy.steps ?? []).map((s) => s.text).join(' ');
  return [trophy.name, trophy.description, trophy.guide, steps].join(' ').toLowerCase();
}

export function matchesFilter(trophy, filter, earned) {
  if (filter === 'all') return true;
  if (filter === 'remaining') return !earned.has(trophy.id);
  if (filter === 'missable') return trophy.missable === true;
  return trophy.kind === filter;
}
