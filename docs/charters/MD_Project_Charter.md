# Project Charter & System Design: Maximum Documentation (MD)

| Field | Value |
|---|---|
| Project name | Maximum Documentation (MD) |
| Project type | Internal team infrastructure — evergreen operating system |
| Project sponsor | Head Coach / Team Captain |
| Project lead | Documentation Captain *(to be appointed; rotating annually)* |
| Version | 2.3 — Depth-of-thinking consolidation: Decision Log, Test Log, Software Change Log, Competition Recap, and Subsystem Handoff all updated with new trigger logic, depth fields, AI integration, and process discipline |
| Operating model | Event-driven; runs continuously across offseason and in-season |
| Companion document | `MD_App_Charter.md` — architectural decisions for the web application that implements this data layer |
| Reviewed by | *[mentor sign-off]* |

---

## Executive summary

We placed Inspire 2 at Worlds with documentation that was strong but high-effort to assemble. The bottleneck was not skill or content — it was **capture latency**: the gap between when things happened and when they were written down. By portfolio season the people closest to each decision had moved on, and we reconstructed history from memory and Slack scrollback.

Maximum Documentation (MD) is not a project with a deadline. It is a **standing operating system** for the team — a small set of entry types, each with a defined trigger, owner, template, time budget, and storage location. The same system runs in the offseason when activity is light and during build season when activity is heavy; it simply fires more frequently in the latter.

MD's scope is deliberately bounded to the **data layer**. Story arc construction, portfolio narrative composition, pit display design, formal presentation slide layout, and judging interview prep are *separate downstream projects* that consume MD's outputs. They are not in scope here. However, MD's entry categories are reverse-engineered from what those downstream artifacts will need: every piece of content a judge-facing artifact requires must trace back to a captured data point in MD. The reverse-audit principle (Section 17) is how we keep that contract honest.

The goal is **Inspire 1 at Worlds**, sustained year over year, with documentation that is the strongest single argument we make to the judges.

The implementation of MD's data layer is captured in a companion document, `MD_App_Charter.md`. The split keeps *what we capture* (this charter) durable and *how we capture it* (the app charter) replaceable.

---

# Part I — Charter

## 1. Background and problem statement

Our current documentation has four documented failure modes, all rooted in the same problem:

1. **KPI fragmentation.** Outreach numbers, design iteration counts, autonomous reliability rates, and similar metrics live in different heads, different spreadsheets, and different chat channels. Aggregation takes hours per cycle and the numbers we present are typically undercounts.
2. **Story loss at outreach events.** The specific moment a participant said something powerful, or the moment we converted a parent into a mentor, is rarely captured at the event. By the time someone tries to remember it for the portfolio, it has decayed into "a kid said something nice."
3. **Design iteration drift.** Subsystem teams iterate quickly. The "we tried X, it failed because Y, so we moved to Z" narrative — exactly what Think Award judges want — is rarely captured in real time. We reconstruct it later, which produces tidier but less credible accounts.
4. **End-of-cycle writing burden.** Documentation defaults to "the people who did the work also have to write it up," which means writing competes with building and loses. The result is rushed, after-the-fact summaries written by tired people, not contemporaneous engineering records.

The root cause is not effort. It is the absence of a **system** that makes capture cheaper than not capturing — and that respects a hard time budget so it never feels like overhead.

## 2. Vision — operating state

A team where, on any random day:

- Every meaningful action — a design decision, a build session, an outreach interaction, a code change, a mentor conversation, a sponsor email — is captured **within 24 hours** by the person closest to it, in under five minutes of effort per person per event.
- All captures roll up into a structured data layer that any team member can query.
- Award classification is handled by a weekly Documentation Captain pass, not by the individual at capture time.
- The Documentation Captain can answer "what evidence do we have for each award criterion?" without research.
- Downstream artifact production (portfolio, pit display, presentation, interview prep) is a **curation** task on a complete data layer, not a **creation** task against memory.
- Knowledge transfer to the next year's team happens automatically, because the documentation **is** the knowledge transfer.

The vision is explicitly steady-state, not milestone-based. We are not building toward an event; we are running a process.

## 3. Operating objectives (steady-state KPIs)

These are the system's continuous performance metrics — the equivalent of "uptime" and "latency" for a documentation system. They are not deadlines; they are SLAs the system must hold once operational.

| # | Objective | Measure | Target |
|---|---|---|---|
| O1 | Capture latency | Median hours between event and entry | <24h |
| O2 | Capture compliance | % of triggering events that produce an entry | ≥90% |
| O3 | Time-budget compliance | % of entries filed within their per-person time budget | ≥95% |
| O4 | Flagging integrity | % of Tier 2 entries flagged from their parent Tier 1 entry | ≥90% |
| O5 | Outreach data integrity | % of outreach events with full impact card incl. ≥3 stories | 100% |
| O6 | Decision provenance | % of major design decisions with ≥3 documented alternatives | ≥95% |
| O7 | KPI freshness | Days between last KPI update and current date | ≤7 |
| O8 | Per-person contribution coverage | % of active members with attributed contributions in rolling 4-week window | ≥90% |
| O9 | Award classification freshness | Days since last classification pass | ≤14 |
| O10 | Knowledge transfer coverage | % of subsystems with current handoff doc | 100% |

## 4. Success criteria

The system is operating correctly when all of the following are true at any randomly selected point in the season:

1. A new judge could be handed our raw data layer and reconstruct our season's engineering and outreach narrative without interviewing us.
2. The Documentation Captain can produce evidence sets for each award, ready for downstream artifact production, in under one working day.
3. Any team member can answer "what did we try for [subsystem]?" with a documented iteration log.
4. Every outreach event has at least three named, permission-cleared stories.
5. Capture is not perceived as a burden. Per-person time spent documenting after any single event is consistently under five minutes.
6. An incoming member can read the documentation for a subsystem they have never worked on and be productive within one week.
7. For every judge-facing artifact the team builds, every piece of content traces back to a data point in MD. No artifact content is generated from memory.

## 5. Scope

### In scope
- The capture, storage, and aggregation of all team activity data
- Engineering documentation: design decisions, hardware iterations, software changes, test results
- Outreach documentation: event impact data, individual stories, FIRST conversion metrics, follow-up tracking
- External relationship documentation: mentors, sponsors, universities, alumni, prospective partners
- Team operations: meetings, retrospectives, competitions
- Sustainability artifacts: subsystem handoffs, year-over-year knowledge transfer
- Visual asset capture: documentation photos, hero shots, video clips, sponsor and team-identity assets
- KPI dashboard aggregating all of the above
- Award criterion classification of entries (run as a weekly Documentation Captain pass, not by individual capture authors)
- The reverse-audit process that keeps MD's data categories aligned with downstream artifact needs

### Out of scope (this project)
- **Portfolio narrative composition.** MD produces the evidence; portfolio assembly is a downstream project.
- **Pit display design** (monitors, banners, posters, layout, branding decisions).
- **Formal presentation production** (slide design, speaker scripts, B-roll editing).
- **Judging interview prep cards** (the artifact itself; the underlying data lives in MD).
- **Sponsorship pitch decks and sponsor-facing reports** (consume MD data but produced elsewhere).
- **External-facing social media content.**
- **Detailed financial bookkeeping** (finance team owns this; we ingest summaries).
- **Game-strategy decisions and scouting databases** (separate workstream).

The boundary is enforced this way: MD captures structured data; everything outside MD that uses that data is built by separate projects whose first action is to pull from MD's storage. If a downstream project finds data it needs is not in MD, the fix is to add it to MD, not to capture it ad-hoc inside the downstream project.

## 6. Stakeholders

| Stakeholder | Relationship | Primary need from the system |
|---|---|---|
| Students | Capture producers and consumers | Frictionless capture; clear ownership of each entry type; predictable time budget |
| Subsystem leads | Quality enforcers | Confidence their team is documenting properly |
| Mentors | Oversight | Periodic dashboards proving the system is working |
| Head coach | Sponsor | Award-ready evidence on demand |
| Judges (downstream) | Ultimate consumer | Coherent, quantified, dated, attributed evidence trail |
| Future team members | Inheritors | Searchable, structured handoff content |
| Sponsors | Occasional consumer | Reports and impact data tied to their investment |
| Downstream artifact producers (portfolio team, pit team, presentation team) | Consumers | Clean, queryable, complete data they can pull from |

## 7. Constraints and assumptions

**Constraints**
- Per-person time budget: ≤5 minutes immediate filing after any session or event; ≤5 minutes per Tier 2 specialty entry; ≤30 min/week total for non-leads; ≤3 hr/week for the Documentation Captain
- Hard rule: every entry must be filed within 24 hours of its triggering event. No exceptions.
- Tool budget: prefer free/existing tools; no hard requirement for paid SaaS
- Privacy: all stories involving minors require explicit permission before any downstream artifact uses them
- Manual compliance: per the current FTC Competition Manual, AI assistance is permitted but must be footnoted in produced artifacts; MD itself is an internal data layer and is not subject to portfolio content restrictions

**Assumptions**
- Every team member carries a phone capable of voice memos and photos
- The team has at least one shared cloud storage location (Notion, Google, or equivalent)
- Mentors will support enforcement during the first 4 weeks of rollout
- The Documentation Captain is a student role with formal authority, not just a title
- Game-specific data fields will be added each season as a small overlay on the evergreen core templates

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Capture becomes a chore; compliance decays | High | High | 5/24h rule strictly enforced; tier model puts almost all immediate burden on rotating leads; public dashboard creates social accountability |
| Single point of failure on Documentation Captain | Medium | High | Deputy Captain role; all SOPs written and stored; annual rotation |
| Specialty entries get flagged but never filed | Medium | High | Doc Captain owns the flag queue; Friday 15 includes overdue-flag review; flags >48h overdue escalate to subsystem lead |
| Data silos persist (photos on phone, notes in head) | High | Medium | Single capture surface is the only legitimate entry point; phone auto-sync to shared cloud |
| Privacy violations from minor outreach photos | Low | Critical | Permission integrated into Outreach Log template; default to anonymized until permission confirmed |
| Tooling complexity blocks adoption | Medium | High | Pilot with one subsystem first; expand only after proven; SOPs include the literal click-path |
| Offseason atrophy — system goes dormant | High | Medium | Same entry types and rhythms apply year-round; Friday 15 continues even when activity is low |
| AI-generated content sounds artificial in downstream artifacts | Medium | Medium | Claude is a classifier and formatter, not an author; raw human input always required; downstream artifact production handles final voice |
| Per-person attribution becomes blame-tracking | Low | Medium | Contribution fields capture what each person did, not what they failed to do; retros focus on system, not people |
| Award classification drifts from what judges actually weight | Medium | Medium | Reverse audit runs quarterly using current FTC manual and recent top portfolios as references |

---

# Part II — System architecture

This system is designed with the same engineering rigor as a robot subsystem. It has components, interfaces, performance targets, failure modes, and an iteration philosophy.

## 9. Design principles

These six principles govern every design decision in the system. If a proposed change to the system violates one, the change is rejected.

1. **Capture at point of action.** The person who did the thing writes the entry. Not their team lead, not the Documentation Captain, not the historian writing it up later. The closer in time and space to the action, the higher the information density.
2. **The 5/24 rule.** Each entry takes at most five minutes per person, and every entry is filed within 24 hours of the triggering event. These are hard limits, not targets. A proposed template change that pushes capture past 5 minutes is rejected or restructured.
3. **Tier the burden.** Universal lightweight entries (Tier 1) are filed by rotating leads immediately after sessions and events. Specialty deep entries (Tier 2) are filed by specific assigned owners on a time-shifted basis. No single person should ever face more than one immediate entry after a session.
4. **Flag explicitly, don't trust memory.** When a Tier 1 entry surfaces something that triggers a Tier 2 entry, the Tier 1 entry explicitly flags the Tier 2 owner. The flag becomes a tracked to-do.
5. **Voice and photo over typed prose.** Speech is faster than typing on a phone. A photo plus a one-line caption beats a paragraph. Transcription and formatting are downstream concerns.
6. **One canonical entry point per type.** There is exactly one place to file each entry type. Multiple "valid" capture paths is the same as no path.

## 10. Entry taxonomy

The system defines a fixed set of ten entry types organized into three tiers. Every documented thing is exactly one of these. New entry types may be added only through a Documentation Captain ↔ Head Coach review.

### Tier 1 — Default capture (universal, lightweight, immediate)

Anyone in a triggering situation can be the filer. These are the entries everyone learns first.

| Entry | Trigger | Owner | Immediate time budget | Hard deadline |
|---|---|---|---|---|
| **Session Log** | End of any working session — build, code, design, planning, training, summer activity | Session lead (rotates) | ≤5 min | 24h |
| **Outreach Log** | Every external outreach event — demo, classroom visit, FLL coaching, fair, community appearance | Outreach Reporter (assigned ahead of time) | ≤5 min on-site capture; finalize within 24h | 24h |
| **Meeting Notes** | Every formal team meeting — kickoff, all-hands, strategy, retro, planning | Designated scribe (rotates) | During the meeting | 24h |
| **Competition Recap** | Every competition (qualifier, scrimmage, league meet, regional, super-regional, worlds, off-season) | Documentation Captain facilitates; full team participates | 60-min team meeting at T+48h | 7 days for full draft |

### Tier 2 — Specialty capture (specific owners, deeper content, time-shifted)

Triggered when something substantive happens that needs richer treatment than a Tier 1 entry. Almost always flagged from the parent Tier 1 entry.

| Entry | Trigger | Owner | Time budget | Hard deadline |
|---|---|---|---|---|
| **Decision Log** | Any design or strategy choice with ≥2 alternatives, including software architecture decisions | Whoever proposed the chosen alternative | ≤5 min initial entry; +2 min for outcome update later | 24h initial; outcome filled when tested |
| **Hardware Change Log** | Any physical version change of a mechanism — even small ones (new bracket, revised gear ratio, 3D print revision) | Subsystem lead | ≤5 min | 24h |
| **Software Change Log** | Any code commit that changes robot behavior (pure refactors and formatting commits exempt) | Committing programmer | ≤5 min; ideally written at commit time | 24h |
| **Test Log** | Any quantitative test with a measured result (cycle time, accuracy, reliability over N attempts) | Whoever ran the test | ≤5 min | 24h |
| **Contact Log** | Any substantive contact with an external person — mentor, sponsor, university contact, alumni, industry engineer, prospective partner | Point of contact | ≤5 min | 24h |

### Tier 3 — Annual artifact (curated from Tier 1+2 data, not directly captured)

| Entry | Trigger | Owner | Time budget | Hard deadline |
|---|---|---|---|---|
| **Subsystem Handoff** | Beginning of each new season, or whenever a subsystem lead changes | Outgoing subsystem lead | ~2 hours, once per year per subsystem; generated by reviewing the subsystem's year of Decision Logs, Hardware/Software Change Logs, and Test Logs, then human-edited | 2 weeks after role transition |

Plain names are used everywhere in everyday team operation. Type codes (SL, OL, MN, CR, DL, HCL, SCL, TL, CL, SH) exist only for queries and database tagging.

## 11. Trigger model and flagging mechanism

The system is **fully event-driven**. There is no calendar "everyone fill in documentation now" moment except for the recurring rhythms in Section 14. An entry is created when a triggering event occurs, by the assigned owner, regardless of date.

```
Triggering event ──► Owner identifies entry type ──► Opens template ──► Submits within 24h
                                                                          │
                                                                          ▼
                                                                  Storage (single source)
                                                                          │
                                                                          ▼
                                                  Aggregates into KPI dashboard +
                                                  Story collection + Weekly classification pass
```

### Flagging from Tier 1 to Tier 2

Most Tier 2 entries originate as flags inside a Tier 1 entry. The flagging mechanism is what prevents specialty entries from being forgotten.

Every Session Log, Outreach Log, Meeting Notes, and Competition Recap template ends with a **"Specialty entries triggered"** section. The Tier 1 filer is required to list each specialty entry that should result from the session, with the assigned owner.

```
Specialty entries triggered:
  [ ] Decision Log — owner: [name] — subject: [1 line]
  [ ] Hardware Change Log — owner: [name] — subject: [1 line]
  [ ] Software Change Log — owner: [name] — subject: [1 line]
  [ ] Test Log — owner: [name] — subject: [1 line]
  [ ] Contact Log — owner: [name] — subject: [1 line]
```

The flag creates a tracked to-do for the assigned owner with a 24-hour deadline. The Documentation Captain monitors the open-flag queue and chases any flags that go overdue. Overdue flags are reviewed at Friday 15.

A specialty entry can also be filed without being flagged from a Tier 1 entry (e.g., a Decision Log made during async chat with no parent session) — flagging is the default mechanism, not the only one.

### Submission discipline

- **Same-session preferred** for Session Log, Software Change Log (at commit time), Test Log, Meeting Notes
- **Within 12 hours preferred** for Outreach Log, Decision Log, Hardware Change Log, Contact Log
- **Within 24 hours required** for all entries — no exceptions
- **Within 7 days** for Competition Recap full draft
- **Within 2 weeks** for Subsystem Handoff after role transition

If an event meets multiple triggers (e.g., a build session that produced a design decision and a test result), the session lead files the Session Log and flags the specialty entries to their respective owners. Each specialty entry is filed independently within 24h. The combined per-person burden still respects the 5/24 rule because each owner files at most one specialty entry from a typical session.

### Draft → Complete model

Some entries — Decision Log, Test Log, and Software Change Log — have **depth fields** that take longer than 5 minutes to fill in well (weighted trade-off matrix, FMEA, first-principles math, structured Q&A with the AI, etc.). The 5/24 rule still applies, but to the *initial entry*, not the *complete entry*.

These entries flow through two states:

- **Draft** — initial 5-minute entry submitted within 24 hours. Captures the contemporaneous record (predicted outcome stated at the moment of decision, raw test data the moment it's measured, commit committed the moment it's pushed). The contemporaneous capture is the part that loses credibility if reconstructed later, so it cannot be deferred.
- **Complete** — required depth fields filled in over the following 7 days (Decision Log / Software Change Log) or as soon as auto-compute and depth fields are populated (Test Log). The Documentation Captain reviews any entry stuck in draft state for >7 days at Friday 15 and either chases it to complete or formally downgrades it (with reasoning recorded).

This model preserves the contemporaneous-capture integrity of the 5/24 rule while still allowing entries that need engineering analysis to receive that analysis across multiple sittings rather than slammed in at the end of a build session.

## 12. Data flow

```
Phones (voice + photo + video) ──┐
Capture forms (Notion / Google / Discord bot) ──┼──► Single capture surface ──► Structured storage
Git commits (auto-stub for Software Change Log) ─┘                                    │
                                                                                       │
                                                                                       ├──► KPI dashboard
                                                                                       ├──► Story collection
                                                                                       ├──► Weekly classification index
                                                                                       │     (Doc Captain + Claude tags
                                                                                       │      entries by award/criterion)
                                                                                       ├──► Subsystem iteration histories
                                                                                       ├──► Visual asset library
                                                                                       ├──► Per-person contribution rollup
                                                                                       ├──► Outreach geographic data
                                                                                       └──► Downstream artifact source pulls
                                                                                             (portfolio team, pit team,
                                                                                              presentation team, sponsor reports)
```

The team picks **one** stack from the toolchain options in Section 15. The principle is exactly one canonical input surface and exactly one canonical storage location per entry type, regardless of which tool is chosen.

## 13. Role model

| Role | Term | Time commitment | Responsibilities |
|---|---|---|---|
| Documentation Captain | 1 season | ~3 hr/week | Owns the system; runs Friday 15; manages flag queue; weekly award classification pass; quarterly reverse audit; portfolio handoff to downstream artifact teams |
| Deputy Documentation Captain | 1 season | ~1 hr/week | Backup for Captain; trained to assume role if Captain unavailable |
| Subsystem Documentation Lead | 1 season per subsystem | ~1 hr/week | Owns Decision Log and Hardware Change Log quality for their subsystem; signs off on Subsystem Handoff |
| Outreach Reporter | Per event (rotating) | Event duration + finalize within 24h | Owns Outreach Log for the event including story capture |
| Meeting Scribe | Per meeting (rotating) | During meeting | Owns Meeting Notes |
| Session Lead | Per session (rotating) | End of session | Files Session Log; flags specialty entries to their owners |
| Story Editor | 1 season | ~1 hr/week | Polishes raw story content from Outreach Logs into a curated story library; manages permission tracking |
| Data Custodian | 1 season | ~30 min/week | Maintains KPI dashboard; ensures aggregations are current; maintains visual asset library |

Notes on role design:
- The **Documentation Captain** is the only role that requires significant time. Every other role is a few minutes per week or per event.
- Most roles rotate. The Subsystem Documentation Lead is typically the same person as the Subsystem Lead, so no new headcount.
- Roles rotate **annually** for Captain and Deputy, **per event** for Outreach Reporter, **per meeting** for Scribe, **per session** for Session Lead.
- No member is in more than two documentation roles simultaneously.

## 14. Operating rhythms

Five recurring rhythms layered on top of event-driven captures. These maintain system health and aggregate raw entries into downstream-ready data.

| Rhythm | Cadence | Duration | Owner | Purpose |
|---|---|---|---|---|
| Friday 15 | Weekly | 15 min | Documentation Captain | Review week's entries; clear overdue flags; identify gaps; spot-check quality |
| Weekly Classification Pass | Weekly (separate from Friday 15) | 20 min | Documentation Captain (with Claude) | Tag new entries against current award criteria; update classification index |
| Monthly KPI Sync | First Monday of each month | 30 min | Documentation Captain + Head Coach | Update dashboard; review trends; surface concerns |
| Quarterly System Retro | End of each quarter | 60 min | Documentation Captain + Deputy + Mentors | Iterate on the system itself; run reverse audit (Sec 17); revise SOPs; refresh game-year overlay |
| Quarterly Conversion Audit | End of each quarter (runs adjacent to System Retro) | 30 min | Documentation Captain | Cross-check projected outreach conversions ("X new FLL kids inspired today") against actual FIRST team rosters and Contact Logs; surface the outreach funnel as a dashboard rollup; identify event-type segments with high/low conversion for next-quarter planning |
| Annual Handoff | After last competition of the season | 1 day workshop | Outgoing + incoming Captain | Knowledge transfer; Subsystem Handoffs written |

The Friday 15 and the Weekly Classification Pass together are the most important rhythms. They are what prevent drift. If we skip either for three weeks running, capture compliance will collapse and classification will go stale.

The Quarterly Conversion Audit is the rhythm that lets the team make claims like *"of the 47 new-to-FIRST kids we engaged this season, 8 are now on FLL teams and 3 are on our FTC team"* — the kind of funnel data that distinguishes Inspire-1 outreach evidence from Inspire-2. Rather than burdening each Outreach Log with projected-vs-actual fields the Reporter cannot honestly fill in at the event, the audit pulls the data as a quarterly rollup.

## 15. Toolchain

**Decision: Custom web application (Option D below).** Full architectural rationale, tech stack, role-and-permission model, phased build plan, and risk register live in the companion document `MD_App_Charter.md`. This section summarizes the decision and records the alternatives considered.

### Chosen path

A custom web application built on **Next.js + Supabase + Vercel**, with photos stored in Google Drive (URLs in the database), Claude API integration for weekly classification, and Discord webhooks for notifications. The application is the single canonical capture surface for every entry type. A Google Form fallback writes to the same Supabase tables in case the main UI is unavailable.

The deciding factors:

1. **Row-level access at the entry level.** The Documentation Captain needs full read/write across every entry; general team members need to be limited to editing only their own recent entries. Native PostgreSQL row-level security implements this directly; the other three options can only fake it.
2. **Conditional/triggered fields.** The Decision Log trigger logic (Section 16 quality bars, plus the FMEA / first-principles math / sensitivity-analysis trigger table maintained in the app charter) requires real form logic. This is native in a custom app and a hack in Notion or Sheets.
3. **Auto-compute on Test Logs.** Statistical treatment (confidence intervals, standard deviations, comparison-to-prior) runs as database triggers in the chosen stack rather than as fragile per-cell formulas.
4. **Dev-time objection removed.** The standard reason teams stay on Notion — that custom is too expensive to build — is removed by Claude-generated code with mentor code review and bounded per-student weekly effort.
5. **Engineering portfolio evidence.** Building our own data infrastructure is itself an Inspire / Control / Innovate cross-cut. A team that documents engineering using a tool they engineered tells a different story to judges than a team that filled out third-party forms.

### Alternatives considered

| Option | Summary | Why not chosen |
|---|---|---|
| **A — Notion-centric** | Capture via Notion forms; databases per entry type; rollups for dashboards | Coarse-grained access control; cannot enforce per-entry edit restrictions; conditional fields are hacks; documented mobile typing latency |
| **B — Google Sheets + Forms** | Forms for capture; sheets per entry type; pivot tables for rollups; Apps Script automation | Sheet *is* the system of record, but editing the sheet directly is exactly what we want to restrict; poor handling of mixed-content entries (photos, narrative); dashboards look amateur |
| **C — Discord bot + Drive hybrid** | Slash-command capture; bot writes to backing Sheet; Discord channels as social-accountability dashboard | Discord modals can't host long-form entries (5 text fields max, no rich text); the bot is itself a custom build — no escape from maintenance, only relocation |
| **D — Custom web app** ✓ | Next.js + Supabase + Vercel, photos in Drive, Claude API for classification | Selected. Higher initial build cost is the real trade-off; mitigated by phased plan with operational milestones |

### Tool-independent principles

Regardless of implementation, the following rules apply:

- **Photos** auto-sync from phones to a shared Drive folder; URLs land in entries
- **Voice memos** transcribed via phone OS or Whisper API, then attached to the relevant entry
- **Video clips** stored in a shared Drive folder, linked from the relevant entry
- **Git commits** can include MD-tagged trailers that auto-generate Software Change Log stubs (see SOP-07)
- **Claude** is used for weekly classification, gap analysis, transcript formatting, and downstream artifact draft generation — never as the primary writer of an entry

These principles outlive any specific tool choice and are restated here so they remain part of the data-layer contract.

## 16. Quality standards

Every entry must meet these minimum bars. Entries that fall below are returned to the owner for revision during Friday 15.

| Quality bar | All entries | Applies especially to |
|---|---|---|
| Dated | Every entry has an ISO date | All |
| Attributed | Every entry names the human(s) involved | All |
| Per-person contributions named | For sessions with multiple participants, who did what (1 line per person) | Session Log, Outreach Log, Competition Recap |
| Quantified where possible | Numbers preferred over adjectives | Test Log, Outreach Log, Hardware Change Log |
| Visual evidence | Where physical or visual | Session Log, Hardware Change Log, Outreach Log |
| Permission status | Stories with named minors have explicit permission status | Outreach Log |
| Alternatives documented | Any decision shows ≥3 options considered including paths-not-taken | Decision Log |
| Weighted trade-off matrix | Required when 3+ substantive alternatives AND being wrong would cost >1 build session of rework | Decision Log |
| FMEA table | Required when failure mode could end a match OR pose safety/injury risk | Decision Log |
| First-principles math | Required when decision rests on torque, force, current, voltage, geometry, or timing | Decision Log |
| Sensitivity analysis | Required whenever first-principles math is required (paired) | Decision Log |
| Outcome tracked | Predicted outcome later updated with actual outcome | Decision Log, Hardware Change Log |
| Controlled variables named | Variables held constant during testing listed explicitly | Test Log |
| Repeatability checked | Re-run with different operator or different day, results compared | Test Log |
| Failure modes tracked separately | Failures within trials catalogued by mode, not just summarized in headline statistic | Test Log |
| Sample size justified | Brief reason recorded for why N was chosen (dropdown options or short text) | Test Log |
| Statistical treatment present | Confidence interval (pass/fail) or standard deviation (continuous) computed (auto-computed by app) | Test Log |
| Type of change classified | Software type-of-change selected (control theory / sensor fusion / state machine / algorithm / bug fix / refactor / other) | Software Change Log |
| Verification declared | Reference to a unit test OR explicit reasoning for why unit testing isn't feasible plus integration-test approach | Software Change Log |
| AI deep-dive completed | Programmer engages with AI-driven prompting per `MD_SCL_AI_Integration.md`; transcript retained alongside entry | Software Change Log |
| Structured root-cause analysis | 5-whys applied to up to 3 match-affecting failures | Competition Recap |
| Incoming-lead acceptance | Subsystem Handoff co-signed with confidence rating and 3 first-month dig-deeper items | Subsystem Handoff |
| Prior-season lineage | Link to prior season's handoff for this subsystem + 1-3 bullets on what's changed | Subsystem Handoff |
| Specialty entries flagged | Tier 1 entries flag any Tier 2 entries triggered | Session Log, Outreach Log, Meeting Notes, Competition Recap |

Award/criterion tagging is **not** a per-entry quality bar in v2.0. Classification is done weekly by the Documentation Captain with Claude assistance against the current FTC manual's award criteria. See Appendix A.

## 17. Reverse-audit principle

MD exists to feed downstream judge-facing artifacts. For that contract to stay honest, the entry taxonomy must be tested against what those artifacts actually consume.

**The reverse audit:** Once per quarter (at the Quarterly System Retro), the Documentation Captain walks each intended downstream artifact and asks, for every piece of content that artifact will need:

1. Is there an entry type in MD that captures this?
2. Are the existing template fields sufficient, or are we missing a field?
3. Is the capture cadence right? (e.g., a Hardware Change Log fires once per version — but the portfolio also wants a "hero shot" photo, which is a different cadence)
4. Is the rollup queryable in the way the downstream tool needs it?

Any gap identified is filed as a system iteration item. The reverse audit is the recurring forcing function that prevents MD from becoming detached from what we actually need at competition.

Reference downstream artifacts to audit against (this list updated each season):
- Portfolio (formal submission)
- Pit display: monitors, banners, posters, sponsor wall
- Pit binder (printed reference for judge pit visits)
- Formal judge presentation
- Judging interview prep cards
- Sponsor / award-night handouts
- Per-engineer contribution sheets (for Inspire judging)
- Subsystem one-pagers (engineering binder)

## 18. Iteration philosophy

The documentation system is treated as a subsystem and iterated using the same engineering process the team uses for hardware:

- **Hypothesis** — every template field and SOP exists because we believe it produces good data with acceptable friction.
- **Measurement** — capture latency, time-budget compliance, flag closure rate, and classification freshness are the system's "cycle time" and "accuracy."
- **Failure mode analysis** — at the Quarterly System Retro, we examine where the system failed to capture something important. We trace it to a specific entry type, trigger, or template field, and fix the root cause.
- **Version control** — this charter is versioned. Material changes are tracked in the changelog at the bottom, with rationale, so future Captains understand why the system looks the way it does.
- **App synchronization** — when this charter changes in a way that affects the data model (new field, new entry type, changed required-status), an issue is opened against the MD-App repo within 72 hours per the interface contract in `MD_App_Charter.md` §9. When an app limitation forces a charter change, this charter is updated *first* and the app charter records the trigger. Neither document silently drifts from the other.

This iteration philosophy is itself a Think and Sustain Award asset — it demonstrates that the team applies engineering process to non-mechanical systems.

---

# Part III — Standard Operating Procedures

Each SOP is a short, prescriptive document. Templates are in Part IV.

## SOP-01: Session Log (Tier 1)

**Trigger** — End of any working session: build, code, design, planning, training, summer activity. The trigger fires regardless of season.
**Owner** — Designated session lead (rotates per session).
**Time budget** — ≤5 min immediate.
**Deadline** — Same day strongly preferred; 24h hard cap.
**Format** — Voice memo (≤90s) plus structured form, OR direct typed form.
**Anti-pattern** — Filing the next morning. The 90-second rule on voice memos exists because that's how long it takes to talk through a session without forgetting; pushing it overnight loses specifics.

The session lead is responsible only for filing the Session Log itself; everyone in the session contributes by answering the questions verbally before the recording starts. Per-person contributions are captured in a single field, one line per person.

The session lead must complete the "Specialty entries triggered" section before submitting, naming the owner for each Tier 2 entry.

## SOP-02: Outreach Log (Tier 1)

**Trigger** — Every outreach event — demo, classroom visit, FLL coaching session, community fair, summer demo, anything where the team interacts with people outside the team.
**Owner** — Designated Outreach Reporter for that event (assigned ahead of time).
**Time budget** — ≤5 min on-site capture during the event; finalize within 24h.
**Deadline** — 24h hard cap on final entry.

**Critical** — The Outreach Reporter does **not** run the demo. Their job is to count, photograph, talk to participants, and capture. Trying to run the demo and document it simultaneously is the #1 cause of weak outreach documentation.

Required sub-fields the Reporter cannot leave the event without:
- Event type (one of the nine categories defined on Template T-02)
- Total attendees
- Number with **zero prior FIRST experience**
- Number directly recruited to FLL, FTC, or as mentor/coach
- Location captured as structured city/state (for geographic rollup)
- Engagement-depth multi-select (at least one option checked, or a custom note filled in)
- At least 3 named, permission-status-recorded stories
- At least 3 photos
- At least 1 video clip if the format allows

Optional sub-fields:
- Follow-up plan section. Most large public events will not have structured follow-up and the Reporter should mark "no structured follow-up planned" honestly rather than fabricate one. Individual follow-ups are tracked via flagged Contact Logs, not via fields on the Outreach Log itself.
- Engagement custom note (1-2 sentences) for unusual texture the multi-select options don't capture.

The event-type classification is a single-select dropdown; the engagement-depth field is multi-select so a single event can carry signals like both "hands-on interaction" and "brief walk-by interactions" without conflict (as is typical at a public showcase). The quarterly conversion audit (Section 14) cross-references these fields against Contact Logs and current FIRST team rosters to surface the outreach funnel as a dashboard rollup, rather than asking the Reporter to fill in projected-vs-actual conversion data on every event.

## SOP-03: Meeting Notes (Tier 1)

**Trigger** — Every formal team meeting (kickoff, weekly all-hands, strategy session, retrospective, planning).
**Owner** — Designated Scribe (rotates).
**Time budget** — During the meeting.
**Deadline** — Same day; 24h hard cap.

Standard fields: attendees, decisions made (with flags to Decision Logs if applicable), action items with owner and due date, open questions, flagged specialty entries.

## SOP-04: Competition Recap (Tier 1)

**Trigger** — Every competition: qualifier, scrimmage, league meet, regional, super-regional, worlds, or off-season event.
**Owner** — Documentation Captain facilitates; full team participates.
**Time budget** — 60–90 min team meeting at T+48 hours (the structured root-cause analysis added in v2.3 takes longer than the prior 60-min slot).
**Deadline** — Full draft within 7 days.

**Format** — Structured 60-90 minute meeting using the template in Part IV.

**Captures** — What we did well; what failed (with structured 5-whys root-cause analysis on up to 3 match-affecting failures); what surprised us; what to change before next event; judge feedback in three structured sub-sections (formal interview / Q&A, pit panels with inferred award areas, evidence we didn't include or didn't present best); notable matches with structured narrative on 2-4 standout matches; strategic insights about the game, opponents, or field conditions; alliance partner feedback; opponent strategies worth studying. Judge interactions live entirely in this entry — there is no separate Judge Interaction Log, because recording at competition is restricted.

**Auto-generated companion view (from MD-App)** — Independent of the Reporter's effort, the app generates an event-to-event quantitative comparison from prior Test Logs: autonomous reliability trend, cycle time delta, scoring rate per match, list of new subsystems since last event. This view appears alongside the Comp Recap in the app dashboard, not as a field in the entry.

The Competition Recap also includes a **documentation self-audit** section: what did we fail to capture at this event that we wish we had? Anything surfaced becomes a system iteration item, fed into the next Quarterly System Retro.

## SOP-05: Decision Log (Tier 2)

**Trigger** — Any design or strategy choice that involved comparing ≥2 alternatives, even informally. Includes software architecture decisions.
**Owner** — Whoever proposed the chosen alternative.
**Flagging source** — Usually flagged from the Session Log or Meeting Notes where the decision was made.
**Time budget** — ≤5 min initial entry; +5 to +45 min over the following 7 days for any triggered depth fields; +2 min for outcome update later.
**Deadline** — 24h initial; depth fields complete within 7 days; outcome filled when tested.

**Critical** — The Decision Log is filed **at the moment of decision**, with a *predicted* outcome. The actual outcome is filled in later, after testing. This separation is what produces credible engineering-process evidence. Reconstructed Decision Logs are obvious to experienced judges.

**Draft → Complete model (per Section 11)** — Initial 5-minute entry captures the contemporaneous record. Triggered depth fields are filled in over the following 7 days. The Documentation Captain reviews entries stuck in draft state >7 days at Friday 15.

### Required content beyond standard fields

- ≥3 substantive alternatives considered with brief pros, cons, and predicted performance
- A **paths-not-taken** field: directions considered and excluded *before* the matrix, with rationale (always required)
- Predicted outcome stated as a specific, testable claim
- Later: actual outcome, delta from prediction, what we learned

### Triggered depth fields

Each depth field has its own independent objective trigger. A Decision Log may require zero, one, or all four of these depending on which triggers fire.

| Depth field | Required when… | Time budget |
|---|---|---|
| Weighted trade-off matrix | 3+ substantive alternatives are considered AND being wrong about the choice would cost more than one build session (~4 hours) of rework | +15 min within 7 days |
| First-principles math | The decision rests on torque, force, current, voltage, geometry, or timing — anywhere physics, math, or measurable quantities determine the right answer | +15 min within 7 days |
| Sensitivity analysis | Whenever first-principles math is required (paired) — varies one or more assumptions to test whether the decision still holds | +5 min within 7 days |
| FMEA table | The failure mode of the chosen option could end a match OR pose a safety/injury risk | +30 min within 7 days |

### Trigger application discipline

- The depth-field triggers are self-applied by the filer based on the objective properties of the decision. They are not subjective importance judgments.
- The Documentation Captain spot-checks trigger classification at Friday 15. The Captain has authority to upgrade a Decision Log's required depth.
- The subsystem lead can override a Captain upgrade but must document the reasoning in the entry itself. This creates a record reviewable at Quarterly Retro.
- At Quarterly Retro, the Captain reviews any Decision Log where the design failed and the failure was something the missing depth field would have caught. These become next-season's training examples.

### Prototypes that get abandoned

The matrix trigger applies whether or not the chosen design survives to the final robot. Prototypes the team builds for two weeks and then abandons are exactly the iteration stories Inspire-1 judges reward — their Decision Logs should have the same depth as production-path decisions.

## SOP-06: Hardware Change Log (Tier 2)

**Trigger** — Any physical version change of a mechanism — even small ones. New bracket. Revised gear ratio. 3D print revision. New material.
**Owner** — Subsystem lead.
**Flagging source** — Usually flagged from the Session Log of the session that produced the change.
**Time budget** — ≤5 min.
**Deadline** — 24h after the new version goes on the robot.

Required content:
- Version number (replaces prior version)
- Link to parent Decision Log if applicable
- Photo of v(n) and v(n-1) side by side
- Photo of v(n) in context on the robot
- Measured delta in any performance dimension
- Trade-offs introduced (what got worse, if anything)
- Hero-quality photo of the mechanism (separate from documentation photos) — flagged as a separate asset-capture task if not possible in the moment

## SOP-07: Software Change Log (Tier 2)

**Trigger** — Any commit that changes robot behavior. Pure refactors and formatting commits are exempt.
**Owner** — Committing programmer.
**Flagging source** — The commit itself; the GitHub integration auto-creates a draft SCL from any commit with an `MD-SCL` trailer or matching configured criteria.
**Time budget** — ≤5 min initial entry; AI-prompted deep-dive completes via the integration (typically 5-15 min of conversational Q&A); total per-commit programmer time bounded at ≤20 min for non-trivial commits.
**Deadline** — 24h initial; AI deep-dive complete within 24h of the prompt; programmer review and submit within 48h.

**Critical** — The Software Change Log is uniquely positioned to be **auto-stubbed from git commits**. When a behavior-changing commit lands on a configured branch, the MD-App GitHub integration creates a draft SCL pre-filled with commit hash, author, timestamp, and files-changed metadata, then prompts the programmer with AI-driven follow-up questions tailored to the change. The full specification for this integration is in the companion document `MD_SCL_AI_Integration.md`.

**Draft → Complete model (per Section 11)** — Initial 5-minute baseline entry (committer fills "always required" fields) within 24h. AI-driven deep-dive completes the entry within another 24h. The programmer reviews the assembled draft, edits as needed, and submits.

### Required content (always)

- What changed (plain English, no code, 2-4 sentences)
- Why we changed it (1-2 sentences; link to Decision Log if applicable)
- Type of change (select one: control theory / sensor or sensor fusion / state machine or code structure / algorithm or library / behavior bug fix / behavior-changing refactor / other)
- Hardware/sensors involved
- Game challenge addressed
- Before / after measurable behavior
- Known failure modes / edge cases
- **Verification** — reference to a unit test that covers this change OR explicit reasoning for why unit testing isn't feasible plus the integration-test approach used. This field replaces the v2.0 "telemetry/debug logging plan" field — the goal is to push test-driven discipline, not logging-as-a-substitute-for-testing.
- Branch and commit hash (auto-populated)

### AI-prompted deep-dive

After the baseline is filed, the AI integration generates classification-specific follow-up questions. The programmer answers narrative questions; the AI assembles the responses into a structured deep-dive section of the entry. Full prompt library, classification taxonomy, failure modes, and integration mechanics are specified in `MD_SCL_AI_Integration.md`. Key contract for the programmer:

- AI prompts via the configured chat surface (per `MD_SCL_AI_Integration.md` §11.1)
- Programmer responds in natural language; no field-by-field form filling
- AI never submits autonomously — the programmer always reviews the assembled draft before submitting
- Conversation transcript is retained alongside the entry as a reasoning record

### Fallback when the integration is unavailable

If the AI integration is down, the programmer manually completes the baseline SCL fields and submits with the deep-dive section marked "AI-prompted section pending." The Documentation Captain re-prompts via the integration when it returns. The 24h deadline applies to the baseline; the deep-dive deadline extends until the integration is back.

## SOP-08: Test Log (Tier 2)

**Trigger** — Any quantitative test with a measured result. Cycle time. Accuracy. Reliability over N attempts. Battery drain. Anything with numbers.
**Owner** — Whoever ran the test.
**Flagging source** — Usually flagged from the Session Log.
**Time budget** — ≤5-7 min (auto-compute handles headline statistics so student fills only narrative fields).
**Deadline** — Same day; 24h hard cap.

**Time-series discipline** — Use consistent test labels across the season so that repeat runs aggregate into a series. *"Autonomous reliability — full 30s routine — practice field"* is a test label that will appear many times in a season; the dashboard pulls them all into a single reliability-over-time chart.

**Auto-computed fields (handled by MD-App)** — The app computes the following from raw data the student pastes in:

- Trials run (N) — counted from raw data rows
- Pass rate (for pass/fail tests) — successes ÷ N
- 95% confidence interval — ±1.96 × √(p × (1−p) / N), for pass/fail tests
- Mean — for continuous measurements
- Standard deviation — for continuous measurements
- Min, Max — for continuous measurements
- Last-run lookup and delta — auto-pulled from the most recent Test Log with the same test label

The student never types into auto-computed fields. The form detects test type (pass/fail vs. continuous) from a single radio button at top; the corresponding compute block becomes active.

### Required content

- Test label (consistent across season)
- Hypothesis — what we expected to find before running the test
- Robot version (auto-linked to current Hardware Change Log)
- Field setup description or photo
- Method (numbered steps)
- Raw data (paste one trial per row)
- **Sample size justification** — short answer from a small set of pre-filled options (e.g., "Ran 20, pattern stabilized"; "Ran N, time-constrained, retest planned"; "Ran until each failure mode was seen ≥twice"; "Other — specify"). 30 seconds.
- **Controlled variables** — variables held constant during the test, listed explicitly (battery state, field surface, starting position, operator, lighting, etc.)
- **What failed (separate from the headline statistic)** — failures within trials catalogued by mode rather than summarized in the pass rate. Pattern observations across failures (e.g., "2 of 3 failures were intake misses on the first specimen") are part of this field.
- **Repeatability check** — re-run a subset of trials with a different operator OR on a different day; results compared. (Strong default: ≥5 re-run trials per Test Log on scoring-critical results.)
- Comparison to prior result for this test label (auto-computed; student adds 1-2 sentence interpretation if delta is notable)
- Interpretation (1-3 sentences synthesizing the data)
- Action taken as a result (link to follow-up Decision Log or Hardware Change Log)

The auto-compute and the depth fields together produce Test Logs with statistical honesty, controlled variables, failure-mode awareness, and repeatability — all four Inspire-1-level signals — without requiring statistics expertise from the student.

## SOP-09: Contact Log (Tier 2)

**Trigger** — Any substantive contact with an external person: mentor (existing or prospective), sponsor (existing or prospective), university contact, alumni, industry engineer, FIRST community contact.
**Owner** — Team member who is the point of contact.
**Flagging source** — Usually filed independently; can be flagged from Meeting Notes if the contact occurred during a meeting.
**Time budget** — ≤5 min.
**Deadline** — 24h.

The Contact Log replaces the previous separate Mentor Relationship Log and Sponsor Touchpoint. The relationship type is a field within the entry, not a separate entry type.

Required content:
- Person's name, role, organization
- Relationship type (mentor / sponsor / university / alumni / industry / community / other)
- Current relationship status (prospect / active / dormant / declined)
- How we connected (introduction story, if first contact)
- Topic discussed
- Outcomes and commitments (theirs and ours)
- Follow-up date / next action
- For sponsors: any visual assets received (logos, photos) linked to the asset library

Contact info is stored separately for privacy.

## SOP-10: Subsystem Handoff (Tier 3)

**Trigger** — Beginning of each new season, or whenever a subsystem lead changes.
**Owner** — Outgoing subsystem lead, jointly with incoming subsystem lead.
**Time budget** — ~2 hours of writing by the outgoing lead, plus ~3 hours of structured transition process (split across the four steps below) shared between outgoing and incoming leads.
**Deadline** — Document drafted within 2 weeks of role transition; four-step transition process complete within 4 weeks.

The Subsystem Handoff is **generated from the year's accumulated data**, not written from scratch. The outgoing lead's job is to:

1. Pull the year's Decision Logs, Hardware Change Logs, Software Change Logs, and Test Logs for the subsystem.
2. Use the Claude Subsystem Handoff prompt (Appendix C) to generate a first draft.
3. Edit the draft heavily to surface non-obvious knowledge: design rationale that isn't visible from the hardware, failure modes encountered, things tried that didn't work and why, things not tried but worth trying.
4. Tier the "Key Knowledge" section into Must / Should / Context priority levels so the incoming lead can navigate by attention budget.
5. Reference the prior season's handoff in the "Prior-Season Lineage" field at the top, with 1-3 bullets on what's changed.

### The four-step transition process

The transition between outgoing and incoming lead is not a single conversation. It is a structured four-step process. Each step has a written outcome that updates the handoff document.

**Step 1 — Walkthrough at the robot/mechanism (~45 min)**
Outgoing lead physically walks the incoming lead through the subsystem on the actual robot. Explains *why* each key design choice was made, not just what was built. A mentor is present where possible to witness and ask clarifying questions. Outcome: any new clarifications surfaced are captured directly into the handoff document.

**Step 2 — Document review together (~45 min)**
The two leads read the handoff side-by-side. Incoming lead asks questions; outgoing lead answers; answers update the document. This is the step that surfaces tacit knowledge the outgoing lead forgot to write down because it felt obvious to them.

**Step 3 — Hands-on demonstration (~30-60 min)**
Incoming lead performs ONE routine operation on the subsystem under outgoing-lead observation. Examples: full disassembly + reassembly, a tuning procedure, a known-test re-run. Proves comprehension is operational, not just intellectual.

**Step 4 — Co-sign with confidence rating**
Both leads sign the handoff. Incoming lead rates their confidence (high / medium / low) and, if not "high," names what would move them there. Incoming lead also lists three areas they want to dig deeper on in their first month — these become inputs to the next quarter's Decision Logs and Test Logs.

The Subsystem Handoff is the single most important Sustain Award artifact. Doing this consistently year over year, with the underlying data layer to back it up, is itself the evidence judges look for. The structured four-step process is what turns the handoff from a one-shot document into verifiable knowledge transfer.

---

# Part IV — Templates

These are the literal templates. Copy each into your chosen tool. Field names are intentionally short for fast capture.

## Template T-01: Session Log

```
Date: [auto]
Session lead: [name]
Attendees: [names]
Subsystem(s) worked on: [list]
Duration: [hours]

What did we work on today? (1-3 sentences)
What worked? (1-3 sentences)
What didn't work? (1-3 sentences)
Numbers measured today (if any): [free text]
What's next session? (1-2 sentences)

Per-person contributions (1 line per person):
  - [name]:
  - [name]:
  - [name]:

Photos (1-3): [upload]
Voice memo (optional, ≤90s): [upload]
Video clips (optional): [upload or link]

Specialty entries triggered:
  [ ] Decision Log — owner: [name] — subject:
  [ ] Hardware Change Log — owner: [name] — subject:
  [ ] Software Change Log — owner: [name] — subject:
  [ ] Test Log — owner: [name] — subject:
  [ ] Contact Log — owner: [name] — subject:
```

## Template T-02: Outreach Log

```
Event name:
Date:
Location (city, state — structured for map rollup):
Host organization:
Our team's role: [demo / coaching / workshop / fair table / other]

Event type (select one):
  ( ) Private sponsor or mentor meeting (small, formal)
  ( ) Public robot and FIRST showcase (fair, mall, parade, community event)
  ( ) Presentation or conference we were invited to (structured, we speak)
  ( ) Classroom visit or school assembly (captive student audience)
  ( ) Workshop or training session we host (one-time, hands-on)
  ( ) Recurring program / FLL coaching (repeated engagement with same group)
  ( ) FIRST community engagement (volunteer at event, host scrimmage, mentor another team)
  ( ) Online or virtual outreach (any of the above conducted remotely)
  ( ) Other — specify:

Outreach Reporter: [name]
Team members present: [names]
Per-person contributions (1 line per person, role at event):
  - [name]: [demonstrator / instructor / story capturer / setup / etc.]

==== ATTENDANCE (required) ====
Total attendees:
Of those, number with ZERO prior FIRST experience:
Approximate age range:

==== ENGAGEMENT DEPTH (required: ≥1 box, OR custom note) ====
Multi-select all that apply:
  [ ] Hands-on robot or team interaction (drove the robot, tried a task, helped with something)
  [ ] Sustained engagement (attendees stayed >15 min, OR conversation ran longer than scheduled)
  [ ] Substantive questions about engineering, strategy, team, or program
  [ ] Network expansion (brought others, introduced us to additional people, invited us to further events)
  [ ] Direct interest expressed in joining or supporting (FLL / FTC / mentor / sponsor / donor)
  [ ] Specific next-step commitment made (follow-up meeting scheduled, return visit, intro, donation, etc.)
  [ ] Brief walk-by interactions (some attendees engaged only briefly)
  [ ] Distracted audience or rushed event format

Custom note (optional, 1-2 sentences for unusual texture the options don't cover):

==== FIRST CONVERSION OUTCOMES (required) ====
New FLL participants directly inspired today (names if known):
New FTC participants directly inspired today (names if known):
New mentors / coaches / volunteers who committed today (names):
Existing FIRST community members re-engaged today:

==== STORIES (required, ≥3, named and permission-tracked) ====
Story 1:
  - Person: [name, role, age range]
  - What happened (2-4 sentences):
  - Direct quote (if any):
  - Permission to use in downstream artifacts: [yes / no / pending]
  - Photo of the moment (if any): [upload]

Story 2: [same structure]
Story 3: [same structure]

==== VISUAL CAPTURE ====
Photos (≥3 with captions; permission notes for any minors): [upload]
Video clips (≥1 if format allows): [upload or link]
Sponsor visual assets if applicable: [link to asset library]

==== REFLECTION ====
What worked well:
What we'd do differently next event:

==== FOLLOW-UP PLAN (optional) ====
Select one (or leave blank if no follow-up applies):
  ( ) No structured follow-up planned — public-format event, individual tracking impractical
  ( ) Group follow-up via host (school / org will re-invite us or share contact list)
  ( ) Individual follow-up via Contact Log(s) — list names:
  ( ) Re-engagement of prior outreach — link prior Outreach Log:

Specialty entries triggered:
  [ ] Contact Log — owner: [name] — subject: [new mentor, new sponsor lead, etc.]
```

## Template T-03: Meeting Notes

```
Meeting type: [kickoff / weekly / strategy / retro / planning]
Date: [auto]
Scribe: [name]
Attendees: [names]

Agenda items + outcomes:

Decisions made (link to Decision Logs if applicable):

Action items:
  - Owner: [name] | Action: [...] | Due: [date]
  - Owner: [name] | Action: [...] | Due: [date]

Open questions / parking lot:

Next meeting:

Specialty entries triggered:
  [ ] Decision Log — owner: [name] — subject:
  [ ] Contact Log — owner: [name] — subject:
```

## Template T-04: Competition Recap

```
Competition: [name]
Date(s):
Outcome (advancement, awards, finishing rank):
Recap meeting date: [within 7 days of competition end]
Facilitator: [Documentation Captain]
Attendees: [team members]

==== JUDGING ====

Formal interview / Q&A:
  How did it go (great / good / okay / weak):
  What stood out — questions we answered strongly:
  What stood out — questions that exposed weaknesses or surprised us:
  Specific written or verbal feedback received:

Pit panels — judges we received and inferred award areas:
  Panel 1:
    - Number of judges / lanyard color if visible:
    - Likely award area(s): [Inspire / Think / Connect / Motivate /
                             Innovate / Control / Design / unknown]
    - How it went (1-2 sentences):
  Panel 2: [same structure]
  Panel 3: [same structure]
  (Add additional panels as needed.)

Evidence gaps across all judging at this event:
  What did we fail to include or present the best?
  (Each item becomes a pre-prep item for the next event.)
    -
    -
    -

==== ROBOT PERFORMANCE ====
Match results summary:
Autonomous reliability: [%]
Top scoring strategy used:
Most failure-prone subsystem this event:

==== STRUCTURED ROOT-CAUSE ANALYSIS ====
For up to 3 failures that meaningfully affected the event — caused a match
loss, a missed scoring opportunity worth ≥10 points, or a pit reset — apply
5-whys. Stop earlier than 5 if a real root cause emerges sooner.

Failure 1: [brief description, which match(es) affected]
  Why?       [first-level cause]
  Why?       [why was that the case?]
  Why?       [going deeper]
  Why?       [deeper still]
  Why?       [systemic cause]
  Actionable root cause:
  Owner / next action:
  Specialty entry triggered: [ ] Decision Log [ ] HW Change Log [ ] SW Change Log

Failure 2: [same structure]
Failure 3: [same structure]

Non-match-affecting issues observed (loose bullets, no 5-whys needed):
  -
  -

==== NOTABLE MATCHES ====
For 2-4 matches that stood out — good or bad — capture:

Match [identifier — e.g., "Q7", "SF2 Match 1"]:
  Alliance: [our partner team #s] vs. [opposing team #s]
  Why this match is worth writing about (1-2 sentences):
  Robot performance:
    - Auto outcome: [succeeded / partial / failed, score]
    - Teleop key sequences:
    - Endgame outcome:
  Key takeaway:

(Skip matches that played out as expected — capture only the ones that
revealed something or showcased something. 2-4 matches typical.)

==== STRATEGIC INSIGHTS ====
Things we learned about the game, opponents, or field conditions that we
didn't know going into this event. Each insight is flagged for follow-up.

  - [insight] — Decision Log trigger? [yes / no] — owner: [name]
  - [insight] — Decision Log trigger? [yes / no] — owner: [name]
  - [insight] — Decision Log trigger? [yes / no] — owner: [name]

==== ALLIANCE & SCOUTING ====
Alliance partner(s):
Feedback from alliance partners on our robot:
Notable opponent strategies observed:

==== WHAT WORKED ====
(2-5 bullets — what went better than expected, beyond the match-level
notable-matches section)

==== CHANGES TO MAKE BEFORE NEXT EVENT ====
(2-5 bullets, each with owner and due date — derived from root-cause
analysis, evidence gaps, and strategic insights above)

==== PER-PERSON CONTRIBUTIONS AT EVENT ====
(1 line per attending team member: what they did, what they learned)

==== DOCUMENTATION SELF-AUDIT ====
What did we fail to capture at this event that we wish we had:
What changes to the MD system come out of this event:

==== AUTO-GENERATED COMPANION VIEW (MD-App) ====
(This block is auto-populated by the app from Test Logs filed before, during,
and since the event — no Reporter effort required.)
Autonomous reliability trend:    [event 1] → [event 2] → ... → [this event]
Avg cycle time trend:            ...
Scoring rate (pts/match) trend:  ...
New subsystems since last event: ...

Specialty entries triggered:
  [ ] Hardware Change Log — owner: [name] — subject:
  [ ] Software Change Log — owner: [name] — subject:
  [ ] Decision Log — owner: [name] — subject:
  [ ] Contact Log — owner: [name] — subject: [judges, sponsors met at event]
```

## Template T-05: Decision Log

```
Date: [auto]
Proposer: [name]
Parent Session/Meeting Log: [link]
Subsystem: [dropdown]
Entry state: [draft / complete]

Problem statement (1-3 sentences):
Constraints (bulleted):

==== ALWAYS REQUIRED ====

Alternatives considered (minimum 3, substantive):
  Option A: [description]
    - Pros:
    - Cons:
    - Predicted performance:
  Option B: [description]
    - Pros:
    - Cons:
    - Predicted performance:
  Option C: [description]
    - Pros:
    - Cons:
    - Predicted performance:

Paths not taken (directions considered and excluded BEFORE the matrix, with
rationale — what we ruled out, not what we compared):

Decision: [which option chosen]
Rationale (2-4 sentences):

Predicted outcome (specific, testable):

—— Filled in later ——
Actual outcome:
Delta from prediction:
What we learned:

==== TRIGGERED DEPTH FIELDS ====
Fill in those whose trigger fires. Triggers are objective and apply
independently — a single Decision Log may require 0, 1, or all four.

[ ] Weighted trade-off matrix
    REQUIRED WHEN: 3+ substantive alternatives AND being wrong would cost
    more than one build session (~4 hours) of rework.
    Time budget: +15 min within 7 days.

    Criteria with weights (must sum to 1.0):
      Criterion 1: [name] — weight [0.XX]
      Criterion 2: [name] — weight [0.XX]
      Criterion 3: [name] — weight [0.XX]
      (Add more as needed.)

    Scoring (1-5 per option, per criterion):
      Option A: [scores]
      Option B: [scores]
      Option C: [scores]

    Weighted totals: [auto-computed by app]
    Winner per matrix: [auto]

[ ] First-principles math
    REQUIRED WHEN: decision rests on torque, force, current, voltage,
    geometry, or timing.
    Time budget: +15 min within 7 days.

    Quantities and assumptions:
    Derivation (show the math, with units throughout):
    Result with safety factor / efficiency loss applied:
    Attached: [force diagrams, energy budgets, CAD screenshots, control math]

[ ] Sensitivity analysis (REQUIRED whenever first-principles math is required)
    Time budget: +5 min within 7 days.

    Assumption A: vary by ±20%, does the decision still hold? [yes / no, explain]
    Assumption B: vary by ±20%, does the decision still hold? [yes / no, explain]
    Most fragile assumption (the one closest to flipping the decision):
    What additional measurement would reduce this fragility:

[ ] FMEA table
    REQUIRED WHEN: the failure mode of the chosen option could end a match
    OR pose a safety/injury risk.
    Time budget: +30 min within 7 days.

    Failure mode | Effect on match/team | Severity (1-10) | Likelihood (1-10) | Detectability (1-10) | RPN | Mitigation
    ------------ | ---------------------|---------------- |-------------------|---------------------|-----|-----------
                 |                      |                 |                   |                     |     |
                 |                      |                 |                   |                     |     |

    (RPN = Severity × Likelihood × Detectability. Detectability is inverted:
    10 = invisible until it kills a match. Focus mitigation on highest RPN.)
```

## Template T-06: Hardware Change Log

```
Date: [auto]
Subsystem: [dropdown]
Version: v[n] (replaces v[n-1])
Lead: [name]
Parent Session Log: [link]
Parent Decision Log (if applicable): [link]

What changed in this version (1-3 sentences):
Why we changed it:

Photos (required):
  - v[n-1]: [photo]
  - v[n]: [photo]
  - v[n] in context on robot: [photo]
  - Hero-quality shot (clean composition, portfolio-grade): [photo or flag for separate capture]

Measurable delta from v[n-1]:
  - Metric 1: [name] — was [X], now [Y]
  - Metric 2: [name] — was [X], now [Y]

Trade-offs introduced (what got worse, if anything):

Math / CAD references (if applicable): [attach]
```

## Template T-07: Software Change Log

```
==== AUTO-POPULATED FROM GIT ====
Date:                [auto from commit timestamp]
Committer:           [auto from git author]
Commit hash:         [auto from git]
Branch:              [auto from git]
Files changed:       [auto from git diff]
Parent Decision Log (if applicable): [link]
Entry state:         [draft / complete]

==== ALWAYS REQUIRED ====

Type of change (select one):
  ( ) Control theory (PID, feedback loops, motion profiling)
  ( ) Sensor or sensor fusion
  ( ) State machine / code structure
  ( ) Algorithm or library (vision, ML, pathfinding, signal processing)
  ( ) Behavior bug fix
  ( ) Behavior-changing refactor
  ( ) Other — specify:

What changed (plain English, no code, 2-4 sentences):
  [example: "Replaced bang-bang arm controller with a PID loop driven
   by the through-bore encoder on the arm pivot. Arm now holds setpoint
   within ±2° instead of oscillating between ±15° endpoints."]

Why we changed it (1-2 sentences):

Hardware / sensors involved:

Game challenge addressed:

Before this change (measurable behavior):

After this change (measurable behavior):

Known failure modes / edge cases:

Verification (how this change is proven to work AND to keep working):
  Provide ONE of:
    - Link to unit test(s) that cover this change, OR
    - Explicit reasoning for why unit testing isn't feasible plus the
      integration-test approach used (e.g., Test Log link)

==== AI-PROMPTED DEEP-DIVE ====
(Populated by the GitHub integration. The AI parses the commit, generates
classification-specific questions, and captures the programmer's responses
here. Full spec: MD_SCL_AI_Integration.md.)

Topic 1: [AI-identified topic]
  Q: [...]
  Programmer response: [...]

Topic 2: [AI-identified topic]
  Q: [...]
  Programmer response: [...]

...

Conversation transcript: [link, auto-attached]
Prompt version: [auto-recorded for reproducibility]
```

## Template T-08: Test Log

```
Date: [auto]
Tester(s): [names]
Test label: [example: "Auto reliability — full 30s routine — practice field"]
                 ↑ keep this label IDENTICAL across re-runs so the
                   dashboard stacks them into a time-series
Parent Session Log: [link]

Test type (select one):
  ( ) Pass / fail (binary outcome per trial)
  ( ) Continuous measurement (numeric value per trial)

Hypothesis: [what we expected to find before running]
Robot version: [auto-linked to current Hardware Change Log]
Field setup: [description or photo]

Method (steps):
  1.
  2.
  3.

==== RAW DATA ====
(Paste one trial per row. For pass/fail: "success" or "fail" plus optional
notes. For continuous: just the measured number.)

  Trial 1:
  Trial 2:
  Trial 3:
  ...

==== AUTO-COMPUTED FROM RAW DATA ====
Trials run (N):              [auto-computed]
Pass rate:                   [auto, pass/fail tests]
95% confidence interval:     [auto, pass/fail tests: ±1.96 × √(p(1-p)/N)]
Mean:                        [auto, continuous tests]
Standard deviation:          [auto, continuous tests]
Min / Max:                   [auto, continuous tests]
Comparison to last run:      [auto-looked-up by test label]
  Last run date:              [auto]
  Last run stat:              [auto]
  Delta:                      [auto]

==== REQUIRED DEPTH FIELDS ====

Sample size justification (select one):
  ( ) Ran N, pattern stabilized
  ( ) Ran N, time-constrained, retest planned
  ( ) Ran until each failure mode observed ≥twice
  ( ) Other — specify:

Controlled variables (variables held constant during this test):
  [example: "Battery state — fresh every 5 trials, voltage logged
             Field surface — same practice tiles throughout
             Starting position — taped mark, verified each trial
             Operator — single driver to remove operator variance
             Lighting — constant, no changes during test"]

What failed (separately from the headline statistic):
  Catalog failures by mode rather than summarizing.
  [example: "Trial 4: intake missed first specimen, ran out the clock.
             Trial 11: scoring placement off ~3 in, no score registered.
             Trial 17: intake missed first specimen (same as trial 4).
             Pattern: 2 of 3 failures are intake-misses on first specimen
             — concentrated failure mode, suggests next iteration target."]

Repeatability check:
  Re-run ≥5 trials with a different operator OR on a different day.
  [example: "Re-ran 5 trials next day with a different operator. Got 4/5
             success (consistent with 80–85% range). No new failure modes."]

==== INTERPRETATION ====
Interpretation (1-3 sentences):
  [example: "v4 intake material shows real improvement (+20pp vs v3) but
             failure mode is concentrated. Next iteration should target
             the first-specimen miss specifically. CIs overlap with v3
             so improvement isn't statistically conclusive on N=20; will
             retest at N=40 after next iteration."]
Action taken as result: [link to follow-up Decision Log or Hardware Change Log]
```

## Template T-09: Contact Log

```
Date: [auto]
Logged by: [name]

Contact name:
Role and organization:
Relationship type: [mentor / sponsor / university / alumni / industry / community / other]
Current relationship status: [prospect / active / dormant / declined]

How we connected: [introduction story, if first contact]
Type of contact: [email / call / meeting / site visit / event encounter]
Topic of conversation:
Outcomes / commitments (theirs and ours):
Follow-up date / next action:

For sponsors:
  Visual assets received: [logos, photos — link to asset library]

Contact info: [stored separately for privacy]
```

## Template T-10: Subsystem Handoff

```
Subsystem:
Outgoing lead:
Incoming lead:
Date of handoff:
Status of subsystem at handoff: [working as designed / known issues / in development]

==== PRIOR-SEASON LINEAGE ====
Link to prior season's handoff for this subsystem: [link, or "first season for
                                                     this subsystem"]
What has changed since that handoff (1-3 bullets):
  - [example: "Switched from cascade lift to virtual four-bar (see DL-2026-08-12)"]
  - [example: "Added closed-loop control on arm (see SCL-2026-09-04)"]
  -

==== SYSTEM OVERVIEW ====
What this subsystem does:
How it integrates with the rest of the robot:
Major design decisions in its history (link to Decision Logs):
Current version: v[n] (link to Hardware Change Logs)

==== KEY KNOWLEDGE ====
Tiered by priority — incoming lead reads Must before Step 3 (hands-on demo),
Should in first month, Context as needed.

🔴 MUST KNOW (can't operate this subsystem safely or correctly without this):
  -
  -

🟡 SHOULD KNOW (saves significant time, prevents common mistakes):
  -
  -

🟢 WORTH KNOWING (historical context, things we tried, things we haven't):
  Design rationale that isn't obvious from the hardware:
  Failure modes we've encountered and how we addressed them:
  Things we tried that didn't work (and why):
  Things we haven't tried that we should:

==== OPERATIONAL NOTES ====
How to assemble / disassemble:
Tuning procedure:
Tools required:
Spare parts inventory location:
External vendors / suppliers used:

==== PEOPLE ====
Mentors who helped us on this subsystem (link to Contact Logs):
External engineers consulted (link to Contact Logs):

==== TRANSITION PROCESS RECORD ====
(Filled in as the four-step transition process occurs.)

Step 1 — Walkthrough at robot/mechanism:
  Date completed:
  Mentor witness (if present):
  Clarifications surfaced and added to this document:

Step 2 — Document review together:
  Date completed:
  Sections where the incoming lead had questions (and the answers added):

Step 3 — Hands-on demonstration:
  Date completed:
  Operation performed by incoming lead:
  Observed outcome:

Step 4 — Co-sign:
  Date completed:
  Mentor witness (optional but recommended): [name and date]

==== INCOMING LEAD ACCEPTANCE ====
Incoming lead: [name]
Acceptance date:
Confidence rating: [ ] High [ ] Medium [ ] Low

If not High — what would move you to High?
  [free text]

Three things I want to dig deeper on in my first month:
  1.
  2.
  3.

Outgoing lead signature / handle:
Incoming lead signature / handle:

==== CONTACT ====
Outgoing lead's contact info (for the first month of transition):
```

---

# Part V — Operating across offseason and in-season

The system is structurally the same in both modes. The differences are frequency and emphasis, not entry types.

## Offseason mode (May through early September)

Typical entry frequency:
- Session Log: 2-4 per week (lower velocity than build season; covers training sessions, summer activities, design exploration)
- Decision Log: 1-3 per week during summer design exploration sprints
- Hardware/Software Change Log: 1-3 per week if hardware/code work continues
- Outreach Log: 1-2 per month (summer demos, fairs)
- Contact Log: 1-3 per month (relationship building when not under deadline pressure)
- Subsystem Handoff: written during the offseason rollover period
- Meeting Notes: every team meeting

Offseason emphasis:
- Build the **mentor pipeline** while not under deadline pressure
- Capture **community-building outreach** before the school year resumes
- Run **design exploration sprints** with full Decision Log documentation — these become Innovate Award evidence
- Complete **all Subsystem Handoffs** before kickoff
- Iterate the documentation system itself based on prior-season retros
- Refresh the game-year overlay fields for the new season

The offseason is when the team builds the documentation muscle. Going into kickoff with the system already running smoothly is the difference between making it through build season with intact documentation and reverting to memory-based reconstruction.

## In-season mode (mid-September through Worlds)

Typical entry frequency:
- Session Log: 4-8 per week
- Decision Log: 5-15 per week during peak iteration
- Hardware Change Log: 3-10 per week during peak iteration
- Software Change Log: 5-20 per week
- Test Log: 2-5 per week
- Outreach Log: 1-2 per month during build, then weekly closer to competitions
- Meeting Notes: weekly all-hands + as-needed
- Competition Recap: after every competition

In-season emphasis:
- **Maintain the discipline** that was built in offseason
- Friday 15 and Weekly Classification Pass become non-negotiable
- Doc Captain runs reverse-audit checks more frequently — anything found missing surfaces a fast iteration
- Pre-competition T-72 prep mode: freeze the KPI dashboard, refresh the story collection, drill the team on judging answers using the classification index

## Pre-competition mode (T-7 days through event)

A specific operating mode triggered before each competition:

- T-7 days: KPI dashboard frozen for the event; downstream artifact updates started by their owners (portfolio team, pit team, etc.)
- T-3 days: Story collection refreshed; strongest 5-8 stories per relevant award identified by Story Editor
- T-2 days: Mock judge interview using the classification index as the question bank
- T-1 day: Pit binder assembled by pit team (this is a downstream artifact, but MD provides the source data)
- Competition: Outreach Reporter and Documentation Captain on-site
- T+24 to T+48 hours: Competition Recap

## Year-end mode (after final competition of the season)

- Annual Handoff workshop run
- All Subsystem Handoffs completed within 30 days
- Quarterly System Retro reviews the entire season
- Charter v(n+1) drafted with documented changes
- Documentation Captain rotation handled

---

# Part VI — Appendices

## Appendix A — Award classification process

Award/criterion tagging is **not** a per-entry capture burden in v2.0. Instead, classification is a weekly Documentation Captain rhythm.

### Weekly Classification Pass (20 min, separate from Friday 15)

1. Pull the week's new entries from storage.
2. For each entry, ask Claude to propose award/criterion tags using the classification prompt in Appendix C.
3. Documentation Captain reviews and confirms or corrects each tag.
4. Tags are stored in a separate classification index, not on the entries themselves. This keeps capture clean and allows the same entry to support multiple awards.

### Classification index structure

For each FTC award in the current season's manual, the index lists:
- The award's criteria (verbatim from the current manual)
- For each criterion, a running list of entries that support it
- A health rating per criterion: thin / adequate / strong

This is what the Documentation Captain hands to downstream artifact teams when they ask "what evidence do we have for [award]?"

### Why classification was removed from capture

Three reasons:
1. Awards overlap heavily in topic coverage; the same entry often supports 3-4 awards. Per-entry tagging forced people to either pick one (inaccurate) or list many (slow).
2. The current FTC manual's award criteria can shift year to year. Classifying at capture time bakes in tags that may need re-doing.
3. Removing tagging from capture is the single biggest time-budget recovery — drops every entry's effort by ~30 seconds.

## Appendix B — Reverse-audit process

Run by the Documentation Captain at each Quarterly System Retro.

### Procedure

1. List every judge-facing downstream artifact the team intends to produce in the current season (the list in Section 17).
2. For each artifact, list the content slots it needs (e.g., portfolio needs: per-subsystem narrative, KPI charts, stories, contact list, …).
3. For each content slot, trace it to a specific entry type and field in MD.
4. Identify any slot that cannot be traced — this is a gap.
5. For each gap, decide: add a field to an existing entry, add a new entry type, or change the cadence of existing entries.
6. File gaps as system iteration items with owners and deadlines.

### Reference inputs to the audit
- Current FTC Competition Manual award criteria
- 2-3 top-portfolio examples from prior seasons (Inspire-winning teams; cross-checked against published portfolios like the Hivemind portfolio archive when relevant)
- The downstream artifact teams' own asks (the portfolio team's "what do you need from us" list, etc.)

The audit produces a written log entered as a Meeting Notes entry with all gaps flagged as iteration items.

## Appendix C — Claude prompt library

These prompts operate **on** the data layer; they do not replace human capture. The prompts are batched in two categories: classification/audit prompts (run by Doc Captain) and downstream-handoff prompts (run when feeding downstream artifact teams).

### Classification

**Weekly classification pass**
```
Here are this week's new MD entries: [paste]. For each entry, propose award/criterion tags
against the current FTC Competition Manual award criteria (below). Return a table:
entry_id | proposed_awards | proposed_criteria | confidence | rationale.

Award criteria reference: [paste current manual award section]

Be specific to criteria, not just awards. Flag any entry where you're unsure for human review.
```

**Gap analysis against an award**
```
Here is the classification index for [award name]: [paste]. Identify criteria where evidence is
thin or missing. For each thin criterion, propose 2-3 concrete capture actions in the next two
weeks (e.g., "run a Test Log on autonomous reliability under variable lighting" or "schedule an
outreach event in a Title I school").
```

### Capture support

**Formatting a raw voice memo into a Session Log**
```
Convert this raw build session voice memo into a Session Log using our template. Identify any
decisions, hardware changes, software changes, tests, or external contacts mentioned, and flag
them in the "Specialty entries triggered" section with proposed owners. Raw memo:
[paste transcript]
```

**Polishing a story from an Outreach Log**
```
Polish this raw story from an Outreach Log into a clean version for the story collection.
Preserve the direct quote exactly. Keep it under 100 words. Do not embellish. Raw story:
[paste]
```

### Engineering process support

**Weighted trade-off analysis on a Decision Log**
```
For this decision, run a weighted trade-off analysis. Decision: [describe]. Options: [list].
Criteria with weights: mechanical complexity 0.2, reliability 0.3, cycle time 0.25,
repairability 0.15, weight 0.1. Output a scored matrix, a recommendation, and a 3-sentence
rationale that I can paste into the Decision Log's rationale field.
```

**First-principles derivation check**
```
Here is a Decision Log's math section: [paste]. Sanity-check the derivation for unit consistency,
correct application of physics, and any missing constraints (friction, efficiency losses,
saturation limits, etc.). Suggest corrections if needed.
```

### Downstream-handoff support

These prompts produce the data hand-offs that downstream artifact teams consume. They do not produce final artifacts.

**Subsystem evidence dump**
```
Here is the full year of Decision Logs, Hardware Change Logs, Software Change Logs, and
Test Logs for [subsystem]: [paste]. Produce a structured evidence summary the portfolio team
can use as input: design narrative arc, key iterations, key tests, lessons learned.
Do not write portfolio prose; produce a structured summary.
```

**Subsystem Handoff draft**
```
Here is the year's MD data for [subsystem]: [paste]. Produce a first draft of a Subsystem
Handoff using our SH template. Identify the three most important pieces of non-obvious
knowledge an incoming lead would need.
```

**Interview prep question bank**
```
Here is the classification index and a sample of strong entries: [paste]. Generate the 20 most
likely questions a judging panel will ask, grouped by award. For each, point to the specific
entries that contain the evidence for an answer. Flag any questions we don't yet have
evidence to answer well — these are gaps for the next two-week capture window.
```

## Appendix D — KPI dashboard schema

The dashboard is one page (one screen) showing the current state of the program. Sections:

**Engineering**
- Total Decision Logs filed (season-to-date)
- Average alternatives per Decision Log
- Decision Logs with completed actual-outcome fields: %
- Active versions per subsystem (current Hardware Change Log)
- Test Logs per subsystem
- Autonomous reliability rate (rolling 4-week, from Test Log time-series)
- Cycle time, current vs. season start (from Test Log time-series, per scoring activity)

**Software**
- Software Change Logs filed (season-to-date)
- Control systems currently in use (list with reliability rate)

**Outreach**
- Total events
- Total attendees
- New-to-FIRST count
- New FLL / FTC participants directly inspired
- New mentors / coaches recruited
- Stories with permission cleared
- Active mentor relationships
- Sponsor touchpoints (rolling 4-week)
- Geographic reach map (from Outreach Log location fields)

**Team**
- Per-person contribution rollup (last 4 weeks): each active member with attributed entries
- Capture compliance rate (rolling 4-week)
- Capture latency, median
- Time-budget compliance rate
- Members in active documentation roles
- Subsystems with current Subsystem Handoff

**System health**
- Open flags (overdue Tier 2 entries)
- Friday 15s completed this quarter
- Weekly Classification Passes completed this quarter
- Last Quarterly System Retro date
- Classification index freshness (days since last update)

## Appendix E — Glossary

| Term | Meaning |
|---|---|
| MD | Maximum Documentation (this system) |
| Tier 1 / Tier 2 / Tier 3 | Default capture / specialty capture / annual artifact |
| Session Log | End-of-session lightweight log; replaces former BSC and OAL |
| Outreach Log | Event-based outreach entry; replaces former OIC and absorbs SBE |
| Meeting Notes | Formal meeting record; replaces former MM |
| Competition Recap | Post-competition structured reflection; replaces former CR |
| Decision Log | Design or strategy decision with alternatives; replaces former DDL |
| Hardware Change Log | Mechanism version change; replaces former MIE |
| Software Change Log | Code commit with behavior change; replaces former SCL (name unchanged) |
| Test Log | Quantitative test with measured result; replaces former TPR |
| Contact Log | External relationship contact; replaces former MRL and ST |
| Subsystem Handoff | Year-end knowledge transfer document; replaces former SHD |
| Friday 15 | Weekly 15-minute review by Documentation Captain |
| Weekly Classification Pass | Weekly 20-minute award/criterion tagging by Documentation Captain + Claude |
| 5/24 rule | ≤5 minutes per person per entry; entries filed within 24 hours of trigger |
| Flag / flagging | When a Tier 1 entry lists Tier 2 entries it triggers, with assigned owners |
| Reverse audit | Quarterly check that MD's data layer can supply every downstream judge-facing artifact |
| FIRST conversion | A person recruited into FIRST who had no prior FIRST experience |
| Capture latency | Median hours between event and entry being filed |
| Capture compliance | % of triggering events that result in a filed entry |
| Game-year overlay | Small set of season-specific subfields added to evergreen templates each year |

---

## Charter changelog

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | *[initial date]* | Initial charter and system design — 13 entry types, per-entry 90s rule, per-entry award tagging, separate Judge Interaction Log and Mentor/Sponsor logs | *[Documentation Captain]* |
| 2.0 | *[v2 date]* | **Taxonomy simplification:** 13 → 10 entry types. Merged BSC + OAL → Session Log. Merged OIC + SBE → Outreach Log. Merged MRL + ST → Contact Log. Renamed all entries to plain language (no acronyms in everyday use). **Tier structure:** organized entries into Tier 1 (universal), Tier 2 (specialty), Tier 3 (annual). **Time budget:** replaced per-entry 90s rule with per-person 5-minute rule plus universal 24-hour hard deadline. **Flagging mechanism:** Tier 1 entries now explicitly flag triggered Tier 2 entries with owners. **Award tagging:** moved off individual entries onto a weekly Documentation Captain pass with Claude. **Judge interactions:** absorbed into Competition Recap; no separate entry type. **New fields:** per-person contribution traces, hero-quality visual asset flag, math/CAD attachments on Decision Log, paths-not-taken field, time-series test labels, geographic location on Outreach Log, sponsor visual assets in Contact Log. **New principle:** reverse audit (Section 17 and Appendix B) — quarterly check that MD's data can supply every downstream judge-facing artifact. **Game-year overlay:** explicit pattern for adding season-specific fields without modifying core templates. **Scope clarification:** MD is bounded to the data layer; portfolio, pit display, formal presentation, and other artifacts are out of scope but their content needs drive MD's reverse audit. | *[Documentation Captain]* |
| 2.1 | *[v2.1 date]* | **Toolchain decision:** Section 15 rewritten to record that the team has selected Option D (custom web application on Next.js + Supabase + Vercel). Options A–C retained as alternatives considered. **Companion document added:** architectural decisions for the application moved into `MD_App_Charter.md`; the split keeps *what is captured* (this charter) durable and *how it is captured* (app charter) replaceable. **Interface contract:** new bullet in Section 18 (Iteration philosophy) recording the 72-hour issue-opening rule when this charter changes in a way that affects the data model, and the rule that app limitations force a charter update before they force an app change. **Forward-looking content:** Decision Log and Test Log v2.1 templates with depth-of-thinking trigger logic and auto-compute specifications are tracked in the chat record and will be folded into the SOPs and templates in v2.2. | *[Documentation Captain]* |
| 2.2 | *[v2.2 date]* | **Outreach Log enhancements:** SOP-02 and Template T-02 expanded with a nine-option event-type single-select (private sponsor/mentor meeting, public robot/FIRST showcase, presentation/conference invited, classroom visit, workshop hosted, recurring program/FLL coaching, FIRST community engagement, online/virtual, other), an eight-option engagement-depth multi-select with optional 1-2 sentence custom note (hands-on interaction, sustained engagement, substantive questions, network expansion, direct interest in joining/supporting, specific next-step commitment, brief walk-by interactions, distracted audience), and an optional four-option follow-up plan section. Individual follow-up tracking remains on the Contact Log; the Outreach Log captures only whether follow-up is intended. **New operating rhythm:** Quarterly Conversion Audit added to Section 14 — 30 minutes adjacent to the Quarterly System Retro, owned by Documentation Captain. Cross-checks projected outreach conversions against actual FIRST team rosters and Contact Logs to produce the outreach funnel as a dashboard rollup rather than as a per-entry capture burden. **Pending in chat record (for v2.3):** Decision Log depth-of-thinking template with weighted trade-off matrix, FMEA, first-principles math, sensitivity analysis, and "cost of being wrong" trigger logic; Test Log depth template with controlled-variables, what-failed-separately, repeatability check, sample-size justification, and auto-computed statistics; Software Change Log simplified template with type-of-change dropdown, Verification field replacing telemetry plan, and AI-prompted deep-dive section deferred to the new `MD_SCL_AI_Integration.md` companion spec. | *[Documentation Captain]* |
| 2.3 | *[v2.3 date]* | **Depth-of-thinking consolidation across five entry types.** **Section 11 (Trigger model):** added the *Draft → Complete* model — initial 5-minute entry captures the contemporaneous record; triggered depth fields complete within 7 days; Documentation Captain reviews stuck-in-draft entries at Friday 15. **Section 16 (Quality standards):** augmented from 9 to 23 quality bars, adding all v2.3 depth-field requirements (matrix, FMEA, math, sensitivity, controlled variables, repeatability, etc.) with explicit applicability per entry type. **SOP-05 and Template T-05 (Decision Log):** added four objective-trigger depth fields (weighted trade-off matrix when 3+ alternatives AND rework cost > 1 build session; first-principles math when decision rests on physics/quantities; sensitivity analysis paired with math; FMEA when failure could end a match or pose safety risk). Trigger application discipline added (Captain spot-checks at Friday 15; subsystem lead can override with documented reasoning; Quarterly Retro reviews retrospective misclassifications). Trigger explicitly applies to abandoned prototypes, not only production-path decisions. **SOP-07 and Template T-07 (Software Change Log):** simplified template — type-of-change dropdown replaces ad-hoc categorization; Verification field replaces v2.0 "telemetry/debug logging plan"; AI-prompted deep-dive section replaces all earlier conditional trigger fields. Full integration mechanics (GitHub webhook, AI classification, classification-specific prompting, transcript retention, prompt versioning, failure-mode fallbacks) deferred to new companion document `MD_SCL_AI_Integration.md` v1.0. **SOP-08 and Template T-08 (Test Log):** depth fields added (controlled variables, what-failed-separately, repeatability check); sample-size justification added as quick-select; auto-computed statistical treatment specified (95% CI for pass/fail tests, standard deviation for continuous tests, last-run lookup with delta). Auto-compute eliminates statistics expertise burden on student filers. **SOP-04 and Template T-04 (Competition Recap):** time budget extended from 60 to 60–90 minutes. JUDGING section simplified to three structured questions (formal interview/Q&A reflection, pit-panel inferred award areas, evidence we didn't include or present best). New sections: STRUCTURED ROOT-CAUSE ANALYSIS (5-whys on up to 3 match-affecting failures), NOTABLE MATCHES (2-4 standout matches with structured narrative), STRATEGIC INSIGHTS (game/opponent/field learnings flagged for follow-up Decision Logs). Auto-generated companion view from prior Test Logs added as an MD-App dashboard feature. The proposed "Gracious Professionalism moments" section was rejected on cultural grounds — GP capture remains organic via Outreach Logs, per-person contributions, and Contact Logs. **SOP-10 and Template T-10 (Subsystem Handoff):** restructured into a four-step transition process (walkthrough at robot, document review together, hands-on demonstration, co-sign with confidence rating). Template T-10 gains a Prior-Season Lineage section at top establishing the multi-season audit trail Sustain Award judges look for, an Incoming Lead Acceptance section at bottom with confidence rating and three first-month dig-deeper items, a Transition Process Record tracking the four steps, and tiered Key Knowledge (🔴 Must / 🟡 Should / 🟢 Worth) so the incoming lead can navigate by attention budget. | *[Documentation Captain]* |

---

*Per the current FTC Competition Manual, this charter and the entries the system produces may use AI as a writing and research aid; AI assistance is credited in the footnotes of any downstream judging artifact that consumes MD's data.*
