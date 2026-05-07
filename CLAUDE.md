@AGENTS.md

# Stack

- **Framework:** Next.js 16.2.1 (App Router)
- **UI:** React 19.2.4
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript
- **Backend/Auth/DB:** Supabase
- **Payments:** Stripe
- **Animation:** Framer Motion
- **Icons:** Lucide React

# Rules

- Never change desktop layout when fixing mobile issues — use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to scope mobile changes only.
- Always use Tailwind responsive prefixes for breakpoint-specific styles; never use raw media queries in JSX.
- Use `next/image` (`<Image />`) for all images — never use a bare `<img>` tag.
- Run `npm run build` to verify no type errors or build failures before marking any task complete.
- No `any` types in TypeScript — use proper types, generics, or `unknown` with narrowing.

# Current Work

Sprint 1 audit fixes.
