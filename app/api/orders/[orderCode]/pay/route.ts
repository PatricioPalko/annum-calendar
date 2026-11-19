import { NextResponse } from "next/server";

/**
 * Online payments were removed. Payment links from older "awaiting payment"
 * emails land on the home page.
 */
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/", request.url));
}
