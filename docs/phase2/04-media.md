# Media — Google Drive is the home

## 1. The problem this solves

Two concerns: database storage (Supabase free tier is ~1 GB; photos/videos blow past it — `MD_App_Charter.md` §4 flags it) and ease of capture. The answer: **Google Drive is the permanent home for team-owned media, and the app puts media there automatically.** The database stores only a Drive link (plus maybe a tiny thumbnail). This is the charter's original intent (photos in Drive, links in the DB) with automatic ingestion added, so the user never has to upload to Drive by hand.

The team uses **Workspace Google with Shared Drives**, which is the durable case: ingested files are owned by the *Shared Drive (the team)*, not by a student's personal account, so media survives student turnover — a direct Sustain-Award benefit.

## 2. Two paths: ingest vs passthrough

| Media | Path | Why |
|---|---|---|
| Phone/file upload, Discord attachment, Imgur, loose direct image/video link | **Ingest to Drive** | Team-owned or fragile. App downloads the bytes and re-homes them in Drive. |
| YouTube, Vimeo | **Passthrough (stay native)** | Already permanent, free, and built to stream. Re-hosting wastes space and violates their terms. Big match video belongs here anyway — keeps it off Drive quota. |

So: photos and the team's own video files end up in Drive; platform videos stay as their own links. Everything the team owns is in one place.

## 3. Ingest pipeline

On add of an ingestable item:
1. App fetches the source bytes server-side (for Discord, promptly — before the signed URL expires).
2. Uploads to a designated folder in the team Shared Drive (organize by entry type, e.g. `MD-media/<entry_type>/`).
3. Sets the file's link sharing to "anyone with the link can view" via the Drive API — so previews/embeds work, automatically (no manual sharing step, which kills the old Drive gotcha).
4. Stores the Drive link + `drive_file_id` + `media_type` + a thumbnail in `media_links` (`docs/phase2/01-schema.md` §7). DB footprint: a link and a few KB.

Status is tracked (`ingest_status`: pending → done / failed) so the form can show "uploading…" and retry on failure. The download+upload is a few seconds for photos and short clips. **Large videos hit serverless size/time limits** — the app should reject oversized files with a clear message ("too big — upload to YouTube and paste the link"), reinforcing the passthrough rule.

## 4. Auth: service account + Shared Drive

- A **Google service account** is a Member (Content manager) of the team Shared Drive. The app authenticates as it to upload. Files are owned by the Shared Drive, not the service account or a person.
- The service-account key (JSON) and the target Shared Drive / folder ID are stored as **server secrets** (Vercel env vars; `.env.local` for dev) — never in the repo.
- A pasted *pre-existing* Drive link (someone shares a Drive file directly) is stored as-is; if it isn't link-viewable the preview fails, so warn the user to fix sharing (the only case the old gotcha still applies).

### One-time setup (coach/admin)
1. Pick/create a Shared Drive folder for MD media.
2. Google Cloud project → enable Drive API → create a service account → download its key JSON.
3. Add the service account as a Content manager on the Shared Drive.
4. Put the key + folder ID into Vercel env (and `.env.local`).

## 5. Link health

Per `MD_App_Charter.md` §9, a nightly sweep re-checks each `media_links.url` (Drive links can break if a file is deleted or sharing changes); writes `last_checked_ok` / `last_checked_at`; dead links surface at Friday 15. Index on `(last_checked_ok)` keeps it cheap.

## 6. Storage budget

Database: a link + small thumbnail per item — KB-scale, a whole season far under 1 GB. Media bytes live in the team Shared Drive (Workspace pooled storage, far larger than a personal 15 GB). Platform videos never touch either. The "photos exceed free storage" risk in `MD_App_Charter.md` §4 is resolved — **record this resolution in the App Charter per the §9 contract** (the "how" changed: from "URLs in DB, photos in Drive, manual" to "automatic ingest via service account").

## 7. Block + data model

- New block `media-links` (`02-forms-and-detail.md` §1): repeating rows of `{url_or_file, caption, permission_status, role?}`. For uploads the input is a file; for links it's a URL. Source provider + media_type + thumbnail + ingest are derived on add. Wire convention `name__url`, `name__caption`, etc.
- Table `media_links` polymorphic to any entry (`01-schema.md` §7), same pattern as `flags`.
- Retrofit (2F): Hardware Change Log photos, Session/Outreach photos move to `media-links`; the Outreach `story-block.photo_url` can migrate to a `media_links` ref or stay (decide in 2F).
- Minor-permission status is tracked per media item regardless of where it lives.
