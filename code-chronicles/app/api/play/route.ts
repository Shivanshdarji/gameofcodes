import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET: Fetches total play count
 * POST: Increments total play count using Supabase RPC
 */

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("app_stats")
            .select("value")
            .eq("key", "total_plays")
            .maybeSingle();

        if (error) throw error;
        return NextResponse.json({ total_plays: data?.value ?? 0 });
    } catch (error) {
        console.error("Failed to fetch play count:", error);
        return NextResponse.json({ total_plays: 0 });
    }
}

export async function POST() {
    try {
        // Use RPC to increment safely
        const { data, error } = await supabase.rpc("increment_stat", { stat_key: "total_plays" });
        if (error) throw error;
        return NextResponse.json({ total_plays: data });
    } catch (error) {
        console.error("Failed to increment play count:", error);
        return NextResponse.json({ error: "Failed to increment" }, { status: 500 });
    }
}
