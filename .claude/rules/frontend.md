---
paths:
  - "components/**/*.tsx"
  - "app/**/page.tsx"
  - "app/**/layout.tsx"
  - "app/**/*-form.tsx"
  - "app/not-found.tsx"
  - "app/cookiebot-script.tsx"
  - "app/globals.css"
  - "helpers/use-*.ts"
  - "lib/analytics.ts"
  - "lib/order-from-draft.ts"
  - "lib/upload-order-photos.ts"
  - "lib/schema.ts"
---

# Frontend rules

## Components

- Server Components by default. Add `"use client"` only for state, effects, event handlers or browser APIs. The order form tree (`components/sections/order-form/**`, `order-form-components/**`), admin action buttons and the mobile navigation are already client components.
- Folder conventions:
  - `components/sections/<section>/index.tsx` for page sections.
  - `components/sections/order-form-components/<field>/index.tsx` for form fields, sharing class strings from `order-form-styles.ts`.
  - `components/ui/*` for shadcn/Radix primitives (`radix-ui` package, `lucide-react` icons).
  - `components/admin/**` for admin UI.
- Reuse the existing primitives before writing new markup:
  - `Button` variants: `default`, `secondary`, `lime`, `dark`, `outline`, `ghost`, `link`, `destructive`. Sizes: `sm`, `default`, `lg`, `icon`.
  - `Heading`, `SectionLabel` and `Text` from `components/ui/typography.tsx`.
  - `Field`, `FieldLabel`, `FieldError` and `FieldDescription` from `components/ui/field.tsx`.
  - `PriceWithVat` for prices.
  - `Dialog`.
- Combine classes with `cn()` from `@/lib/utils`.

## Styling (Tailwind CSS 4)

- Tokens live in `app/globals.css` (`@theme inline`): `primary`, `secondary`, `lime`, `surface`, `soft`, `border`, etc.
- Many components use the brand hex values directly: `#3E0F28` plum, `#FC5A61` coral, `#FFF7F4` cream, `#C8FF3D` lime, `#EAD6DE` border. **Match whatever the surrounding file uses.** Don't restyle unrelated UI.
- Mobile first. The order page relies on the fixed `OrderFormMobileBar` (safe-area padding) below `lg` and a sticky summary aside at `lg+`. Keep the form's bottom padding in sync with the bar.
- Design for these viewports: 375×812, 390×844, 768×1024, 1024×768, 1440×900. No horizontal scroll.
- No hover-only controls. Pair `group-hover:` reveals with `group-focus-within:` / `focus-visible:` (see the photo-remove button, roadmap UX-7).

## Accessibility

- Every input needs a `<FieldLabel htmlFor>`, `aria-invalid`, and `aria-describedby` pointing at the `FieldError` id. Follow `order-form-components/form-input/index.tsx`.
- Errors that appear after submit use `role="alert"`.
- Don't introduce meaningful text below about 4.5:1 contrast. Existing `text-[#3E0F28]/30–/45` usages are a known debt (UX-4); don't copy them for new body text. Avoid new text smaller than 12px.
- Don't add `window.alert` / `window.confirm` to customer flows. Use inline messages or `Dialog`.
- Keep the skip link (`#main-content`). Every page's `<main>` keeps `id="main-content"`.

## Forms

- Use `react-hook-form` with `zodResolver(orderSchema)` (`lib/schema.ts`), `mode: "onTouched"`, and `Controller`-based field components.
- The **server schema in `app/api/orders/route.ts` is the authority.** When you add or change a field, update both schemas and keep the limits identical.
- The order draft (`lib/order-from-draft.ts`) must never contain photos. Don't add new personal data to it.
- Submit-flow errors should tell the user what to do. Distinguish 429, validation and network errors instead of one generic message (UX-2).

## Data and side effects in the browser

- Talk to the backend only through same-origin `/api/*` routes. The only direct Supabase call from the browser is `uploadToSignedUrl` in `lib/upload-order-photos.ts`.
- Link to API routes (e.g. `/api/orders/<code>/pay`) with a plain `<a>`, not `next/link`. `<Link>` prefetches in production and would run the handler (review N-7).
- Analytics only goes through `lib/analytics.ts` and only after Cookiebot statistics consent. Never send `token`, `orderId`, `order`, `session_id`, email, phone or names to GA, including in `page_location` (M-3).
- Don't add third-party scripts without approval. Cookiebot runs in auto-blocking mode and can block untagged scripts.

## Copy, SEO, assets

- User-facing copy is **Slovak**. Prices are EUR with a comma decimal separator (`formatEuroPrice`, `PriceWithVat`).
- Public pages use `createPageMetadata` (`lib/seo.ts`), `Breadcrumbs`, and `JsonLd` (the only allowed `dangerouslySetInnerHTML`). Transactional and admin pages stay `robots: { index: false }`.
- Use `next/image` for raster images. Assets live in `public/` as WebP.

## React 19 and lint

- ESLint (`eslint-config-next` 16, flat config) enforces the new react-hooks rules, including `react-hooks/set-state-in-effect`. Derive state during render instead of calling `setState` synchronously in an effect.
- `form.watch()` is wrapped in an existing `eslint-disable react-hooks/incompatible-library` block in `order-form/index.tsx`. Don't spread that disable elsewhere.
