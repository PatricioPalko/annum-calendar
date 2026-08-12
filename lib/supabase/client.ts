import { createBrowserClient } from "@supabase/ssr";

type CreateSupabaseBrowserClientOptions = {
  rememberMe?: boolean;
};

export function createSupabaseBrowserClient(
  options: CreateSupabaseBrowserClientOptions = {},
) {
  const rememberMe = options.rememberMe ?? true;

  const authOptions =
    typeof window !== "undefined" && !rememberMe
      ? {
          auth: {
            persistSession: false,
            storage: window.sessionStorage,
          },
        }
      : undefined;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    authOptions,
  );
}
