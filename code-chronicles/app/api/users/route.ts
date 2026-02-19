import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        // Fetch total count of profiles
        const { count, error } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });

        if (error) throw error;

        return NextResponse.json({ total_users: count ?? 0 }, {
            headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30" }
        });
    } catch (error) {
        console.error("Failed to fetch user count:", error);
        return NextResponse.json({ total_users: 0 });
    }
}
