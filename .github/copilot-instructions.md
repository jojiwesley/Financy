# Project Instructions and Guidelines

## 1. Project Overview
**Financy** is a personal financial management application designed to be a centralized hub for tracking personal finances. The architecture follows a modular approach, allowing for independent development and maintenance of specific functional areas.

**Key Functional Modules:**
*   **Income Management (Entradas):** Tracking all sources of revenue (salary, freelance, etc.).
*   **Expense Management (Saídas):** Detailed recording and categorization of daily expenses.
*   **Credit Card Control:** managing credit card bills, limits, and billing cycles.
*   **Installment Tracking:** Specific handling of credit card installments and future financial commitments.

This modular strategy is critical: we will develop each module focused on its specific domain logic while sharing common UI components.

## 2. Tech Stack
*   **Framework:** Next.js 15+ (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Backend / BaaS:** Supabase (Database, Auth, Storage, Realtime)
*   **State Management:** TanStack Query (React Query)
*   **Deployment:** Vercel
*   **Containerization:** Docker (for local dev environments)
*   **Icons:** Lucide React

## 3. Language Standards
*   **Codebase (Variables, Functions, Comments, Commits):** Must be in **English**.
    *   *Correct:* `const getUserProfile = () => ...`
    *   *Incorrect:* `const pegarPerfilUsuario = () => ...`
*   **User Interface (UI):** Must be in **Portuguese (pt-BR)**.
    *   *Correct:* `<button>Salvar Alterações</button>`
    *   *Incorrect:* `<button>Save Changes</button>`

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
*   **Default to Server Components:** All components should be Server Components unless they strictly require client-side interactivity.
*   **"use client" directives:** Place `'use client'` at the very top of the file only when:
    *   Using React Hooks (`useState`, `useEffect`, `useReducer`).
    *   Using Event Listeners (`onClick`, `onChange`, `onSubmit`).
    *   Using browser-only APIs (`window`, `localStorage`, `navigator`).
*   **Composition:** Pass Client Components as children to Server Components to avoid de-optimizing the entire tree.

### Data Fetching
*   **Server-Side:** Use `async/await` in Server Components for initial data fetching.
*   **Client-Side:** Use `TanStack Query` for data that requires:
    *   Real-time updates.
    *   User-triggered refetches.
    *   Optimistic updates.
    *   Infinite scrolling.
*   **Caching:** Leverage Next.js built-in `fetch` caching strategies where appropriate, but prefer TanStack Query for dynamic client-side needs.

## 5. UI & Styling (Tailwind CSS)
*   **Utility-First:** Use utility classes directly in JSX.
*   **Class Merging:** ALWAYS use a utility like `clsx` + `tailwind-merge` (often named `cn`) when constructing dynamic classes to avoid conflicts.
*   **Responsiveness:** Mobile-first approach. Use `sm:`, `md:`, `lg:` prefixes.
*   **Design System:** Define colors and spacing in `tailwind.config.ts` if they deviate from defaults. Avoid arbitrary values like `w-[357px]` unless absolutely necessary.

## 6. Supabase Integration
*   **Type Safety:** Generate TypeScript types from your Supabase schema (`database.types.ts`) and use them in all database queries.
*   **Auth:** Use Supabase Auth helpers for Next.js (`@supabase/auth-helpers-nextjs` or `@supabase/ssr`).
*   **Row Level Security (RLS):** Ensure RLS policies are enabled on all tables. Never rely solely on client-side validation for security.

## 7. TypeScript Rules
*   **Strict Mode:** Enabled.
*   **No `any`:** Avoid `any` types. Use `unknown` if the type is truly uncertain, or usually strict interfaces.
*   **Props:** Define interfaces for all component props. `type Props = { ... }`.
*   **Zod:** Use Zod for schema validation (forms, API responses).

## 8. Development Workflow
*   **Conventional Commits:** Use prefixes like `feat:`, `fix:`, `chore:`, `refactor:`.
*   **Linting:** Ensure no ESLint warnings before committing.
*   **Docker:** If using Docker for services, ensure `docker-compose.yml` is up to date and services are healthy.

## 9. AI Copilot Guidelines
When generating code:
1.  **Analyze requirements:** Understand if the request is for UI (Portuguese) or Logic (English).
2.  **Context awareness:** Check existing folder structure before creating new files.
3.  **Modern Syntax:** Use the latest features of Next.js 15 (e.g., `await params` in dynamic routes) and React 19 (if applicable, or sticking to stable 18 patterns compatible with Next 15).
4.  **Error Handling:** Include `try/catch` blocks in async operations and proper error UI states.
