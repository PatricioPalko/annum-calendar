"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLoginForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage("Nesprávny e-mail alebo heslo.");
      return;
    }

    const sessionCheck = await fetch("/api/admin/session");

    if (!sessionCheck.ok) {
      await supabase.auth.signOut();
      setErrorMessage("Tento účet nemá prístup do administrácie.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <div>
        <label htmlFor="admin-email" className="sr-only">
          E-mail
        </label>
        <Input
          id="admin-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail"
          autoComplete="email"
          required
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "admin-login-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="sr-only">
          Heslo
        </label>
        <Input
          id="admin-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Heslo"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "admin-login-error" : undefined}
        />
      </div>

      {errorMessage && (
        <p
          id="admin-login-error"
          role="alert"
          className="text-sm font-semibold text-[#FC5A61]"
        >
          {errorMessage}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Prihlasujem...
          </>
        ) : (
          "Prihlásiť sa"
        )}
      </Button>
    </form>
  );
}
