This route creates a session cookie from a Firebase ID token.

POST /api/session
Body: { "idToken": string, "checkAdmin": boolean }
Response: { success: boolean, error?: string }
