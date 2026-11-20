// Rendering: the checklist, the guide pane, the roadmap and the cleanup view.
// Everything is built with DOM calls so trophy text is never parsed as HTML.
import {
  FILTERS, GRADE_LABELS, KIND_LABELS, MISSABLE_ID,
  gradeCounts, isMasked, matchesFilter, nextAction, phaseProgress, searchText,
} from './data.js';

const SOURCE_LINKS = {
  PowerPyx: { label: 'PowerPyx — GTA 6 Trophy Guide & Roadmap', url: 'https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/' },
  'Official list': { label: 'Official trophy list — Exophase / PSNProfiles', url: 'https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/' },
  GTABase: { label: 'GTABase — GTA 6 trophy list and tips', url: null },
};

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function gradeChip(grade) {
  return el('span', `grade-chip ${grade}`, GRADE_LABELS[grade]);
}

function flagChips(trophy) {
  const chips = [];
  if (trophy.missable) chips.push(el('span', 'flag-chip missable', 'Missable'));
  if (trophy.unverified) chips.push(el('span', 'flag-chip unverified', 'Unverified'));
  return chips;
}

function displayName(trophy, state) {
  return isMasked(trophy, state.spoilerSafe, state.earned) ? 'Hidden story trophy' : trophy.name;
}

function displayDesc(trophy, state) {
  return isMasked(trophy, state.spoilerSafe, state.earned)
    ? 'Story trophy — hidden until earned.'
    : trophy.description;
}

// ---------- Progress ----------
export function renderProgress(els, trophies, earned) {
  const total = trophies.length;
  const done = earned.size;
  els.progressCount.textContent = `${done} / ${total}`;
  els.progressPct.textContent = `${Math.round((done / total) * 100)}% to platinum`;
  els.progressFill.style.width = `${(done / total) * 100}%`;
  const counts = gradeCounts(trophies, earned);
  els.gradeCounts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const c = counts[grade];
    const span = el('span');
    span.append(el('span', `dot ${grade}`));
    span.append(document.createTextNode(`${GRADE_LABELS[grade]} `));
    span.append(el('b', null, `${c.done}/${c.total}`));
    els.gradeCounts.append(span);
  }
}

// ---------- Strips: next action + missable warning ----------
export function renderStrips(els, data, state, actions) {
  const next = nextAction(data.trophies, data.roadmap, state.earned);
  els.nextUp.replaceChildren();
  els.nextUp.append(el('p', 'strip-label', 'Next action'));
  if (next) {
    els.nextUp.append(el('h2', null, displayName(next.trophy, state)));
    els.nextUp.append(el('p', null, `${next.phase.title} — ${next.trophy.targetLabel ?? next.trophy.description}`));
    const link = el('button', 'nextup-link', 'Open its guide →');
    link.type = 'button';
    link.addEventListener('click', () => actions.select(next.trophy.id));
    els.nextUp.append(link);
  } else {
    els.nextUp.append(el('h2', null, 'Platinum earned — Leonida Legend!'));
    els.nextUp.append(el('p', null, 'Every trophy is ticked. Congratulations.'));
  }

  const missable = data.byId.get(MISSABLE_ID);
  const done = state.earned.has(MISSABLE_ID);
  els.missableWarning.replaceChildren();
  els.missableWarning.classList.toggle('done', done);
  els.missableWarning.append(el('p', 'strip-label', done ? 'Missable — covered' : 'Could you miss it?'));
  els.missableWarning.append(el('h2', null, done ? 'Positive Mental Attitude — done' : '1 possibly missable trophy'));
  els.missableWarning.append(el('p', null, done
    ? 'The Chapter 1 meditation is ticked off. Nothing else on the list can be missed.'
    : 'Positive Mental Attitude: meditate with Lucia on the balcony in Chapter 1, the morning after Down to Earth. It is gone once Chapter 1 ends — see its guide.'));
  if (!done) {
    const link = el('button', 'nextup-link', 'Open its guide →');
    link.type = 'button';
    link.addEventListener('click', () => actions.select(MISSABLE_ID));
    els.missableWarning.append(link);
  }
}

// ---------- Filters ----------
export function renderFilters(els, trophies, state, actions) {
  els.filters.replaceChildren();
  for (const f of FILTERS) {
    const count = trophies.filter((t) => matchesFilter(t, f.id, state.earned)).length;
    const btn = el('button', `filter-chip${state.filter === f.id ? ' active' : ''}`);
    btn.type = 'button';
    btn.append(document.createTextNode(f.label + ' '));
    btn.append(el('span', 'chip-count', String(count)));
    btn.addEventListener('click', () => actions.setFilter(f.id));
    els.filters.append(btn);
  }
}

// ---------- Checklist ----------
export function renderChecklist(els, data, state, actions) {
  const q = state.query.trim().toLowerCase();
  const visible = data.trophies.filter((t) => {
    if (!matchesFilter(t, state.filter, state.earned)) return false;
    if (q && !searchText(t, state.spoilerSafe, state.earned).includes(q)) return false;
    return true;
  });
  els.resultCount.textContent = `${visible.length} of ${data.trophies.length}`;
  els.checklist.replaceChildren();
  if (visible.length === 0) {
    const li = el('li', 'empty-list', 'No trophies match. Clear the search or pick another filter.');
    els.checklist.append(li);
    return;
  }
  for (const t of visible) {
    const li = el('li', `trophy-row${state.selectedId === t.id ? ' selected' : ''}${state.earned.has(t.id) ? ' earned' : ''}`);
    const box = el('input', 'row-check');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${displayName(t, state)} earned`);
    box.addEventListener('change', () => actions.toggleEarned(t.id));
    const main = el('button', 'row-main');
    main.type = 'button';
    const masked = isMasked(t, state.spoilerSafe, state.earned);
    main.append(el('span', `row-name${masked ? ' masked' : ''}`, displayName(t, state)));
    main.append(el('span', 'row-desc', displayDesc(t, state)));
    main.addEventListener('click', () => actions.select(t.id));
    const badges = el('span', 'row-badges');
    badges.append(gradeChip(t.grade));
    for (const chip of flagChips(t)) badges.append(chip);
    li.append(box, main, badges);
    els.checklist.append(li);
  }
}

// ---------- Detail pane ----------
function section(title) {
  const wrap = el('div', 'detail-section');
  wrap.append(el('h3', null, title));
  return wrap;
}

export function renderDetail(els, data, state, actions) {
  const pane = els.detailPane;
  pane.replaceChildren();
  const t = data.byId.get(state.selectedId);
  if (!t) {
    pane.append(el('p', 'detail-empty', 'Pick a trophy on the left to read its guide.'));
    return;
  }
  const masked = isMasked(t, state.spoilerSafe, state.earned);
  const head = el('div', 'detail-head');
  const headText = el('div');
  headText.append(el('h2', `detail-name${masked ? ' masked' : ''}`, displayName(t, state)));
  headText.append(el('p', 'detail-desc', displayDesc(t, state)));
  const meta = el('div', 'detail-meta');
  meta.append(gradeChip(t.grade));
  meta.append(el('span', 'flag-chip', KIND_LABELS[t.kind]));
  for (const chip of flagChips(t)) meta.append(chip);
  headText.append(meta);
  const toggle = el('button', `earned-toggle${state.earned.has(t.id) ? ' earned' : ''}`, state.earned.has(t.id) ? '✓ Earned' : 'Mark earned');
  toggle.type = 'button';
  toggle.addEventListener('click', () => actions.toggleEarned(t.id));
  head.append(headText, toggle);
  pane.append(head);

  if (masked) {
    const note = section('Hidden story trophy');
    note.append(el('p', null, 'Spoiler-safe is on, so this story trophy stays hidden until you earn it. Its name, description and guide are masked — the grade chip above is all the game itself shows before it pops.'));
    note.append(el('p', null, 'Turn spoiler-safe off in the header to read every story guide, or mark this trophy earned to reveal it.'));
    pane.append(note);
    return;
  }

  const guide = section('The plan');
  guide.append(el('p', null, t.guide));
  pane.append(guide);

  const facts = section('When and what you need');
  const kv = el('dl', 'kv');
  kv.append(el('dt', null, 'Earliest chance'));
  kv.append(el('dd', null, t.earliest));
  kv.append(el('dt', null, 'Needs first'));
  kv.append(el('dd', null, t.prerequisites));
  if (t.targetLabel) {
    kv.append(el('dt', null, 'Target'));
    kv.append(el('dd', null, t.targetLabel));
  }
  facts.append(kv);
  pane.append(facts);

  if (t.steps && t.steps.length > 0) {
    const steps = section('Steps');
    const ol = el('ol', 'steps');
    for (const s of t.steps) {
      const li = el('li', null, s.text);
      li.append(el('span', 'src-label', s.source));
      ol.append(li);
    }
    steps.append(ol);
    pane.append(steps);
  }

  const tell = section('How to tell it counted');
  tell.append(el('p', null, t.howToTell));
  pane.append(tell);

  if (t.missable) {
    const warn = el('div', 'callout amber');
    warn.append(el('h3', null, 'Missable — last safe point'));
    warn.append(el('p', null, `Last safe point: ${t.lastSafePoint}`));
    warn.append(el('p', null, `Recovery: ${t.recovery}`));
    pane.append(warn);
  }

  if (t.unverified) {
    const warn = el('div', 'callout purple');
    warn.append(el('h3', null, 'Unverified'));
    warn.append(el('p', null, 'No guide has confirmed this trophy’s trigger with a second source yet. The steps above are the best current report — treat them as a lead, not a promise.'));
    pane.append(warn);
  }

  const sources = section('Sources');
  const ul = el('ul', 'source-list');
  for (const name of t.sources ?? []) {
    const li = el('li');
    const link = SOURCE_LINKS[name];
    if (link && link.url) {
      const a = el('a', null, link.label);
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      li.append(a);
    } else if (link) {
      li.append(document.createTextNode(link.label));
    } else {
      li.append(document.createTextNode(name));
    }
    ul.append(li);
  }
  sources.append(ul);
  pane.append(sources);
}

// ---------- Roadmap ----------
export function renderRoadmap(els, data, state, actions) {
  els.roadmapIntro.textContent = `${data.roadmap.title}: ${data.roadmap.estimate} Each phase opens with the decision it answers; its progress counts the same checklist ticks as the tracker.`;
  els.roadmapPhases.replaceChildren();
  for (const phase of data.roadmap.phases) {
    const { done, total } = phaseProgress(phase, state.earned);
    const card = el('div', 'phase');
    const head = el('button', 'phase-head');
    head.type = 'button';
    const headText = el('div');
    headText.append(el('h2', 'phase-title', phase.title));
    headText.append(el('p', 'phase-decision', phase.decision));
    const prog = el('div', 'phase-progress');
    prog.append(el('span', 'phase-count', `${done} / ${total} earned`));
    const bar = el('div', 'phase-bar');
    bar.append(el('div'));
    bar.firstChild.style.width = `${total ? (done / total) * 100 : 0}%`;
    prog.append(bar);
    head.append(headText, prog);
    head.addEventListener('click', () => actions.togglePhase(phase.id));
    card.append(head);

    const body = el('div', 'phase-body');
    if (state.expandedPhase !== phase.id) body.hidden = true;
    const kv = el('dl', 'kv');
    kv.append(el('dt', null, 'Entry condition'));
    kv.append(el('dd', null, phase.entry));
    kv.append(el('dt', null, 'Time'));
    kv.append(el('dd', null, phase.time));
    body.append(kv);
    body.append(el('p', null, phase.notes));
    const warn = el('div', 'callout amber');
    warn.append(el('p', null, phase.watchOut));
    body.append(warn);
    const chips = el('div', 'phase-trophies');
    for (const id of phase.trophies) {
      const t = data.byId.get(id);
      const chip = el('span', `phase-trophy${state.earned.has(id) ? ' earned' : ''}`);
      const box = el('input', 'pt-check');
      box.type = 'checkbox';
      box.checked = state.earned.has(id);
      box.setAttribute('aria-label', `Mark ${displayName(t, state)} earned`);
      box.addEventListener('change', () => actions.toggleEarned(id));
      const name = el('button', 'pt-name', displayName(t, state));
      name.type = 'button';
      name.addEventListener('click', () => actions.select(id));
      chip.append(box, name, gradeChip(t.grade));
      for (const flag of flagChips(t)) chip.append(flag);
      chips.append(chip);
    }
    body.append(chips);
    card.append(body);
    els.roadmapPhases.append(card);
  }
}

// ---------- Cleanup ----------
export function renderCleanup(els, data, state, actions) {
  const wrap = els.cleanupContent;
  wrap.replaceChildren();
  const remaining = data.trophies.filter((t) => !state.earned.has(t.id));

  const missableGroup = el('div', 'cleanup-group');
  missableGroup.append(el('h2', null, 'The one missable'));
  const missable = data.byId.get(MISSABLE_ID);
  if (state.earned.has(MISSABLE_ID)) {
    missableGroup.append(el('p', null, 'Positive Mental Attitude is earned. Nothing else on the list can be missed.'));
  } else {
    missableGroup.append(el('p', null, 'Only one trophy can slip away — and only in Chapter 1. Everything else stays open in free-roam after the story.'));
    missableGroup.append(cleanupRow(missable, state, actions));
  }
  wrap.append(missableGroup);

  const unverifiedGroup = el('div', 'cleanup-group');
  unverifiedGroup.append(el('h2', null, 'Unverified — methods not yet confirmed'));
  unverifiedGroup.append(el('p', null, 'Five trophies have no confirmed unlock method yet. Their guides carry the best current report, each marked as a lead.'));
  const unverifiedList = el('ul', 'cleanup-list');
  for (const t of data.trophies.filter((x) => x.unverified && !state.earned.has(x.id))) {
    unverifiedList.append(cleanupRow(t, state, actions));
  }
  if (unverifiedList.children.length === 0) {
    unverifiedGroup.append(el('p', 'cleanup-note', 'All five unverified trophies are earned.'));
  } else {
    unverifiedGroup.append(unverifiedList);
  }
  wrap.append(unverifiedGroup);

  const byKind = ['story', 'side', 'collectibles', 'activities', 'robbery', 'misc'];
  for (const kind of byKind) {
    const group = remaining.filter((t) => t.kind === kind);
    if (group.length === 0) continue;
    const sectionEl = el('div', 'cleanup-group');
    sectionEl.append(el('h2', null, `Still to earn — ${KIND_LABELS[kind]}`));
    sectionEl.append(el('p', null, `${group.length} left. Spoiler-safe is ${state.spoilerSafe ? 'on: story trophies stay masked until earned' : 'off: story trophies are shown'}.`));
    const list = el('ul', 'cleanup-list');
    for (const t of group) list.append(cleanupRow(t, state, actions));
    sectionEl.append(list);
    wrap.append(sectionEl);
  }

  if (remaining.length === 0) {
    const done = el('div', 'cleanup-group');
    done.append(el('h2', null, 'Nothing left'));
    done.append(el('p', null, 'Every trophy is earned — the platinum is yours.'));
    wrap.append(done);
  }
}

function cleanupRow(t, state, actions) {
  const li = el('li', 'cleanup-item');
  const box = el('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.id);
  box.setAttribute('aria-label', `Mark ${displayName(t, state)} earned`);
  box.addEventListener('change', () => actions.toggleEarned(t.id));
  const main = el('button', 'row-main');
  main.type = 'button';
  const masked = isMasked(t, state.spoilerSafe, state.earned);
  main.append(el('span', `row-name${masked ? ' masked' : ''}`, displayName(t, state)));
  main.append(el('span', 'row-desc', displayDesc(t, state)));
  main.addEventListener('click', () => actions.select(t.id));
  const badges = el('span', 'row-badges');
  badges.append(gradeChip(t.grade));
  for (const chip of flagChips(t)) badges.append(chip);
  li.append(box, main, badges);
  return li;
}
