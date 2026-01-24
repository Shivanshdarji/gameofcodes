import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI only if key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();

        if (!openai) {
            // Fallback if no API Key
            return NextResponse.json({
                role: "assistant",
                content: "I am currently running in offline mode. Please configure my neural link (OPENAI_API_KEY) to enable full cognitive processing."
            });
        }

        const systemPrompt = `You are the AI Mentor for the 'Code Chronicles' game. 
    Review the user's current context: ${context || "Ignition Level - Learning C Basics"}.
    Keep answers short, encouraging, and in-character as a futuristic ship AI.
    Explain C concepts simply. Use metaphors related to spaceships/rovers.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
        });

        return NextResponse.json(completion.choices[0].message);

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
    }
}
