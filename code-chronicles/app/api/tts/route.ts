import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: Request) {
    if (!openai) {
        return NextResponse.json({ error: "OpenAI API Key missing" }, { status: 500 });
    }

    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "onyx", // Deep, authoritative, astronaut-like
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": buffer.length.toString(),
            },
        });

    } catch (error) {
        console.error("TTS Error:", error);
        return NextResponse.json({ error: "Failed to generate speech" }, { status: 500 });
    }
}
