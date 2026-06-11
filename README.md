# Personal Productivity Dashboard

[![CI](https://github.com/jlynshue/personal-productivity-dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/jlynshue/personal-productivity-dashboard/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-06B6D4)
![React](https://img.shields.io/badge/React-19.2-61dafb)

**Unified command center for multi-stream executive workflows.** Aggregate email, calendar, tasks, and projects across multiple accounts and workstreams into a single view.

## The Problem

Fractional executives and CTOs juggle multiple workstreams—venture capital fundraising, product development, client relationships, board management—each living in separate tools:
- Gmail, Outlook, Workspace: email triage
- Google Calendar, Outlook Calendar: scheduling
- Jira, Linear, Asana: project tracking
- Obsidian, Notion: notes and strategy
- Slack: chatter

Switching contexts costs time and attention. **This dashboard consolidates the critical signals into one view**, letting you see what's urgent, what's stalled, and what's winning—without context switching.

## Features

- **Multi-Account Email Triage**: Aggregate inboxes (work, personal, consulting) into swimlanes. Flag urgent messages by sender and age.
- **Swimlane-Based Project Tracking**: Kanban-style board with swimlanes per workstream (Anuba, Career, Consulting, Finance, Personal). See projects, tasks, blockers, and stalled work.
- **Execution Metrics**: Hero metric shows planning vs. shipping ratio. Leading (forecasted) and lagging (actual) indicators side-by-side.
- **Re-Ask Tracking**: Track items that didn't land on first attempt—see frequency and root cause patterns.
- **Calendar Integration**: See upcoming commitments alongside task priorities in each lane.
- **Focus Log & Intent**: Record what you're working on; dashboard detects when you're off-plan.
- **Stalled List**: Automatic detection of blockers and overdue items by lane.

## Architecture

```
┌─ Data Sources ───────────────────────────────────────────┐
│                                                           │
│  • Gmail / Outlook (email)                               │
│  • Google Calendar / Outlook Calendar (events)          │
│  • Unified Task Pipeline (Jira, local, M365)             │
│  • Obsidian Vault / Notion (notes, focus log)            │
│  • Execution Metrics DB (plan/ship ratio, re-asks)      │
│                                                           │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────▼───────────┐
        │  API Route           │
        │ /api/dashboard       │
        └──────────┬───────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
┌────▼────┐  ┌────▼────┐  ┌────▼────┐
│Transform │  │Transform │  │Transform │
│ Tasks    │  │ Execution│  │ Email    │
└────┬────┘  └────┬────┘  └────┬────┘
     │             │             │
     └─────────────┼─────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  Dashboard Shell / Context  │
     │  (useDash, useDashMeta)     │
     └─────────────┬───────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐  ┌─────▼────┐  ┌──────▼────┐
│ Swimlane│  │Core Panels│  │Deep Panels│
│ Board   │  │(Hero,     │  │(PlanVsShip│
│         │  │ Action)   │  │ ReAsks)   │
└─────────┘  └───────────┘  └───────────┘
```

**Data Transformers** (`lib/transformers/`):
- `tasks.ts` — Parse swimlanes, lanes, and projects from unified task pipeline
- `execution.ts` — Compute hero metric (plan vs. ship ratio), momentum, forecasts
- `email.ts` — Triage inboxes by account, flag urgent messages
- `calendar.ts` — Load events, compute agenda density
- `notes.ts` — Fetch focus log, daily intent from vault
- `re-asks.ts` — Track retry items and failure patterns

**Panel Components** (`components/`):
- `dashboard-shell.tsx` — Main layout, layout switcher (gap-first, action-first, momentum-first)
- `swimlane-board.tsx` — Kanban board with drag-and-drop (future)
- `panels-core.tsx` — Hero execution, next action, project momentum
- `panels-deep.tsx` — Plan vs. ship, leading/lagging indicators, re-asks, focus log, stalled list
- `panels-email.tsx` — Urgent inbox aggregator
- `primitives.tsx` — Reusable UI primitives (Card, Badge, Progress, etc.)

## Screenshots

Coming soon. For now, see the layout variations in `dashboard-shell.tsx`:
- **Gap-first**: Hero metric dominates; explainers below
- **Action-first**: Next actions top; supporting metrics in context
- **Momentum-first**: Project acceleration and forecasts lead

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm (or yarn/pnpm)

### Installation

```bash
git clone https://github.com/jlynshue/personal-productivity-dashboard.git
cd personal-productivity-dashboard
npm install
```

### Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The dashboard auto-refreshes as you edit.

**Mock Mode** (no integrations):
By default, the dashboard loads mock data from `lib/data.ts` for local development. To integrate live email, calendar, or tasks, update the transformers in `lib/transformers/` to connect to your actual APIs (Gmail API, Microsoft Graph, etc.).

### Build & Deploy

```bash
npm run build
npm start
```

Deploy to Vercel, AWS, or your preferred host:

```bash
vercel deploy
```

## Tech Stack

| Layer | Tools |
|-------|-------|
| **Framework** | Next.js 16.2 (App Router), React 19.2 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 3 |
| **State** | React Context (DashProvider, useDash) |
| **API** | Next.js Route Handlers (`app/api/`) |
| **Linting** | ESLint 9 |
| **Dev** | Node 18+ |

## Environment Variables

Create a `.env.local` file in the root:

```env
# Local dev mode (loads mock data)
NODE_ENV=development

# Live integrations (optional; update transformers to use these)
GOOGLE_CALENDAR_API_KEY=xxx
GOOGLE_GMAIL_API_KEY=xxx
MICROSOFT_GRAPH_TOKEN=xxx
NOTION_API_KEY=xxx
OBSIDIAN_VAULT_PATH=/path/to/vault
```

See `lib/config.ts` for the `isLocal()` check that gates live vs. mock data.

## Project Structure

```
.
├── app/
│   ├── api/
│   │   └── dashboard/
│   │       └── route.ts            # Main API endpoint
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Home page (mounts DashboardShell)
│   └── globals.css
├── components/
│   ├── dashboard-shell.tsx         # Main layout + layout switcher
│   ├── swimlane-board.tsx          # Kanban board
│   ├── panels-core.tsx             # Hero, Action, Momentum
│   ├── panels-deep.tsx             # Plan/Ship, Leading/Lagging, ReAsks, FocusLog, Stalled
│   ├── panels-email.tsx            # Email triage
│   ├── lane-widgets.tsx            # Lane-level status widgets
│   └── primitives.tsx              # Reusable UI components
├── lib/
│   ├── config.ts                   # Environment config
│   ├── data.ts                     # Mock data for local dev
│   ├── dash-context.tsx            # React Context (DashProvider, useDash, useDashMeta)
│   └── transformers/
│       ├── tasks.ts                # Parse task pipeline
│       ├── execution.ts            # Compute metrics
│       ├── email.ts                # Triage inboxes
│       ├── calendar.ts             # Load events
│       ├── notes.ts                # Fetch focus log
│       └── re-asks.ts              # Track retries
├── public/                          # Static assets
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Lanes & Swimlanes

The dashboard organizes work into **swimlanes** (workstreams) and **lanes** (sub-categories):

| Swimlane | Description | Lanes |
|----------|-------------|-------|
| **Anuba** | Venture capital + product roadmap | Fundraising, Product, Ops |
| **Career** | Job search, interviews, consulting gigs | Active Search, Pipeline, Offers |
| **Consulting** | Client delivery + retainers | Client A, Client B, Ops |
| **Finance** | Personal wealth, investments, tax | Investments, Planning, Tax |
| **Personal** | Life admin, learning, health | Admin, Learning, Health |

Each lane tracks:
- Active projects
- Next actions
- Calendar events
- Email (inbox count + urgent flags)
- Metrics (plan vs. ship, momentum, re-asks)

## Panels Explained

### Core Panels

**Hero Execution**
Shows the headline metric: `shipped_this_week / planned_this_week`. This ratio reveals whether you're closing out commitments or accumulating debt. Trending.

**Next Action**
Top 1–3 things to do right now, ranked by urgency and impact. Pulls from WSJF score and age. If your focus log disagrees, panel flags it ("Off plan").

**Project Momentum**
Per-lane acceleration chart: is each lane speeding up, steady, or slowing down? Based on plan-to-ship velocity over rolling windows.

### Deep Panels

**Plan vs. Ship**
Two charts side-by-side: what you committed to vs. what shipped. Highlights over-commitment and delivery debt.

**Leading / Lagging**
- **Leading**: forecasted plan and ship based on current in-flight items and calendar availability
- **Lagging**: actual previous-period results

**Re-Asks**
Items that didn't land on first attempt. Grouped by lane and root cause (dependency, discovery, deprioritized, etc.). High re-ask count suggests planning or communication friction.

**Focus Log**
What you recorded you'd be working on today. Dashboard auto-detects if you drifted; red flag if actual activity doesn't match.

**Stalled List**
Blockers, overdue items, and items without forward motion for N days. Sortable by lane and age.

## Extending the Dashboard

### Add a New Lane

1. Update the swimlane seed data in `lib/data.ts`
2. Add a transformer in `lib/transformers/` to pull data for that lane (e.g., `crm.ts` for sales pipeline)
3. Update the `buildFromTasks()` function in `app/api/dashboard/route.ts` to merge the new lane data

### Add a New Panel

1. Create a new component in `components/` (e.g., `panels-custom.tsx`)
2. Register it in the `COMPONENTS` map in `dashboard-shell.tsx`
3. Add it to a layout variation's cell definitions in `LAYOUTS`
4. Adjust CSS grid spans if needed

### Connect Live Data

Update any transformer in `lib/transformers/`:

```typescript
// lib/transformers/email.ts
export async function loadEmail() {
  if (!isLocal()) {
    // Fetch from Gmail API, Outlook Graph, etc.
    const gmail = await gmail.users.messages.list({ q: "is:unread" });
    // ...
  }
  // Return mock data for dev
  return MOCK_EMAIL_DATA;
}
```

## Performance Notes

- Dashboard API route is set to `revalidate: 0` (no caching) in local dev, allowing real-time updates as data sources change.
- For production, adjust `revalidate` or add incremental static regeneration (ISR) based on your data freshness requirements.
- Email triage runs on page load; consider debouncing heavy transformer calls or adding a refresh button.

## Contributing

Contributions welcome. To contribute:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "feat: description"`)
4. Push and open a pull request

## License

MIT. See LICENSE for details.

## Author

**[Jonathan Lyn-Shue](https://jonathanlynshue.com)** — Fractional CIO/CTO | Data & AI Executive

Building systems for multi-lane operators: venture, product, career, and finance simultaneously.

---

## FAQ

**Q: Can I use this with my team?**  
A: Not yet out-of-the-box—the transformers assume your personal data sources. For team dashboards, you'd need to generalize the lane and swimlane config to map team members to their email/calendar/task systems.

**Q: What if I use Slack instead of email?**  
A: Add a `lib/transformers/slack.ts` transformer and wire it into the API route. The architecture supports pluggable data sources.

**Q: Is this a replacement for Jira/Asana?**  
A: No—it's a command center on top of your existing tools. It's designed to reduce context switching, not replace project management.

**Q: Can I deploy this?**  
A: Yes. Deploy to Vercel, AWS, Fly.io, or any Node.js host. Mock data works out-of-the-box; connect live data once you're hosted by updating the transformers.

**Q: How do I contribute a new panel or metric?**  
A: Open an issue first to discuss. Then follow the "Extending the Dashboard" section above, add tests if applicable, and submit a PR.

## Support

Found a bug? Have a feature request? Open an issue on [GitHub](https://github.com/jlynshue/personal-productivity-dashboard/issues).

---

**Last updated**: June 2026
