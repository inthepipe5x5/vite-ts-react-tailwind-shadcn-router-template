# Vite + React + TypeScript + Tailwind + shadcn/ui + Router Template

A minimal, production‑oriented starter for building modern React applications. It ships with sensible defaults, a clean folder structure, and a small set of ready‑to‑use UI primitives so you can start shipping features immediately.

## What’s included

- Vite for fast dev server and optimized builds
- React 19 with TypeScript for type‑safe development
- React Router for client-side routing
- Tailwind CSS (utility-first styling)
- shadcn/ui primitives (Button, Card, Input) composed with Tailwind
- ESLint configured for React and TypeScript

## Project structure

```
.
├─ public/
├─ src/
│  ├─ components/
│  │  ├─ Layout.tsx          # App shell (navbar, footer, content outlet)
│  │  ├─ Navigation.tsx      # Top navigation
│  │  └─ ui/                 # Minimal shadcn-style primitives
│  │     ├─ button.tsx
│  │     ├─ card.tsx
│  │     └─ input.tsx
│  ├─ data/
│  │  └─ featureData.ts      # Example feature list
│  ├─ lib/
│  │  └─ utils.ts            # cn() helper
│  ├─ pages/                  # Route pages
│  │  ├─ HomePage.tsx
│  │  ├─ FeaturesPage.tsx
│  │  └─ AboutPage.tsx
│  └─ routes/
│     ├─ AppRoutes.tsx       # Route definitions
│     └─ index.tsx           # Router bootstrap
├─ index.html
├─ package.json
├─ tsconfig.json              # TypeScript config, includes @ path alias to src
└─ vite.config.ts
```

Path alias: imports starting with `@/` resolve to `src/`.

## Getting started

Requirements: Node.js 18+ and npm.

Install dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

Build for production:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

Lint the project:

```powershell
npm run lint
```

## How it works

- Routing: `src/routes/AppRoutes.tsx` declares the app routes. `Layout.tsx` renders the shared navigation, page outlet, and footer. Pages live under `src/pages`.
- Styling: Tailwind utility classes are used throughout. You can customize styles by editing classes directly in components.
- UI components: A minimal set of shadcn-style primitives (`Button`, `Card`, `Input`) are included in `src/components/ui`. They are unopinionated and easy to extend.
- Data: `src/data/featureData.ts` shows a simple pattern for static data used by pages.

## Adding a new page

1. Create a new file in `src/pages`, for example `ContactPage.tsx`.
2. Add a route in `src/routes/AppRoutes.tsx` pointing to the page component.
3. Optionally add a link in `src/components/Navigation.tsx`.

## Using shadcn-style UI primitives

- Import from `@/components/ui/*` and compose with Tailwind classes.
- Example:

```tsx
import { Button } from '@/components/ui/button'

export function Example() {
	return <Button>Click me</Button>
}
```

To introduce additional primitives, add new files under `src/components/ui` following the same pattern.

## Conventions

- Use `@/` import alias for paths under `src`.
- Keep components small and composable.
- Prefer Tailwind utilities over ad‑hoc CSS.
- Co-locate small helpers under `src/lib`.

## Deploying

The `npm run build` command outputs static assets to `dist/`. Deploy the `dist/` folder to any static host (e.g., Netlify, Vercel, GitHub Pages, or your own server).

## Troubleshooting

- If imports like `@/components/...` fail, ensure your editor understands the TypeScript path alias and that the Vite dev server is running.
- If Tailwind classes do not apply, restart the dev server after dependency or config changes.

