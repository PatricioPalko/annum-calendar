import { NextResponse } from "next/server";

export function GET(request: Request) {
  const destination = new URL("/objednavka", request.url);
  destination.searchParams.set("utm_source", "offline");
  destination.searchParams.set("utm_medium", "qr");
  destination.searchParams.set("utm_campaign", "kosice_letak");

  const response = NextResponse.redirect(destination, 307);
  response.headers.set("Cache-Control", "no-store");

  return response;
}
