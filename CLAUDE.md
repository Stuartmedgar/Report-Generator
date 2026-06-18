# Easy Report Generator — Claude Code Context

## Project Overview
A React/TypeScript web app that helps teachers write student reports using AI-assisted comment banks and customisable templates. Teachers paste existing reports and the AI extracts their language into reusable template buttons.

**Live app:** https://easyreportgenerator.netlify.app  
**GitHub repo:** Stuartmedgar/Report-Generator

---

## Tech Stack
- **Frontend:** React + TypeScript, hosted on Netlify
- **Auth + Database:** Supabase (EU region)
- **AI:** Anthropic API via Supabase Edge Functions
- **Payments:** Stripe (integration in progress)
- **Deployment:** `git push` to GitHub triggers automatic Netlify build

---

## Key Commands

### Deploy frontend
```bash
git add .
git commit -m "your message"
git push
```
Netlify auto-deploys on push. No manual step needed.

### Deploy Supabase edge function
```bash
supabase functions deploy generate-template --no-verify-jwt
```
Always use `--no-verify-jwt` flag.

### Check for TypeScript errors before pushing
```bash
npm run build
```

---

## Supabase
- **Project URL:** https://wozbrojwuzktwrzngllh.supabase.co
- **Edge function URL:** https://wozbrojwuzktwrzngllh.supabase.co/functions/v1/generate-template
- **Edge function name:** `generate-template`
- Edge function handles multiple AI modes: `identify-sections`, `auto-build`, `find-fixed`, `generate`

---

## Architecture Principles

### Data & GDPR
- **Student/pupil data is stored in browser localStorage only** — never transmitted to servers
- This is a deliberate GDPR advantage and competitive differentiator — do not change this
- Only server-stored data: teacher email and subscription status (Supabase)

### Database patterns
- Always use **UPSERT** — never DELETE-then-INSERT (caused data loss bugs previously)

### AI calls
- Use `temperature: 0` on `identify-sections` and `auto-build` calls for consistent output
- `generate` mode uses higher temperature for variety

### Code changes
- **Minimal-change principle:** only modify what needs changing; do not refactor working code
- **Always provide complete full file contents** when making changes — never partial diffs or snippets
- Mobile components are kept as **separate components**, not responsive CSS modifications to desktop versions

---

## Key Files & Structure

```
src/
  components/
    ReportWriter.tsx        # Main report writing interface
    CreateTemplate.tsx      # Template creation and editing
    ImportTemplate.tsx      # Importing templates (handles pronoun normalisation)
    ManageTemplates.tsx     # Template management, pronoun duplicate feature
    BuildAsYouGoWizard.tsx  # Guided wizard for building templates from scratch
  data/
    starterComments.ts      # Content library — comment banks, subject-specific pools, p3() function
  types/                    # TypeScript type definitions
supabase/
  functions/
    generate-template/      # Edge function handling all AI modes
```

---

## Current Commercial State
- Selling to **individual teachers** (not schools) — avoids institutional procurement complexity
- Operating as a sole trader based in Scotland
- Target markets: Scottish and English teachers, all subjects
- **ICO registration** is required before taking payments (blocker)
- Stripe integration planned with free tier limits and subscription gating
- Privacy Policy and Terms of Service drafted (placeholders for business name, ICO number, contact email)

---

## Key Features
- **Build as You Go wizard** — question-by-question or pre-populated sections path
- **find-fixed mode** — scans pasted reports for repeated fixed statements, surfaces as candidate checklist
- **Pronoun duplicate feature** — one-click creation of alternative-pronoun template copies
- **Pronoun normalisation** — handled in `ImportTemplate.tsx` via `normalisePronouns`
- **Pre-built template library** — 10 subjects available as importable JSON (she/her pronouns default)
- `p3()` function in `starterComments.ts` — selects random 3 from 6 statements for content variety

---

## Known Patterns & Gotchas
- **Inner component bug pattern:** Never define components (e.g. `StatementEditor`) inside another component's render — causes cursor-jumping in inputs. Define at module level.
- **Section boundary bleed:** AI misclassifies blended paragraphs without structural breaks. Encourage teachers to add explicit Assessment sections rather than trying to fix via prompts.
- **Button/heading names** should signal topic AND performance level so teachers can select without reading every comment.
- **8-statement-per-button limit** is enforced — do not remove this constraint.

---

## On the Horizon (not yet built)
- Stripe integration with free tier limits and subscription gating
- ICO registration + `/privacy` and `/terms` routes in React app
- Dedicated business email + business name decision
- Sample onboarding video for new teachers
- they/them pronoun template set
- Live template improvement during report writing (Actions 1–5 designed)
- Potential Firebase migration (deferred — evaluate if Supabase free-tier pausing becomes a problem)