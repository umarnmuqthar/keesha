import { NextResponse } from "next/server";
import { getUserSession } from "@/app/actions/authActions";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  const session = await getUserSession();
  if (!session?.uid) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const doc = await db.collection("users").doc(session.uid).get();
  const profile = doc.exists ? doc.data() : {};
  const sessionName = (session as { name?: string }).name;

  return NextResponse.json({
    success: true,
    profile: {
      name: profile?.name || sessionName || "Keesha User",
      email: profile?.email || session?.email || "",
      photo:
        profile?.photoURL ||
        profile?.photoUrl ||
        profile?.photo ||
        profile?.avatar ||
        null,
    },
  });
}
