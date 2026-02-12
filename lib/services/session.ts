export type SessionResult = {
  ok: boolean;
  error?: string;
};

export async function createSessionClient(
  idToken: string,
  checkAdmin = false
): Promise<SessionResult> {
  try {
    const response = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken, checkAdmin }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      return { ok: false, error: data.error || "Session failed." };
    }

    return { ok: true };
  } catch (error: any) {
    return { ok: false, error: error?.message || "Session failed." };
  }
}
