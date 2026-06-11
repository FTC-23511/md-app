# Fallback Capture

Use this when the main app is down. You don't need the app, internet access, or any special tools — just a text editor.

## When to use this

If you can't reach the app and need to log a session, outreach event, or meeting, file a fallback form instead. Hand the completed file to the Documentation Captain; they'll import it when the app is back.

## Which template to use

| What happened            | Template                     |
| ------------------------ | ---------------------------- |
| Build session / practice | `templates/session-log.md`   |
| Outreach event           | `templates/outreach-log.md`  |
| Team meeting             | `templates/meeting-notes.md` |
| Test + its raw data      | `templates/test-log.md`      |

## How to fill one out

1. **Copy the template.** Open the right file from the `templates/` folder and save a copy somewhere you can edit it. Name it something like `2026-11-18-session-log-intake-tuning.md` (date + type + short description).

2. **Fill in the frontmatter.** The top block (between the `---` lines) has structured fields. Lines marked `# REQUIRED` must be filled in. Leave optional lines blank if you don't have the information.

3. **Fill in the body sections.** Each `##` section has a comment explaining what goes there. Write in plain English — sentences, not bullet points, unless the section already uses bullets.

4. **Skip what you don't know.** Optional sections can be left with just the comment. Don't delete the section headings — the Captain needs them to be present.

## How to send it to the Captain

Send the completed file however is fastest: Discord attachment, email, USB stick, shared Drive folder. The Captain will handle the rest.

You do **not** need to know how to use git or the database. Your job ends when the file reaches the Captain.

## Tips

- **Dates go in `YYYY-MM-DD` format.** Example: `2026-11-18`. Wrong formats (like `Nov 18`) will cause an error on import.
- **Required fields really are required.** If a `# REQUIRED` field is blank, the import will fail and the Captain will have to ask you for the missing info. Fill them in while memory is fresh.
- **Specialty Entries Triggered checkboxes** — check the box (`[x]`) for any follow-on entry types that should be filed (Decision Log, Hardware Change Log, etc.), and fill in the owner and subject. Leave unchecked boxes as `[ ]`.
- **Stories in Outreach Logs** — at least 3 are required. Fill in what you remember; the Captain can edit for clarity before import.
