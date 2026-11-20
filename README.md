# Leonida Legend — GTA 6 Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/veneraxyz/gta6-trophy-guide-01-entry-v2/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/veneraxyz/gta6-trophy-guide-01-entry-v2/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

An offline guide and tracker for all 55 GTA 6 trophies on PlayStation 5, built for the [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01). Static files, no build step, no network at runtime — serve `app/` from any static server and it works with the network off.

## What it is

The guide is built around the player's first two decisions: **what to do next, and what could I miss.**

- **Tracker (default view):** a searchable checklist on the left and the selected guide on the right. The first screen shows several checklist rows, one next action, and the one missable warning. Progress is saved in the browser (localStorage) and can be exported to a file and imported back.
- **Next action:** computed from the roadmap — the first unearned trophy in platinum order, always one glance away.
- **Roadmap to Platinum:** five decision phases, each with its entry condition, linked actions, and phase progress computed from the same checklist state.
- **Missables & Cleanup:** the one possibly missable trophy (Positive Mental Attitude) with its last safe point and recovery, the five still-unverified trophies, and everything left to earn, grouped by kind.
- **Spoiler-safe:** story trophy names and descriptions stay hidden until earned. Toggle it in the header.
- **Cited guides:** every trophy gets a guide in this entry's own words — a one-line plan, the earliest verified opportunity, prerequisites, ordered steps with a source label beside each step, and how to tell it counted. The main walkthrough source is PowerPyx's GTA 6 Trophy Guide & Roadmap; names, descriptions and grades are the official list as carried by Exophase and PSNProfiles.

## Run it

```sh
node serve.ts   # serves app/ on http://localhost:8080
```

Or serve `app/` with any static file server.

## Layout

- `app/index.html` — the shell; `app/css/theme.css` — the look; `app/js/` — data, store, views, boot
- `app/data/trophies.json` — the 55 trophies with their guides; `app/data/roadmap.json` — the five phases
- `app/fonts/` — Barlow Condensed + Source Sans 3, vendored as local files
- `screenshots/` — four real renders of the app
- `main.ts` — the entry program: copies `app/` + `screenshots/` to `/output` and writes the dossier

## Sources

- [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/)
- [Exophase — GTA VI trophy list](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/)
- [PSNProfiles — GTA VI trophy list](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi)
- GTABase (trophy list and tips)

Not affiliated with Rockstar Games. No Rockstar logo or artwork is used. License: MIT.
