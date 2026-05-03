import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the PKCE auth code exchange after magic link click.
// Supabase redirects here with ?code=... — we exchange it for a session
// then forward to /inbox.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/inbox";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Exchange failed — send back to login with error
  return NextResponse.redirect(
    new URL("/login?error_code=access_denied", origin)
  );
}
