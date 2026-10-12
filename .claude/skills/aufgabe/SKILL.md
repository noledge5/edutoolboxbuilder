---
name: aufgabe
description: The standard way to carry out a feature, fix or larger change in the Arbeitsblatt-Baukasten - plan with success criteria, implement on a branch, verify, adversarial review, then commit and push. Use for any task that changes more than a line or two.
---

# Eine Aufgabe erledigen

Claude works like a team of fast junior developers; the user reviews. Follow these steps in order.

## 1. Plan before code
- Read `CLAUDE.md` and, for the area touched, `docs/roadmap.md` and `docs/design/README.md`.
- Write a short plan for the user: what changes (files), what stays out, and **success criteria** that can be checked (a test that must pass, a screen that must look like X, a print that fits on one A4 page).
- If a decision belongs to the user (UI wording, behaviour they will notice, anything in the roadmap's „Entscheidungen“), ask once, with a recommendation. Otherwise decide and move on.

## 2. Branch
- One task, one branch. Use the branch the session names; otherwise `claude/<kurzes-thema>` from the latest `main`. Never commit to `main` directly.

## 3. Tests first where it is logic
- Pure logic (`src/model/`, `src/library/`, `src/sync/merge.ts`, `src/share/grade.ts`, `src/slides/tools.ts` …): write or extend the vitest test first, then the code.

## 4. Verify deterministically
- `npm run typecheck`, `npm test`, `npm run build`. After changing blocks, fields or icons: `npm run anleitung`.
- Visible changes: `npm run build`, `npx vite preview`, drive it with Playwright (Chromium in `/opt/pw-browsers`), take a screenshot and look at it; check print with `page.pdf({ preferCSSPageSize: true, printBackground: true })`. Check iPad width too when the editor changes.

## 5. Adversarial review
- Run the `reviewer` agent on the finished diff. Fix every finding that traces to a real failure; say why you skip the rest.

## 6. Remember
- A decision the user made → `docs/roadmap.md` („Entscheidungen“). A new structure, file or convention → `CLAUDE.md`. Keep both short and current, so the next session does not ask again. `CLAUDE.md` grows with the project: add what this task taught (a rule, a pitfall, a correction from the user), change what has become wrong, and do it in the same commit. When something repeats, suggest a skill, integration or automatic check in one line; build it only when the user says yes.

## 7. Ship
- Commit with a clear German or English message (match `git log`), push the branch. Open a pull request only when the user asks. Tell the user in a few plain sentences what changed, how it was checked, and what they should look at.
