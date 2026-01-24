import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(req: Request) {
    try {
        const { code, stepType, userSkills } = await req.json();

        if (!openai) {
            return NextResponse.json({
                valid: false,
                message: "AI Core Offline. Please check API Key.",
                fixedCode: null
            });
        }

        const skillContext = userSkills ? `
        User Proficiency Analysis:
        - Syntax: ${userSkills.syntax}%
        - Logic: ${userSkills.logic}%
        
        Adaptation Protocol:
        - If Syntax < 50: Be extremely specific about semicolons, braces, and types. Use encouraging "Cadet" metaphors.
        - If Syntax > 80: Be concise. Assume competence. Focus on optimization.
        - If Logic > 80: Challenge them with "efficiency" remarks even if code is valid.
        ` : "Treat user as a standard recruit.";

        const systemPrompt = `You are a strict C compiler and game mentor for a beginner.
        The user is learning C variables step-by-step.
        ${skillContext}

        Current Task: Initialize a variable of type '${stepType}'.
        
        Rules:
        1. Search for a variable declaration that matches the goal '${stepType}'.
        2. C-Specific Type Mapping:
           - If stepType is 'string' -> You MUST look for 'char identifier[]' or 'char *identifier'. This IS the correct way to make a string in C. Do NOT ask for a type named 'string'.
           - If stepType is 'char' -> Look for 'char identifier' (single character).
           - If stepType is 'int' -> Look for 'int identifier'.
           - If stepType is 'float' -> Look for 'float identifier' or 'double'.
        3. Ignore irrelevant code: The user might define multiple variables. As long as the *requested* one is present and correct, return valid=true.
        4. Verify Value:
           - 'string': Must use double quotes (e.g. "text").
           - 'char': Must use single quotes (e.g. 'A').
        5. Direction Logic (for Rover):
           - If the code contains "left" or 'L' (in any string/char value), set direction="left".
           - If it contains "right" or 'R', set direction="right".
           - Otherwise "forward".
        
        Respond in JSON format:
        {
            "valid": boolean,
            "message": "Short feedback string (max 1 sentence). Use metaphors.",
            "direction": "left" | "right" | "forward" | "random",
            "speed": number
        }
        
        For 'string' or 'char': If value contains "left" or 'L', direction="left". If "right" or 'R', direction="right". Else "forward".
        For 'int': Set 'speed' to the assigned integer value. Direction="forward".
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Code:\n${code}` }
            ],
            response_format: { type: "json_object" }
        });

        const content = completion.choices[0].message.content;
        return NextResponse.json(JSON.parse(content || "{}"));

    } catch (error) {
        console.error("Validation Error:", error);
        return NextResponse.json({ valid: false, message: "Internal System Error" }, { status: 500 });
    }
}
