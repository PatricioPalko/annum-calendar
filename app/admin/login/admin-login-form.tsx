"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setIsLoading(true);

    const supabase = createSupabaseBrowserClient({ rememberMe });

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
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4"
      autoComplete="on"
      noValidate
    >
      <div>
        <label htmlFor="admin-email" className="sr-only">
          E-mail
        </label>
        <Input
          id="admin-email"
          name="email"
          type="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="E-mail"
          autoComplete="username"
          spellCheck={false}
          required
          aria-invalid={Boolean(errorMessage)}
          aria-describedby={errorMessage ? "admin-login-error" : undefined}
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="sr-only">
          Heslo
        </label>
        <div className="relative">
          <Input
            id="admin-password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Heslo"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "admin-login-error" : undefined}
            className="pr-11"
          />

          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className={cn(
              "absolute top-1/2 right-3 -translate-y-1/2 rounded-sm text-[#3E0F28]/45 transition",
              "hover:text-[#3E0F28] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC5A61]/30",
            )}
            aria-label={showPassword ? "Skryť heslo" : "Zobraziť heslo"}
            aria-pressed={showPassword}
            aria-controls="admin-password"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 py-1">
        <Checkbox
          id="admin-remember-me"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
        />
        <span className="text-sm font-medium text-[#3E0F28]/75">
          Ostať prihlásený
        </span>
      </label>

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
