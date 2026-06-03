# Application Charter: MD-App

| Field | Value |
|---|---|
| Project name | MD-App |
| Project type | Internal team infrastructure — implementation of the MD data layer |
| Parent project | Maximum Documentation (MD) — see `MD_Project_Charter.md` |
| Project sponsor | Head Coach / Team Captain |
| Project lead | App Lead *(to be appointed; distinct from Documentation Captain)* |
| Version | 1.0 — initial architectural decisions |
| Operating model | Phased build, May–September 2026; ongoing maintenance thereafter |
| Reviewed by | *[mentor sign-off]* |

---

## 1. Purpose of this document

This is the architectural decision record for the web application that implements the MD data layer. It is the **companion** to `MD_Project_Charter.md` and is read alongside it.

`MD_Project_Charter.md` defines *what* the system captures — entry types, fields, triggers, time budgets, quality bars, operating rhythms. `MD_App_Charter.md` (this document) defines *how* the system captures it — the user interface, storage layer, computation, permissions, deployment.

The split exists because the *what* is durable and the *how* is replaceable. We could in principle move from this app to a different implementation without changing MD's entry taxonomy or rules. The reverse is not true — if MD's entry taxonomy changes, the app must change to match.

## 2. Relationship to the MD charter

The contract between the two documents:

- **MD is authoritative on data semantics.** Field names, triggers, time budgets, quality bars, and the entry taxonomy live in `MD_Project_Charter.md`. The app implements them; it does not redefine them.
- **The app is authoritative on implementation details.** Database schema, UI flows, auth model, hosting choices, and dependency versions live here. MD doesn't dictate them.
- **Bidirectional iteration is allowed but tracked.** If MD changes (e.g., a new field is added to Decision Log), the app charter changelog records the responsive change. If an app limitation forces an MD change (e.g., "we discovered photo uploads can't exceed 25MB so MD's Outreach Log template must note this"), the MD charter is updated *first*, and this charter records the trigger.
- **Single source of truth per concern.** MD never duplicates implementation details; this charter never duplicates field-level data definitions. When in doubt, MD wins on *what* and this document wins on *how*.

## 3. Toolchain decision

After comparing four options (Notion, Google Sheets + Forms, Discord bot + Drive hybrid, custom web app), **Option D — custom web app** was selected.

Reasoning recorded for posterity (full analysis is in the chat that led to this charter):

1. **Role-based access at the row level was the deciding factor.** The MD operating model requires that the Documentation Captain has full access while general members are restricted to their own entries. None of Notion, Sheets, or Discord supports this natively without workarounds that introduce their own failure modes. PostgreSQL row-level security via Supabase implements this directly.

2. **Conditional and triggered fields require real form logic.** The Decision Log trigger table (FMEA required when X, sensitivity required when Y) is a hack in Notion and Sheets and is native in a custom UI.

3. **Auto-compute on Test Logs and dashboard rollups are first-class in a custom app.** Statistical treatment, confidence intervals, comparison-to-prior, and KPI aggregation are all backend operations that run cleanly on a relational database and are clunky in the other options.

4. **The development cost objection — typically the reason teams stay on Notion — is removed.** The build will be Claude-generated with mentor code review. Student dev time is bounded (target ≤4 hr/week per contributor) rather than unbounded.

5. **The system itself becomes engineering portfolio evidence.** A team that built their own documentation infrastructure tells a different story to judges than a team that filled out forms in a third-party tool. This is a legitimate Inspire / Control / Innovate cross-cut.

Alternatives considered:

- **Option A (Notion):** Fastest to operational. Rejected on row-level access, conditional fields, and a documented mobile typing latency issue.
- **Option B (Sheets + Forms):** Best for math. Rejected on mixed-content handling (photos, narrative), poor dashboard polish, and the fact that the system of record (the sheet) is also what we want to restrict.
- **Option C (Discord + Drive):** Lowest context-switch cost. Rejected because Discord modals can't host long-form entries and the bot is itself a custom build (no escape from maintenance, only relocation of it).

## 4. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js (latest stable, App Router) | React-based, server components reduce client JS, file-based routing is teachable to incoming devs, very well documented |
| UI / styling | Tailwind CSS | Utility-first, no separate CSS files, fast iteration, well documented |
| Component library | shadcn/ui | Copy-paste components built on Radix primitives; we own the code rather than depending on a versioned library |
| Backend / database | Supabase (PostgreSQL) | Relational schema fits MD's entry taxonomy directly; row-level security is the access model we need; free tier sufficient |
| Auth | Supabase Auth | Email/password + magic link; integrates with row-level security |
| File storage | Supabase Storage | Photos, videos, attached PDFs/CAD; integrates with database |
| Hosting | Vercel | First-party Next.js host; free tier sufficient; preview deployments per branch are useful for iteration |
| AI integration | Claude API (via server-side calls) | Weekly classification pass, gap analysis, handoff drafts |
| Source control | GitHub (private team org repo) | Standard; mentor code review happens via pull requests |

Free-tier sizing check: Supabase free tier provides 500 MB database, 1 GB file storage, 50K monthly active users. One FTC team produces an estimated ≤50 MB/year of entries plus ~2–5 GB/year of photos. **Photos will exceed Supabase free storage**; mitigation is to store photos in Google Drive (which the team already has) and store URLs in Supabase. Database stays well under the 500 MB limit.

## 5. Architecture sketch

```
                  ┌─────────────────────────────────┐
                  │  Next.js app (Vercel)           │
                  │  ─────────────────────────────  │
                  │  Phone-friendly capture forms   │
                  │  Documentation Captain dash     │
                  │  Per-entry-type templates       │
                  │  Conditional / triggered fields │
                  │  Real-time KPI views            │
                  └─────────────────────────────────┘
                                ↕ ↕ ↕
                  ┌─────────────────────────────────┐
                  │  Supabase                       │
                  │  ─────────────────────────────  │
                  │  PostgreSQL tables:             │
                  │    session_logs, outreach_logs, │
                  │    meeting_notes, comp_recaps,  │
                  │    decision_logs, hw_changes,   │
                  │    sw_changes, test_logs,       │
                  │    contact_logs, subsys_handoff │
                  │  Supporting tables:             │
                  │    flags, members, roles,       │
                  │    classification_index,        │
                  │    award_criteria_snapshot      │
                  │  Storage bucket: photo_thumbs   │
                  │    (full-res photos: Drive)     │
                  │  Row-level security policies    │
                  │  Triggers: auto-compute on      │
                  │    insert (CI, stddev, deltas)  │
                  └─────────────────────────────────┘
                                ↕
                  ┌─────────────────────────────────┐
                  │  Claude API (server-side)       │
                  │  ─────────────────────────────  │
                  │  Weekly classification pass     │
                  │  Gap analysis prompts           │
                  │  Subsystem Handoff drafts       │
                  │  Voice memo → Session Log       │
                  │  Results written back to DB     │
                  └─────────────────────────────────┘
```

## 6. Role and permission model

Every authenticated user has exactly one role. Row-level security policies in Supabase enforce the permissions.

| Role | Read | Write | Notes |
|---|---|---|---|
| **Documentation Captain** | All entries | All entries; classifications; flags; member roles | Admin equivalent |
| **Deputy Documentation Captain** | All entries | All entries; flags | Same as Captain except cannot modify member roles |
| **Subsystem Documentation Lead** | All entries | All entries for their subsystem; comments on any entry | Owns quality for their subsystem |
| **General team member** | All entries | Create any entry; edit own entries within 24h; read-only after 24h | Default role for students |
| **Mentor** | All entries | None | Read-only oversight |
| **Outreach Reporter** *(per-event role, additive)* | All entries | The Outreach Log they own, indefinitely | Layered on top of base role |

The 24-hour edit window on own entries is a deliberate design: it allows correction-of-fact in the immediate aftermath but freezes the contemporaneous record before memory erodes the original capture. Captain or Deputy can edit any entry at any time (with an `edit_reason` field required for entries older than 24h, creating an audit trail).

## 7. Phased build plan

The build is phased to deliver operational capability incrementally rather than as a single big-bang launch.

| Phase | Target date | Deliverable | "Operational" definition |
|---|---|---|---|
| 1 — Capture MVP | End of June 2026 | Schema for all 10 entry types; capture forms for Tier 1 entries (Session, Outreach, Meeting Notes); basic list view; single-user auth | Team can file Tier 1 entries on summer activities |
| 2 — Tier 2 + auto-compute | End of July 2026 | Decision Log, HW/SW Change Log, Test Log, Contact Log forms; trigger logic; auto-compute on Test Log statistics; photo upload | Full capture coverage |
| 3 — Roles, flags, dashboard | End of August 2026 | RLS policies; flag tracking with overdue alerts; Captain dashboard; KPI rollups; Subsystem Handoff template | System health visible; multi-user discipline enforced |
| 4 — Classification + export | Mid-September 2026 | Weekly Classification Pass integration; classification index view; export/query endpoints for downstream artifact teams; mobile responsiveness | Ready for kickoff |
| 5 — In-season iteration | Ongoing | Reverse-audit-driven changes; game-year overlay fields; bug fixes; mentor code reviews | Continuous |

A **fallback path exists at every phase**: a single Google Form writing to a Supabase table provides emergency capture if the main UI breaks. This is a Phase 1 deliverable. The data lands in the same storage layer regardless of capture surface.

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Mid-season bug breaks capture during build crunch | Medium | High | Fallback Google Form writing to same Supabase tables (Phase 1 deliverable); bug-fix turnaround target of 24h during in-season; rollback to last known good deployment via Vercel |
| Original developer graduates, next captain can't maintain | High (over multi-year horizon) | Medium | Subsystem Handoff for the app itself; boring well-documented tech stack; mentor partnership on code review; mandatory code comments on non-obvious logic |
| Hosting costs spiral | Low | Medium | Vercel + Supabase free tiers sufficient for one team; billing alerts at $5/month threshold |
| Build delay pushes operational date past kickoff | Medium | High | Phased plan with operational milestones at each phase; Phase 1 is enough to start the system; can fall back to Notion if Phase 1 slips past July |
| App becomes a distraction from robot work | Medium | High | Hard cap of 4 hr/week per contributing student; mentor monitors against this; falling back to Notion is the explicit escape valve |
| Schema migration after a season is painful | Medium | Medium | Supabase migrations checked into git; game-year overlay fields added as optional columns rather than schema-breaking changes; quarterly retro reviews any required migrations |
| Photo storage exceeds free tier | High over years | Low | Photos in Drive with URLs in DB; only thumbnails (compressed) in Supabase Storage |
| Auth/security incident exposes team data | Low | High | Supabase Auth is mature; no PII beyond names and team roles; mentor and Captain hold admin keys, not students broadly |
| Vendor lock-in to Supabase | Low | Low | PostgreSQL is portable; export to any other Postgres host requires no schema rewrite; Supabase is open-source and self-hostable as last resort |

## 9. Interface contracts

The boundaries between MD-App and other systems.

**MD-App ↔ MD charter.** When MD's entry taxonomy changes (new field, removed field, changed required-status), an issue is opened against the app repo within 72 hours and resolved before the next quarterly retro. The Charter changelog records both sides.

**MD-App ↔ Downstream artifact teams (portfolio, pit display, presentation, sponsor reports).** The app provides an `/export` endpoint that returns structured JSON for any entry type, filtered by date range, subsystem, or classification tag. Downstream teams pull from this endpoint; they do not query the database directly. This keeps the interface contract small and stable.

**MD-App ↔ Claude API.** All Claude calls go through server-side handlers, never client-side. Prompts are versioned in the repo. Classification results are written to the `classification_index` table with the prompt version, model identifier, and timestamp, so we can reproduce or revise classifications later if criteria change.

**MD-App ↔ Google Drive.** Photos and videos live in Drive (shared with all team members) and the app stores URLs. A nightly script verifies all referenced URLs still resolve; broken links surface in the Friday 15 review.

**MD-App ↔ team Discord.** Slack-style notifications (overdue flags, classification pass complete, new Test Log filed) post to designated Discord channels via webhook. Read-only direction; the app doesn't read from Discord.

## 10. Out of scope for the app

- Portfolio document generation (consumes app data; lives in a separate downstream project)
- Pit display production
- Formal presentation rendering
- Sponsorship pitch decks
- Scouting / match strategy databases (separate workstream entirely)
- Financial bookkeeping
- Anything outside MD's defined scope. The app implements MD; it does not extend it.

## 11. Open questions to settle in the build chat

These are the technical specifics that will be worked out in the dedicated app-build chat, not here:

1. Exact PostgreSQL schema for each entry type (column types, constraints, indexes)
2. Authentication flow specifics (email/password vs. magic link vs. Google OAuth)
3. UI/UX details — design system choices, navigation pattern, mobile breakpoints
4. State management approach in Next.js (server actions vs. client-side form libraries)
5. Testing strategy — unit, integration, end-to-end
6. CI/CD pipeline configuration
7. Backup and disaster recovery plan
8. Onboarding flow for new team members (account creation, role assignment, training)
9. Specific Claude API prompts and their versioning convention
10. The data shape and format of the `/export` endpoint that downstream artifact teams will consume

---

## Charter changelog

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | *[initial date]* | Initial app charter — toolchain decision (Option D, Next.js + Supabase + Vercel), architecture sketch, role-and-permission model, phased build plan, risk register, interface contracts | *[App Lead]* |
