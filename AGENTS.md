<!-- BEGIN:nextjs-agent-rules -->
**# This is NOT the Next.js you know**

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Next.js Development Rules

- Always use APIs compatible with the installed Next.js version (16.4.3).
- Check the installed Next.js documentation before implementing unfamiliar APIs.
- Prefer Server Components by default.
- Use Client Components only when interactivity or browser APIs require them.
- Keep sensitive business logic on the server.
- Follow the existing App Router architecture.
- Do not introduce deprecated APIs or patterns.
- Do not assume conventions from older Next.js versions are still valid.
- Verify caching, revalidation and rendering behavior against the installed version.
