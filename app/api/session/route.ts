import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase-admin";

type SessionRequest = {
  idToken?: string;
  checkAdmin?: boolean;
};

export async function POST(request: Request) {
  let payload: SessionRequest = {};

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const { idToken, checkAdmin = false } = payload;
  if (!idToken) {
    return NextResponse.json(
      { success: false, error: "Missing ID token." },
      { status: 400 }
    );
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const isAdmin = decodedToken.admin === true || decodedToken.role === "admin";

    if (checkAdmin && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Access Denied: Not an admin." },
        { status: 403 }
      );
    }

    if (!checkAdmin && isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Access Restricted: Admins must use the Admin Portal.",
        },
        { status: 403 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

    const response = NextResponse.json({ success: true });
    response.cookies.set(
      checkAdmin ? "session_admin" : "session_user",
      sessionCookie,
      {
        maxAge: Math.floor(expiresIn / 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      }
    );

    if (!checkAdmin) {
      response.cookies.set("email_verified", String(decodedToken.email_verified || false), {
        maxAge: Math.floor(expiresIn / 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  } catch (error: any) {
    console.error("Session creation failed:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Session failed." },
      { status: 500 }
    );
  }
}
