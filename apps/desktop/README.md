# Bino desktop

The web app for Bino. Vite + React 19, Tailwind v4, base-ui primitives from `@bino/ui`.

```sh
pnpm desktop dev       # http://localhost:5173
pnpm desktop build     # typecheck + production build
pnpm desktop lint      # oxlint
```

It talks to the API at `VITE_API_URL` (see `.env.example`). Point it at a local API
when you're testing changes so you don't touch real data.

See the repo root `CLAUDE.md` for how the code is laid out.
