import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI only if key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

// The configured Assistant ID for the AI Mentor
const ASSISTANT_ID = "asst_hhWHNsTMwRHe3SaLiB4NizMf";

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

        // Thread messages must strictly map to 'user' or 'assistant' roles
        const threadMessages = messages.map((m: any) => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.content
        }));

        const additionalInstructions = `Review the user's current context: ${context || "Ignition Level - Learning C Basics"}.
    Keep answers short, encouraging, and in-character as a futuristic ship AI.
    Explain C concepts simply. Use metaphors related to spaceships/rovers.`;

        // Create a thread with the user's history and run the configured Assistant
        const run = await openai.beta.threads.createAndRunPoll({
            assistant_id: ASSISTANT_ID,
            thread: {
                messages: threadMessages,
            },
            additional_instructions: additionalInstructions
        });

        if (run.status === 'completed') {
            const messagesList = await openai.beta.threads.messages.list(run.thread_id);
            // Get the latest assistant response
            const lastMessage = messagesList.data.filter((m: any) => m.role === 'assistant')[0];

            if (lastMessage && lastMessage.content[0].type === 'text') {
                return NextResponse.json({
                    role: "assistant",
                    content: lastMessage.content[0].text.value
                });
            }
        }

        return NextResponse.json({
            role: "assistant",
            content: "My neural link experienced an interruption during transmission. Please hold."
        });

    } catch (error) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: "Failed to process message" }, { status: 500 });
    }
}
