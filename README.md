# Gorne MD EMR

A ground-up replacement for a WordPress-based clinic EMR, built for a small
Philippine medical practice (Dr. Gorne — adult and pediatric patients,
distinguished by which doctor account is logged in). Scope: patient charts,
vital signs, diagnoses, prescriptions, and medical certificates — no
appointments, billing, inventory, or visit/queue concept.

Replaces `jazgornemd-theme`, a WordPress/ACF-based system with real security
gaps (unauthenticated AJAX endpoints leaking clinical data) and fragile
design (roles and patient segmentation hardcoded rather than modeled).

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack) + **Tailwind v4**
- **shadcn/ui** (`base-nova` preset, built on `@base-ui/react`)
- **Supabase** — Postgres, Auth, Storage, and RLS as the primary authorization
  boundary
- **React Hook Form** + **Zod** for forms and validation
- **react-signature-canvas** for doctor signature capture
- **puppeteer-core** + `@sparticuz/chromium` (planned, Phase 3) for
  server-rendered PDF prescriptions/medcerts, sharing one HTML/CSS template
  with the browser-print route

## Roles

Two roles only — `admin` (non-clinical superuser: account provisioning, data
management) and `doctor` (clinical: owns a signature, issues prescriptions
and medcerts under their own name). Both can view/manage patients, vitals,
and diagnoses.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your own Supabase project's keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Supabase schema
lives at `supabase/migrations/0001_init.sql` — apply it to a fresh Supabase
project (`supabase db push`, or paste into the SQL editor) before first run.
There is no public sign-up; the first admin account is provisioned directly
in Supabase, and every account after that goes through `/admin/users`.

## Project status & handoff

This project is under active, phased development. **[`HANDOFF.md`](./HANDOFF.md)**
is the living checkpoint of what's built and what's next — read it first in
any new session. It links out to the full architecture plan (schema, RLS
design, auth/role model, PDF generation approach, and the phased roadmap).

`AGENTS.md` documents a Next.js 16 breaking-changes note for AI coding
agents working in this repo; it's auto-managed by `next dev` and safe to
ignore for human contributors.

## Scripts

```bash
npm run dev      # start the dev server (Turbopack)
npm run build    # production build
npm run lint     # ESLint
```
