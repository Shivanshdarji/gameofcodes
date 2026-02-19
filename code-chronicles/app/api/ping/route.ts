import { NextResponse } from "next/server";

// Returns ping ack + live connected user count (tracked by Socket.io server via globalThis)
export async function GET() {
    const connected = (globalThis as any).__connectedUsers ?? 0;
    return NextResponse.json({ ok: true, connected }, {
        headers: { "Cache-Control": "no-store, no-cache" }
    });
}
