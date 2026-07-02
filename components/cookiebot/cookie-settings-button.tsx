"use client";

type CookieSettingsButtonProps = {
  className?: string;
  children?: React.ReactNode;
};

declare global {
  interface Window {
    Cookiebot?: {
      renew: () => void;
    };
  }
}

export function CookieSettingsButton({
  className,
  children = "Nastavenia cookies",
}: CookieSettingsButtonProps) {
  if (!process.env.NEXT_PUBLIC_COOKIEBOT_ID) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => window.Cookiebot?.renew()}
      className={className}
    >
      {children}
    </button>
  );
}
