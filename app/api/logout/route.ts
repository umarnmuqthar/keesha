import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("session_user", "", { maxAge: 0, path: "/" });
  response.cookies.set("session_admin", "", { maxAge: 0, path: "/" });
  response.cookies.set("email_verified", "", { maxAge: 0, path: "/" });
  return response;
}
