import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map((c) => c.name);

    const session = await auth();

    return NextResponse.json({
      hasSession: !!session,
      user: session?.user?.email ?? null,
      cookies: allCookies,
      env: {
        hasAuthSecret: !!process.env.AUTH_SECRET,
        authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
        hasAuthUrl: !!process.env.AUTH_URL,
        authUrl: process.env.AUTH_URL ?? null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
    }, { status: 500 });
  }
}
