# Project Instructions and Guidelines

## 1. Project Overview

**Financy** is a personal financial management application designed to be a centralized hub for tracking personal finances. The architecture follows a modular approach, allowing for independent development and maintenance of specific functional areas.

**Key Functional Modules:**

- **Income Management (Entradas):** Tracking all sources of revenue (salary, freelance, etc.).
- **Expense Management (Saídas):** Detailed recording and categorization of daily expenses.
- **Credit Card Control:** managing credit card bills, limits, and billing cycles.
- **Installment Tracking:** Specific handling of credit card installments and future financial commitments.

This modular strategy is critical: we will develop each module focused on its specific domain logic while sharing common UI components.

## 2. Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend / BaaS:** Supabase (Database, Auth, Storage, Realtime)
- **State Management:** TanStack Query (React Query)
- **Deployment:** Vercel
- **Containerization:** Docker (for local dev environments)
- **Icons:** Lucide React

## 3. Language Standards

- **Codebase (Variables, Functions, Comments, Commits):** Must be in **English**.
  - _Correct:_ `const getUserProfile = () => ...`
  - _Incorrect:_ `const pegarPerfilUsuario = () => ...`
- **User Interface (UI):** Must be in **Portuguese (pt-BR)**.
  - _Correct:_ `<button>Salvar Alterações</button>`
  - _Incorrect:_ `<button>Save Changes</button>`

## 4. Next.js App Router Architecture & Best Practices

### Directory Structure

Follow the standard Next.js App Router structure:

```
/app
  /layout.tsx       # Root layout
  /page.tsx         # Home page
  /(auth)           # Route groups for organization (e.g., login, register)
  /dashboard/       # Protected routes
  /api/             # API Routes (Route Handlers)
/components
  /ui/              # Shadcn/ui or base primitive components (Button, Input)
  /features/        # Feature-specific components (TransactionList, DashboardChart)
/lib
  /supabase/        # Supabase client initialization
  /utils.ts         # Helper functions (cn, formatters)
/hooks              # Custom React hooks
/types              # Shared TypeScript interfaces/types
```

### Server vs. Client Components

- **Default to Server Components:** All components should be Server Components unless they strictly require client-side interactivity.
- **"use client" directives:** Place `'use client'` at the very top of the file only when:
  - Using React Hooks (`useState`, `useEffect`, `useReducer`).
  - Using Event Listeners (`onClick`, `onChange`, `onSubmit`).
  - Using browser-only APIs (`window`, `localStorage`, `navigator`).
- **Composition:** Pass Client Components as children to Server Components to avoid de-optimizing the entire tree.

### Data Fetching

- **Server-Side:** Use `async/await` in Server Components for initial data fetching.
- **Client-Side:** Use `TanStack Query` for data that requires:
  - Real-time updates.
  - User-triggered refetches.
  - Optimistic updates.
  - Infinite scrolling.
- **Caching:** Leverage Next.js built-in `fetch` caching strategies where appropriate, but prefer TanStack Query for dynamic client-side needs.

## 5. UI & Styling (Tailwind CSS)

- **Utility-First:** Use utility classes directly in JSX.
- **Class Merging:** ALWAYS use a utility like `clsx` + `tailwind-merge` (often named `cn`) when constructing dynamic classes to avoid conflicts.
- **Responsiveness:** Mobile-first approach. Use `sm:`, `md:`, `lg:` prefixes.
- **Design System:** Define colors and spacing in `tailwind.config.ts` if they deviate from defaults. Avoid arbitrary values like `w-[357px]` unless absolutely necessary.

## 5.1. Mobile-First & Responsive Design (MANDATORY)

This project targets mobile users as the primary audience. Every component, layout, and interaction MUST be designed and implemented mobile-first. Responsiveness is not optional — it is a core requirement.

### Core Principle

Always write base styles for mobile screens first, then layer on overrides for larger breakpoints using `sm:`, `md:`, `lg:`, `xl:`.

- **Wrong:** `class="flex-row sm:flex-col"` (starts from desktop)
- **Correct:** `class="flex-col md:flex-row"` (starts from mobile)

### Layout Rules

- Use `flex-col` as default and switch to `flex-row` on `md:` or larger.
- Use `grid-cols-1` as default and expand to multiple columns on larger screens: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.
- Avoid fixing widths on containers. Prefer `w-full` with `max-w-*` constraints.
- Use `px-4` as the default horizontal padding on mobile. Increase with `md:px-6 lg:px-8`.
- Avoid side-by-side layouts on mobile unless the content naturally fits (e.g., icon + label pairs).

### Typography

- Scale font sizes using responsive modifiers: `text-sm md:text-base lg:text-lg`.
- Headings should be compact on mobile: `text-xl md:text-2xl lg:text-3xl`.
- Ensure minimum tap-friendly text contrast and size (at least 14px on mobile).

### Touch & Interaction

- All interactive elements (buttons, links, inputs) must have a minimum tap target of `44x44px`. Use `min-h-[44px] min-w-[44px]` when necessary.
- Avoid hover-only interactions. Supplement `hover:` styles with proper focus states using `focus:` and `focus-visible:`.
- Prefer bottom sheets, drawers, and slide-up panels for mobile actions rather than dropdowns or modals that require precise pointer interaction.
- Spacing between tappable items must be at least `8px` to prevent mis-taps.

### Navigation

- On mobile, use a bottom navigation bar (`components/layout/mobile-bottom-nav.tsx`) as the primary nav.
- On desktop (`md:` and above), use the sidebar.
- Never rely on a sidebar-only navigation pattern — it must be hidden on mobile with the bottom nav visible.

### Forms & Inputs

- Stack form fields vertically on mobile. Use `grid-cols-1 md:grid-cols-2` for multi-column forms.
- Inputs must be `w-full` by default.
- Use `text-base` on inputs to prevent iOS Safari from auto-zooming (font size < 16px triggers zoom).
- Prefer native input types (`type="tel"`, `type="email"`, `type="date"`) to trigger appropriate mobile keyboards.

### Images & Media

- Always use `w-full h-auto` or `object-cover` with explicit height containers.
- Use `next/image` with `sizes` prop configured for responsive loading.

### Spacing & Density

- Mobile screens demand concise, high-density layouts. Minimize whitespace but preserve readability.
- Cards and list items should have `p-3 md:p-4 lg:p-6` padding tiers.
- Avoid multi-column card grids on mobile unless cards are compact (e.g., stat/metric cards `grid-cols-2`).

### Testing Checklist (before committing UI changes)

Before submitting any UI component or page, mentally verify:

- [ ] Does it look correct at 375px (iPhone SE) width?
- [ ] Does it look correct at 768px (tablet) width?
- [ ] Does it look correct at 1280px (desktop) width?
- [ ] Are all tap targets large enough?
- [ ] Is text readable without horizontal scrolling?
- [ ] Does the layout shift gracefully without broken overflow?

## 6. Supabase Integration

- **Type Safety:** Generate TypeScript types from your Supabase schema (`database.types.ts`) and use them in all database queries.
- **Auth:** Use Supabase Auth helpers for Next.js (`@supabase/auth-helpers-nextjs` or `@supabase/ssr`).
- **Row Level Security (RLS):** Ensure RLS policies are enabled on all tables. Never rely solely on client-side validation for security.

## 7. TypeScript Rules

- **Strict Mode:** Enabled.
- **No `any`:** Avoid `any` types. Use `unknown` if the type is truly uncertain, or usually strict interfaces.
- **Props:** Define interfaces for all component props. `type Props = { ... }`.
- **Zod:** Use Zod for schema validation (forms, API responses).

## 8. Development Workflow

- **Conventional Commits:** Use prefixes like `feat:`, `fix:`, `chore:`, `refactor:`.
- **Linting:** Ensure no ESLint warnings before committing.
- **Docker:** If using Docker for services, ensure `docker-compose.yml` is up to date and services are healthy.

## 9. AI Copilot Guidelines

When generating code:

1.  **Analyze requirements:** Understand if the request is for UI (Portuguese) or Logic (English).
2.  **Context awareness:** Check existing folder structure before creating new files.
3.  **Modern Syntax:** Use the latest features of Next.js 15 (e.g., `await params` in dynamic routes) and React 19 (if applicable, or sticking to stable 18 patterns compatible with Next 15).
4.  **Error Handling:** Include `try/catch` blocks in async operations and proper error UI states.
