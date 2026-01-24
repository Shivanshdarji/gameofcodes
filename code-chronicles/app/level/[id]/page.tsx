"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGame } from "@/components/providers/GameProvider";
import LevelScene from "@/components/ui/LevelScene";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Code, Rocket, Map as MapIcon, RefreshCw, Terminal, Play, Cpu, Zap, ChevronRight, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Editor from "@monaco-editor/react";
import { TypewriterText } from "@/components/ui/TypewriterText";
import { MentorChat } from "@/components/ui/MentorChat";

const LEVEL_CONFIG: any = {
    1: {
        title: "Ignition",
        objective: "Initialize the Main Engine",
        intro: {
            title: "MISSION BRIEFING",
            body: [
                "Commander, the Mars Rover is unresponsive.",
                "To engage the primary thrusters, we need to initialize the core operating system.",
                "In C++, every program starts with a 'main' function. It's the ignition key for our code.",
                "Construct the valid 'main' structure to bring the Rover online."
            ]
        },
        modules: [
            {
                id: "boot_sequence",
                label: "BOOT SEQUENCE",
                steps: [
                    {
                        id: "type", label: "RET TYPE", correct: "int", options: [
                            {
                                id: "int", label: "int",
                                desc: "Correct! 'int' tells the OS to expect a numeric status code.",
                                details: [
                                    "Stands for 'Integer' (whole number).",
                                    "Standard return type for main().",
                                    "Used to report error codes."
                                ],
                                gameContext: "The Rover's computer expects a code (0 = OK) to start."
                            },
                            { id: "void", label: "void", desc: "Wait! 'void' means NO return value. The OS needs a status report!" },
                            { id: "string", label: "string", desc: "Careful! 'string' is text. The OS speaks in numbers." },
                            { id: "bool", label: "bool", desc: "Not quite. Boolean is too simple for complex status codes." }
                        ]
                    },
                    {
                        id: "name", label: "ENTRY", correct: "main", options: [
                            {
                                id: "main", label: "main()",
                                desc: "Correct! 'main' is the universal entry point where execution begins.",
                                details: [
                                    "The starting point of every C/C++ program.",
                                    "The OS calls this function first.",
                                    "Must form a unique entry point."
                                ],
                                gameContext: "Like pressing the 'Start' button on the dashboard."
                            },
                            { id: "start", label: "start()", desc: "Hold on. 'start' is a great name, but C looks for 'main' specifically." },
                            { id: "init", label: "init()", desc: "Negative. 'init' is usually for setup functions, not the main entry." },
                            { id: "run", label: "run()", desc: "Action! But 'run' is a verb, not the standard entry point name." }
                        ]
                    },
                    {
                        id: "scope", label: "SCOPE", correct: "brace", options: [
                            {
                                id: "brace", label: "{}",
                                desc: "Correct! Curly braces { } define the scope/body of the function.",
                                details: [
                                    "Defines the beginning and end of a function.",
                                    "Everything inside is part of the command.",
                                    "Also used for loops and conditions."
                                ],
                                gameContext: "Protects the engine logic from outside interference."
                            },
                            { id: "paren", label: "()", desc: "Wait. Parentheses ( ) are for parameters, not the function body." },
                            { id: "brack", label: "[]", desc: "Negative. Square brackets [ ] are for arrays." },
                            { id: "angle", label: "<>", desc: "Incorrect. Angle brackets < > are for templates or includes." }
                        ]
                    },
                    {
                        id: "return", label: "EXIT", correct: "r0", options: [
                            {
                                id: "r0", label: "return 0;",
                                desc: "Perfect! Returning 0 signals 'Success' to the system.",
                                details: [
                                    "Ends the function execution.",
                                    "0 traditionally matches 'Exit Success'.",
                                    "Non-zero values indicate errors."
                                ],
                                gameContext: "Sends the 'All Green' signal to Mission Control."
                            },
                            { id: "r1", label: "return 1;", desc: "Alert! Returning 1 usually signals an 'Error'. We want success!" },
                            { id: "stop", label: "stop;", desc: "Unknown command. C doesn't use 'stop' to exit." },
                            { id: "end", label: "end;", desc: "Syntax Error. 'end' is not a C keyword." }
                        ]
                    }
                ],
                demoScript: [
                    "// Defining the Main Entry Point",
                    "int main() {",
                    "    // Returning Success Status (0)",
                    "    return 0;",
                    "}"
                ],
                initialCode: "// Systems Offline...\n// Waiting for manual override..."
            }
        ],
        initialCode: "// Initialize the main engine\n\n",
        expectedPattern: /int\s+main\s*\(\s*\)\s*\{\s*return\s+0\s*;\s*\}/,
        manualTask: "Type the full initialization code manually."
    },
    2: {
        title: "Systems Check",
        objective: "Calibrate System Variables",
        intro: {
            title: "VARIABLE CALIBRATION",
            body: [
                "Main Engine Online. Now calibrating sensor arrays.",
                "We need to initialize memory slots for our navigation data.",
                "In C++, variables are containers for data. They need a TYPE and a NAME.",
                "Select a variable type to initialize."
            ]
        },
        // [NEW] Hub Configuration for Selection Phase
        hub: {
            label: "SELECT MODULE",
            desc: "Choose a variable type to initialize:",
            options: [
                {
                    id: "int", label: "int", moduleId: "var_int",
                    desc: "Integer Type. Used for whole numbers.",
                    details: ["Stores counts, ID numbers, steps.", "Memory efficient for non-decimals."],
                    gameContext: "Initialize Speed Control."
                },
                {
                    id: "float", label: "float", moduleId: "var_float",
                    desc: "Floating Point. Used for decimals.",
                    details: ["Stores precise measurements (3.14).", "Essential for physics calculations."],
                    gameContext: "Initialize Gravity Sensors."
                },
                {
                    id: "char_arr", label: "char[]", moduleId: "var_string",
                    desc: "String (Char Array). Used for text.",
                    details: ["A sequence of characters.", "Stores messages and status codes."],
                    gameContext: "Initialize Status System."
                },
                {
                    id: "char", label: "char", moduleId: "var_char",
                    desc: "Character. Used for single letters.",
                    details: ["Stores a single symbol.", "Very memory efficient (1 byte)."],
                    gameContext: "Initialize Sector ID."
                }
            ]
        },
        manualSteps: [
            { type: "int", label: "Step 1: Integer", instruction: "Initialize an integer variable (e.g. speed). You can name it anything!" },
            { type: "float", label: "Step 2: Float", instruction: "Now verify gravity sensors with a 'float' variable." },
            { type: "string", label: "Step 3: String", instruction: "Set the mission STATUS with a 'string' variable." },
            { type: "char", label: "Step 4: Character", instruction: "Define the sector with a 'char' variable." }
        ],
        modules: [
            {
                id: "var_int",
                label: "MOD: SPEED",
                steps: [
                    // Note: "Type" step exists for data structure, but will be auto-completed/skipped in logic
                    {
                        id: "type", label: "TYPE", correct: "int",
                        options: [/* Inherited/Copied from Hub Logic visually */]
                    },
                    {
                        id: "name", label: "NAME", correct: "speed",
                        options: [
                            {
                                id: "speed", label: "speed",
                                desc: "Correct! Using a clear, descriptive name is best practice.",
                                details: ["Starts with a letter.", "No spaces.", "Clear meaning."],
                                gameContext: "Any valid name works, but 'speed' helps the crew understand."
                            },
                            {
                                id: "100speed", label: "100speed",
                                desc: "Syntax Error! Variable names CANNOT start with a number.",
                                details: ["Must start with letter or underscore.", "Numbers allowed only after first char.", "Compiler will reject this."],
                                gameContext: "System parser failed to read identifier."
                            },
                            {
                                id: "int", label: "int",
                                desc: "Reserved Keyword! You cannot use 'int' as a name.",
                                details: ["'int' is a language command.", "Avoid 'return', 'if', 'class' etc.", "Ambiguous instruction."],
                                gameContext: "Confusion in command processing."
                            },
                            {
                                id: "my-var", label: "my-var",
                                desc: "Syntax Error! Hyphens '-' are read as subtraction.",
                                details: ["Use underscores 'my_var'.", "CamelCase 'myVar' is also good.", "No special characters allowed."],
                                gameContext: "System tried to subtract 'var' from 'my'."
                            }
                        ]
                    },
                    { id: "op", label: "OP", correct: "eq", options: [{ id: "eq", label: "=", desc: "Assignment." }, { id: "eqeq", label: "==", desc: "Comparison." }, { id: "p", label: "+", desc: "Math add." }, { id: "m", label: "-", desc: "Math sub." }] },
                    { id: "val", label: "VAL", correct: "100", options: [{ id: "100", label: "100;", desc: "Value." }, { id: "100s", label: "\"100\";", desc: "String." }, { id: "100f", label: "100.5;", desc: "Float." }, { id: "100c", label: "'100';", desc: "Char." }] }
                ],
                demoScript: ["int speed = 100;", "// Variable 'speed' initialized."]
            },
            {
                id: "var_float",
                label: "MOD: GRAVITY",
                steps: [
                    { id: "type", label: "TYPE", correct: "float", options: [] },
                    {
                        id: "name", label: "NAME", correct: "gravity",
                        options: [
                            { id: "gravity", label: "gravity", desc: "Correct. Clear and meaningful.", details: ["Descriptive names save lives."], gameContext: "Physics engine hook." },
                            { id: "g", label: "g", desc: "Too short. 'g' is vague. use meaningful name!", details: ["Avoid single letters in production.", "What is g? grams? gravity?"], gameContext: "Ambiguous variable name." },
                            { id: "float", label: "float", desc: "Keyword Error. Cannot use type as name.", details: ["Syntax Error."], gameContext: "Compiler Confusion." },
                            { id: "9point8", label: "9point8", desc: "Syntax Error. Starts with number.", details: ["Invalid identifier."], gameContext: "Parser Error." }
                        ]
                    },
                    { id: "op", label: "OP", correct: "eq", options: [{ id: "eq", label: "=", desc: "Assignment." }, { id: "plus", label: "+", desc: "Math." }, { id: "eqeq", label: "==", desc: "Compare." }, { id: "min", label: "-", desc: "Math." }] },
                    { id: "val", label: "VAL", correct: "3.72", options: [{ id: "3.72", label: "3.72;", desc: "Correct (Mars Gravity)." }, { id: "3", label: "3;", desc: "Integer (inaccurate)." }, { id: "g_str", label: "\"3.72\";", desc: "String (Type mismatch)." }, { id: "3f", label: "3.72f", desc: "Valid float suffix (also correct, but stick to simple)." }] }
                ],
                demoScript: ["float gravity = 3.72;", "// Gravity sensor calibrated."]
            },
            {
                id: "var_string",
                label: "MOD: STATUS",
                steps: [
                    { id: "type", label: "TYPE", correct: "char_arr", options: [] },
                    {
                        id: "name", label: "NAME", correct: "status",
                        options: [
                            { id: "status", label: "status[]", desc: "Correct. The brackets [] declare the array size automatically.", details: ["status[] tells compiler to fit the text.", "Standard C string decl."], gameContext: "Status buffer allocated." },
                            { id: "s", label: "s", desc: "Missing brackets for array.", details: ["'char s' is one char.", "Need 's[]' for string."], gameContext: "Memory allocation failed." },
                            { id: "Status", label: "Status", desc: "PascalCase is ok, but missing brackets []", details: ["Valid name, wrong type decl."], gameContext: "Type mismatch." },
                            { id: "stat-us", label: "stat-us", desc: "Hyphen error.", details: ["Syntax error."], gameContext: "Subtraction interpreted." }
                        ]
                    },
                    { id: "op", label: "OP", correct: "eq", options: [{ id: "eq", label: "=", desc: "Assign." }] },
                    { id: "val", label: "VAL", correct: "ok", options: [{ id: "ok", label: "\"OK\";", desc: "Correct. Double quotes for strings." }, { id: "ok_sq", label: "'OK';", desc: "Error! Single quotes are for ONE char." }, { id: "0", label: "0;", desc: "Number." }, { id: "true", label: "true;", desc: "Bool." }] }
                ],
                demoScript: ["char status[] = \"OK\";", "// Status buffer: ONLINE."]
            },
            {
                id: "var_char",
                label: "MOD: SECTOR",
                steps: [
                    { id: "type", label: "TYPE", correct: "char", options: [] },
                    {
                        id: "name", label: "NAME", correct: "sector",
                        options: [
                            { id: "sector", label: "sector", desc: "Valid identifier.", details: ["Clear and precise."], gameContext: "Sector Locked." },
                            { id: "sec", label: "sec", desc: "Ambiguous (seconds?).", details: ["Be clearer."], gameContext: "Warning." },
                            { id: "char", label: "char", desc: "Keyword Error.", details: ["Cannot use type as name."], gameContext: "Syntax Error." },
                            { id: "1", label: "1", desc: "Number Error.", details: ["Cannot start with number."], gameContext: "Syntax Error." }
                        ]
                    },
                    { id: "op", label: "OP", correct: "eq", options: [{ id: "eq", label: "=", desc: "Assign." }] },
                    { id: "val", label: "VAL", correct: "A", options: [{ id: "A", label: "'A';", desc: "Correct. Single quotes for char." }, { id: "A_dq", label: "\"A\";", desc: "Error! Double quotes mean String." }, { id: "65", label: "65;", desc: "Valid (ASCII), but 'A' is clearer." }, { id: "AA", label: "'AA';", desc: "Overflow. Only 1 char allowed." }] }
                ],
                demoScript: ["char sector = '7';", "// Sector 7 Confirmed."]
            }
        ],
        initialCode: "int main() {\n    // Initialize your variables here\n    \n    return 0;\n}",
        expectedPattern: /.*/, // Handled by AI
        manualTask: "Follow the AI Mentor instructions."
    },
    3: {
        title: "Navigation",
        objective: "Autonomous Logic",
        modules: [
            {
                id: "cond_logic",
                label: "NAV LOGIC",
                steps: [
                    { id: "kw", label: "KEYWORD", correct: "if", options: [{ id: "if", label: "if", desc: "Check Condition." }, { id: "while", label: "while", desc: "Loop." }, { id: "for", label: "for", desc: "Loop." }, { id: "func", label: "func", desc: "Def." }] },
                    { id: "cond", label: "CONDITION", correct: "check", options: [{ id: "check", label: "(status == \"GO\")", desc: "Check Status." }, { id: "bad", label: "(GO)", desc: "Syntax Error." }, { id: "bad2", label: "status", desc: "Incomplete." }, { id: "bad3", label: "(\"GO\")", desc: "Logic Error." }] },
                    { id: "open", label: "BLOCK", correct: "brace", options: [{ id: "brace", label: "{", desc: "Start Block." }, { id: "p", label: "(", desc: "Wrong." }, { id: "b", label: "[", desc: "Wrong." }, { id: "l", label: "<", desc: "Wrong." }] },
                    { id: "act", label: "ACTION", correct: "move", options: [{ id: "move", label: "move();", desc: "Action." }, { id: "stop", label: "stop();", desc: "Wrong." }, { id: "wait", label: "wait();", desc: "Wrong." }, { id: "turn", label: "turn();", desc: "Wrong." }] }
                ],
                demoScript: ["if (status == \"GO\") {", "    move();", "}"],
                initialCode: "int main() {\n    string status = \"GO\";\n    \n    return 0;\n}"
            }
        ],
        initialCode: "int main() {\n    string status = \"GO\";\n    // Add logic here\n    return 0;\n}",
        expectedPattern: /if\s*\(\s*status\s*==\s*"GO"\s*\)\s*\{\s*move\(\s*\)\s*;\s*\}/,
        manualTask: "Implement the navigation logic."
    }
};

type Phase = "intro" | "exploration" | "demo" | "demo_review" | "practice" | "compiling" | "success" | "error";

export default function LevelPage() {
    const params = useParams();
    const router = useRouter();
    const { completeLevel, user, updateStats } = useGame();

    const levelId = typeof params.id === "string" ? parseInt(params.id) : 1;
    const config = LEVEL_CONFIG[levelId] || LEVEL_CONFIG[1];

    const [phase, setPhase] = useState<Phase>("intro");
    const [code, setCode] = useState("");

    // Fix: Use Ref to track latest code state for async runDemo
    const codeRef = useRef(code);
    useEffect(() => { codeRef.current = code; }, [code]);

    const [logs, setLogs] = useState<string[]>(["> System initialized...", "> Waiting for neural link..."]);
    const [showModal, setShowModal] = useState(false);
    const [simulationSpeed, setSimulationSpeed] = useState(0);

    const [currentModuleIndex, setCurrentModuleIndex] = useState(0); // Used for Levels 1 & 3
    const [constructionStep, setConstructionStep] = useState(0);
    const [blueprint, setBlueprint] = useState<any>({});
    const [feedback, setFeedback] = useState<any>(null);

    // Level 2 Specific State: Dynamic Progression
    const [completedModules, setCompletedModules] = useState<string[]>([]);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

    const [manualStepIndex, setManualStepIndex] = useState(0);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [moveDirection, setMoveDirection] = useState<"forward" | "left" | "right" | "random">("forward");

    // Determine Active Module
    // If Level 2, driven by activeModuleId. If Level 1/3, driven by currentModuleIndex.
    const activeModule = levelId === 2
        ? (activeModuleId ? config.modules.find((m: any) => m.id === activeModuleId) : null)
        : (config.modules[currentModuleIndex] || config.modules[0]);

    // Helper for Level 2 Hub
    const isHub = levelId === 2 && !activeModuleId;
    const isMultiModule = levelId === 2 || config.modules.length > 1;

    const successAudioRef = useRef<HTMLAudioElement | null>(null);
    const failAudioRef = useRef<HTMLAudioElement | null>(null);
    const clickAudioRef = useRef<HTMLAudioElement | null>(null);

    // Audio Cleanup
    useEffect(() => {
        return () => {
            if (successAudioRef.current) { successAudioRef.current.pause(); successAudioRef.current.currentTime = 0; }
            if (failAudioRef.current) { failAudioRef.current.pause(); failAudioRef.current.currentTime = 0; }
            if (clickAudioRef.current) { clickAudioRef.current.pause(); clickAudioRef.current.currentTime = 0; }
        };
    }, []);

    useEffect(() => {
        successAudioRef.current = new Audio("/music/start.mp3");
        failAudioRef.current = new Audio("/music/fail.mp3");
        clickAudioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3");
    }, []);

    useEffect(() => {
        // Reset Level State
        setCurrentModuleIndex(0);
        setCompletedModules([]);
        setActiveModuleId(null);
        setConstructionStep(0);
        setBlueprint({});
        setPhase(config.intro ? "intro" : "exploration");
        setCode(config.initialCode);
        setLogs(["> Loading Level Configuration...", `> Objective: ${config.objective}`]);
        setSimulationSpeed(0);
        setManualStepIndex(0);
        setAiFeedback(null);
    }, [levelId, config]);

    const handleTTS = async (text: string) => {
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            if (!res.ok) throw new Error("TTS Failed");
            const blob = await res.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play().catch(e => console.error("Audio playback error:", e));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDragEnd = (event: any, info: any, option: any) => {
        // HUB LOGIC: Selecting a module
        if (isHub) {
            // Check if dropped near the center (Generic Zone)
            // Just assume any drop is a selection if it's "Hub Options"
            // We can add a visual "Selection Slot" in UI

            // For now, accept drop anywhere or specific slot
            handleTTS(option.desc);
            setFeedback(option);
            setLogs(prev => [...prev, `> MODULE SELECTED: ${option.label}`]);
            clickAudioRef.current?.play().catch(() => { });

            // Transition to Module
            setActiveModuleId(option.moduleId);
            // Preset blueprint for Type
            setBlueprint({ type: option.label });
            // Determine correct next step (Skip step 0 which is Type)
            setConstructionStep(1);
            return;
        }

        // MODULE LOGIC
        if (!activeModule) return;

        const currentStepData = activeModule.steps[constructionStep];
        const slotId = `blueprint-slot-${currentStepData.id}`;
        const slot = document.getElementById(slotId);

        if (!slot) return;

        const slotRect = slot.getBoundingClientRect();
        const dropPoint = { x: info.point.x, y: info.point.y };

        const padding = 50;
        const isOver =
            dropPoint.x >= (slotRect.left - padding) &&
            dropPoint.x <= (slotRect.right + padding) &&
            dropPoint.y >= (slotRect.top - padding) &&
            dropPoint.y <= (slotRect.bottom + padding);

        if (isOver) {
            handleTTS(option.desc);
            setFeedback(option);

            if (option.id === currentStepData.correct) {
                setLogs(prev => [...prev, `> ${option.label}`]);
                clickAudioRef.current?.play().catch(() => { });
                setBlueprint((prev: any) => ({ ...prev, [currentStepData.id]: option.label }));

                setTimeout(() => {
                    if (constructionStep < activeModule.steps.length - 1) {
                        setConstructionStep(prev => prev + 1);
                    } else {
                        setLogs(prev => [...prev, `> ${activeModule.label} VERIFIED.`]);

                        // Determine new code logic
                        const newLine = `    ${activeModule.demoScript[0]}\n`;

                        if (levelId === 2 || config.modules.length > 1) {
                            setCode(prev => {
                                // If return 0 exists, insert before it
                                if (prev.includes("return 0;")) {
                                    const parts = prev.split("return 0;");
                                    return parts[0] + newLine + "    return 0;" + parts[1];
                                }
                                return prev + newLine;
                            });
                        }

                        setTimeout(() => {
                            setLogs(prev => [...prev, "> ARCHITECTURE VERIFIED.", "> INITIATING DEMO PROTOCOL..."]);
                            setPhase("demo");
                            runDemo();
                        }, 1000);
                    }
                }, 2000);
            } else {
                setLogs(prev => [...prev, `> ERROR: ${option.desc}`]);
            }
        }
    };

    const runDemo = async () => {
        let currentCode = codeRef.current;

        if (levelId === 1) {
            currentCode = "// Initialize engine...\n\n";
            setCode(currentCode);
        }

        await new Promise(r => setTimeout(r, 1000));

        if (activeModule) {
            for (const line of activeModule.demoScript) {
                if (!currentCode.includes(line)) {
                    currentCode += getIndent(currentCode) + line + "\n";
                    setCode(currentCode);
                    await new Promise(r => setTimeout(r, 800));
                }
            }
        }

        setLogs(prev => [...prev, "> DEMO COMPLETE.", "> WAITING FOR INPUT."]);
        setPhase("demo_review");
    };

    const getIndent = (c: string) => {
        return c.includes("return 0") ? "    " : "";
    };

    const nextModule = () => {
        if (levelId === 2) {
            // Return to Hub Logic
            if (activeModuleId) {
                setCompletedModules(prev => [...prev, activeModuleId]);
                setActiveModuleId(null);
                setConstructionStep(0);
                setBlueprint({});
                setFeedback(null); // Clear feedback when returning to hub
                setPhase("exploration");
                setLogs(prev => [...prev, "> SYSTEM INTEGRATED.", "> SELECT NEXT MODULE."]);
            }
        } else {
            // Standard Logic
            setCurrentModuleIndex(prev => prev + 1);
            setConstructionStep(0);
            setBlueprint({});
            setPhase("exploration");
            setLogs(prev => [...prev, "> INITIALIZING NEXT SYSTEM..."]);
        }
    };

    const startPractice = () => {
        setPhase("practice");
        setFeedback(null); // Clear any lingering feedback
        if (levelId === 2) {
            setCode(config.initialCode);
            setManualStepIndex(0);
        } else {
            setCode(config.initialCode);
        }
        setLogs(prev => [...prev, "> MANUAL CONTROL ENGAGED."]);
    };

    const handleCompile = async () => {
        setPhase("compiling");
        setLogs(prev => [...prev, "> Compiling..."]);
        setAiFeedback(null);
        await new Promise(r => setTimeout(r, 1500));

        if (levelId === 2) {
            const currentStep = config.manualSteps[manualStepIndex];
            try {
                const res = await fetch("/api/validate-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, stepType: currentStep.type, userSkills: user?.data.skills }),
                });
                const data = await res.json();

                if (data.valid) {
                    setPhase("success");
                    updateStats('syntax', 100); // Boost stats
                    updateStats('logic', 100);
                    setLogs(prev => [...prev, "> SUCCESS: Module Initialized."]);
                    if (levelId !== 2) successAudioRef.current?.play().catch((e) => setLogs(p => [...p, "AUDIO ERR: " + e.message]));

                    setMoveDirection(data.direction || "forward");
                    // Use speed from API if provided (e.g. from 'int' variable), otherwise default based on direction
                    const demoSpeed = data.speed !== undefined ? (data.speed / 100) : 1.0;
                    setSimulationSpeed(demoSpeed > 0 ? demoSpeed : 1.0);

                    setTimeout(() => {
                        setSimulationSpeed(0);
                        setPhase("practice");

                        if (manualStepIndex < config.manualSteps.length - 1) {
                            setManualStepIndex(prev => prev + 1);
                            setLogs(prev => [...prev, `> MISSION UPDATE: ${config.manualSteps[manualStepIndex + 1].instruction}`]);
                            setCode(prev => prev + "\n    ");
                        } else {
                            completeLevel(levelId);
                            setShowModal(true);
                        }
                    }, 3000);

                } else {
                    setPhase("practice");
                    updateStats('syntax', 0); // Penny penalty
                    setLogs(prev => [...prev, `> ERROR: ${data.message}`]);
                    setAiFeedback(data.message);
                }
            } catch (e) {
                setPhase("error");
                setLogs(prev => [...prev, "> CRITICAL ERROR: Validation Service Offline."]);
                setTimeout(() => setPhase("practice"), 2000);
            }
            return;
        }

        const normalizedCode = code.replace(/\s+/g, ' ').trim();
        const isMatch = config.expectedPattern.test(normalizedCode);

        if (isMatch) {
            setPhase("success");
            setLogs(prev => [...prev, "> SUCCESS: System Optimal."]);
            successAudioRef.current?.play().catch((e) => setLogs(p => [...p, "AUDIO ERR: " + e.message]));
            completeLevel(levelId);
            setTimeout(() => setShowModal(true), 2000);
        } else {
            setPhase("error");
            setLogs(prev => [...prev, "> ERROR: Verification Failed.", "> Check syntax."]);
            failAudioRef.current?.play().catch((e) => setLogs(p => [...p, "AUDIO ERR: " + e.message]));
            setTimeout(() => setPhase("practice"), 2000);
        }
    };

    const renderHubOptions = () => {
        if (!config.hub) return null;
        const availableOptions = config.hub.options.filter((opt: any) => !completedModules.includes(opt.moduleId));

        if (availableOptions.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/50 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                        <Zap className="w-10 h-10 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2 font-mono tracking-wider">SYSTEMS CALIBRATED</h2>
                        <p className="text-white/60 text-sm">All variable modules have been initialized.</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-xs">
                        <div className="flex justify-between text-xs font-mono text-green-400/80 border-b border-white/10 pb-1"><span>SPEED</span><span>[INT] OK</span></div>
                        <div className="flex justify-between text-xs font-mono text-green-400/80 border-b border-white/10 pb-1"><span>GRAVITY</span><span>[FLOAT] OK</span></div>
                        <div className="flex justify-between text-xs font-mono text-green-400/80 border-b border-white/10 pb-1"><span>STATUS</span><span>[STRING] OK</span></div>
                        <div className="flex justify-between text-xs font-mono text-green-400/80 border-b border-white/10 pb-1"><span>SECTOR</span><span>[CHAR] OK</span></div>
                    </div>
                    <Button onClick={startPractice} className="w-full max-w-xs bg-green-600 hover:bg-green-500 text-white py-4 text-lg font-mono font-bold tracking-widest shadow-lg animate-pulse">
                        ENGAGE MANUAL CONTROL &gt;_
                    </Button>
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-3">
                <h2 className="text-xl font-bold text-white mb-2 font-mono">SELECT MODULE</h2>
                <p className="text-white/50 mb-6 text-xs">{config.hub.desc}</p>
                {availableOptions.map((opt: any) => (
                    <motion.div
                        key={opt.id} drag dragSnapToOrigin
                        whileDrag={{ scale: 1.05, zIndex: 9999, cursor: "grabbing", opacity: 0.8 }}
                        whileHover={{ scale: 1.01, cursor: "grab", borderColor: "rgba(6,182,212,0.5)" }}
                        onDragEnd={(e, info) => handleDragEnd(e, info, opt)}
                        className="bg-[#1a1a1a] border border-white/10 p-4 rounded-lg shadow-md hover:shadow-cyan-500/10 cursor-grab flex items-center justify-between group relative"
                        style={{ zIndex: 50 }}
                    >
                        <div className="flex flex-col">
                            <code className="text-md font-mono text-cyan-400 pointer-events-none group-hover:text-cyan-300 transition-colors">{opt.label}</code>
                        </div>
                    </motion.div>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans">
            {/* Header */}
            <div className="h-16 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <Link href="/map" className="p-2 text-white/60 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="font-bold font-mono tracking-wider text-cyan-400">MISSION: {config.title.toUpperCase()}</h1>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest">Sector 1 // Node {levelId} // {isHub ? "HUB" : activeModule?.label || "MOD"}</p>
                    </div>
                </div>
                <Link href="/playground" className="text-xs text-white/30 hover:text-cyan-400 flex items-center gap-2 border border-white/10 px-3 py-1 rounded-full transition-colors">
                    <Code className="w-3 h-3" /> Playground
                </Link>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                {/* LEFT: 50% (Toolbox/Editor + Mentor) */}
                <div className="w-1/2 flex flex-col bg-[#0f1014] border-r border-white/10 relative z-20 overflow-visible">

                    {/* Top Section: Editor / Toolbox */}
                    {phase === "intro" ? (
                        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#0f1014]">
                            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="z-10 max-w-md"
                            >
                                <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                                    <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
                                </div>
                                <h2 className="text-3xl font-bold font-mono text-white mb-2">{config.intro?.title}</h2>
                                <div className="h-1 w-20 bg-cyan-500 mx-auto mb-8" />

                                <div className="space-y-4 text-white/70 text-sm leading-relaxed mb-8">
                                    {config.intro?.body.map((line: string, i: number) => (
                                        <p key={i}>{line}</p>
                                    ))}
                                </div>

                                <Button onClick={() => setPhase("exploration")} className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 text-lg font-bold tracking-widest shadow-[0_0_20px_rgba(8,145,178,0.4)]">
                                    INITIALIZE SYSTEM <ChevronRight className="ml-2 w-5 h-5" />
                                </Button>
                            </motion.div>
                        </div>
                    ) : phase === "exploration" ? (
                        <div className="flex-1 p-6 flex flex-col overflow-visible custom-scrollbar">
                            {/* HUB RENDER */}
                            {isHub ? renderHubOptions() : (
                                <>
                                    <h2 className="text-xl font-bold text-white mb-2 font-mono">{activeModule?.label || "CONSTRUCT"}</h2>
                                    <p className="text-white/50 mb-6 text-xs">Drag the correct component:</p>

                                    <div className="flex flex-col gap-3">
                                        {activeModule?.steps[constructionStep]?.options.map((opt: any) => (
                                            <motion.div
                                                key={opt.id} drag dragSnapToOrigin
                                                whileDrag={{ scale: 1.05, zIndex: 9999, cursor: "grabbing", opacity: 0.8 }}
                                                whileHover={{ scale: 1.01, cursor: "grab", borderColor: "rgba(6,182,212,0.5)" }}
                                                onDragEnd={(e, info) => handleDragEnd(e, info, opt)}
                                                className="bg-[#1a1a1a] border border-white/10 p-4 rounded-lg shadow-md hover:shadow-cyan-500/10 cursor-grab flex items-center justify-between group relative"
                                                style={{ zIndex: 50 }}
                                            >
                                                <div className="flex flex-col">
                                                    <code className="text-md font-mono text-cyan-400 pointer-events-none group-hover:text-cyan-300 transition-colors">{opt.label}</code>
                                                    {levelId === 2 && opt.id.includes("100") && <span className="text-[9px] text-red-500 mt-1">Invalid Syntax</span>}
                                                </div>
                                                <span className="text-[10px] text-white/20 uppercase tracking-widest pointer-events-none group-hover:text-white/40">DRAG ME</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col bg-[#1c1c1c] overflow-hidden relative">
                            <div className="h-10 flex items-center px-4 justify-between border-b border-white/10 bg-[#151515]">
                                <span className="text-xs text-white/50 font-mono">main.c</span>
                                {phase === "demo" && <span className="text-xs text-cyan-400 animate-pulse">AI PILOT</span>}
                                {(phase === "practice" || phase === "compiling" || phase === "success" || phase === "error") && (
                                    <div className="flex items-center gap-4">
                                        {config.manualSteps && (
                                            <span className="text-[10px] text-orange-400 font-mono tracking-widest">
                                                {config.manualSteps[manualStepIndex]?.label.toUpperCase()}
                                            </span>
                                        )}
                                        <span className="text-xs text-green-400 font-bold animate-pulse">MANUAL CONTROL ACTIVE</span>
                                        <Button
                                            onClick={handleCompile}
                                            disabled={phase === "compiling"}
                                            className="h-7 text-[10px] bg-green-600 hover:bg-green-500 border border-green-500/50 text-white px-4 font-mono tracking-widest shadow-[0_0_10px_rgba(22,163,74,0.4)]"
                                        >
                                            {phase === "compiling" ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2" />}
                                            EXECUTE CODE
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="relative flex-1">
                                <Editor height="100%" defaultLanguage="c" theme="vs-dark" value={code}
                                    onChange={(val) => phase === "practice" ? setCode(val || "") : null}
                                    options={{ readOnly: phase === "demo" || phase === "demo_review", minimap: { enabled: false }, fontSize: 13 }}
                                />
                                {aiFeedback && (
                                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute bottom-4 right-4 max-w-sm bg-red-950/90 border border-red-500/50 p-4 rounded-lg shadow-xl backdrop-blur-md">
                                        <div className="flex items-start gap-3">
                                            <Zap className="w-5 h-5 text-red-500 shrink-0" />
                                            <div>
                                                <h4 className="text-red-400 font-bold text-xs uppercase mb-1">AI Validation Error</h4>
                                                <p className="text-white/80 text-xs leading-relaxed">{aiFeedback}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Bottom Section: Mentor Chat */}
                    <div className="h-[250px] border-t border-white/10 bg-[#080808]">
                        <MentorChat context={`Level ${levelId}. Phase ${phase}.`} code={code} />
                    </div>
                </div>

                {/* RIGHT: 50% (Model + Logs) */}
                <div className="w-1/2 flex flex-col bg-black relative border-l border-white/10 z-0">

                    {/* Top: Model Space (Flex 1 to take remaining space) */}
                    <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#050505]">
                        <LevelScene isSuccess={phase === "success"} speed={simulationSpeed} scale={0.8} direction={moveDirection} />

                        {/* Blueprint Overlay */}
                        {phase === "exploration" && (
                            <div className="absolute inset-0 flex flex-col justify-end pb-2 items-center pointer-events-none z-10 w-full">
                                {isHub ? (
                                    <div className="text-center">
                                        <h3 className="text-cyan-400 font-mono text-xl mb-4 animate-pulse">INITIATING SUBSYSTEM...</h3>
                                        <div className="w-64 h-24 border-2 border-dashed border-cyan-500/30 rounded-lg flex items-center justify-center bg-cyan-500/5 backdrop-blur-sm">
                                            <p className="text-cyan-400/50 text-sm tracking-widest">DROP MODULE HERE</p>
                                        </div>
                                    </div>
                                ) : (activeModule && (
                                    <div className="bg-black/50 backdrop-blur-md p-6 rounded-xl border border-white/10 flex gap-4 pointer-events-auto shadow-2xl items-end scale-100 origin-bottom">
                                        {activeModule.steps.map((step: any, i: number) => {
                                            const isDone = !!blueprint[step.id]; // Will be pre-set to true for Step 1 (Type)
                                            const isCurrent = constructionStep === i;

                                            // Special handling for pre-filled Type step in Level 2
                                            if (levelId === 2 && step.id === "type" && isDone) {
                                                return (
                                                    <div key={step.id} className="flex flex-col gap-2 items-center opacity-50">
                                                        <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{step.label}</span>
                                                        <div className="min-w-[5rem] h-12 px-4 flex items-center justify-center rounded border-b-2 font-mono text-lg border-green-400 text-green-400 bg-green-900/10">
                                                            {blueprint[step.id]}
                                                        </div>
                                                    </div>
                                                )
                                            }

                                            if (step.id === "scope" && isDone) {
                                                const returnStepIndex = activeModule.steps.findIndex((s: any) => s.id === "return");
                                                const returnIsDone = !!blueprint["return"];
                                                const returnIsCurrent = constructionStep === returnStepIndex;

                                                return (
                                                    <div key={step.id} className="text-green-400 font-bold flex flex-col items-start bg-white/5 p-4 rounded border border-white/10 text-xl">
                                                        <span>{"{"}</span>
                                                        <div className="pl-6 py-2">
                                                            {returnIsDone ? (
                                                                <span className="text-green-400">return 0;</span>
                                                            ) : (
                                                                returnIsCurrent ? (
                                                                    <div id="blueprint-slot-return" className="min-w-[5rem] h-8 border-b-2 border-dashed border-cyan-500/50 text-cyan-400/80 px-2 animate-pulse text-xs tracking-widest text-center flex items-center justify-center">
                                                                        DROP HERE
                                                                    </div>
                                                                ) : (
                                                                    <span className="opacity-30">...</span>
                                                                )
                                                            )}
                                                        </div>
                                                        <span>{"}"}</span>
                                                    </div>
                                                );
                                            }

                                            if (step.id === "return") return null;

                                            return (
                                                <div key={step.id} className="flex flex-col gap-2 items-center">
                                                    <span className="text-[10px] text-white/30 uppercase tracking-widest mb-1">{step.slotLabel || step.label}</span>
                                                    <div className={`
                                                        min-w-[5rem] h-12 px-4 flex items-center justify-center rounded border-b-2 font-mono text-lg transition-all
                                                        ${isDone ? "border-green-400 text-green-400 bg-green-900/10" :
                                                            isCurrent ? "border-cyan-500 text-cyan-400 bg-cyan-900/10 animate-pulse shadow-[0_0_20px_rgba(6,182,212,0.4)]" : "border-white/10 text-white/10 bg-white/5"}
                                                    `}>
                                                        {isDone ? blueprint[step.id] : isCurrent ? <div id={`blueprint-slot-${step.id}`} className="w-full text-center text-[10px] opacity-70">DROP HERE</div> : "?"}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Feedback Toast (Persistent) */}
                        <AnimatePresence>
                            {feedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-1 left-1/2 -translate-x-1/2 z-50 mt-1 bg-[#111] border border-cyan-500/30 text-white p-6 rounded-xl font-sans text-sm shadow-xl flex flex-col gap-3 max-w-lg w-full"
                                >
                                    <button
                                        onClick={() => setFeedback(null)}
                                        className="absolute top-2 right-2 p-1 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                                            <Zap className="w-5 h-5 text-cyan-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-cyan-400 mb-1 font-mono uppercase tracking-wider">{feedback.label}</h4>
                                            <p className="text-white/80 mb-3">{feedback.desc}</p>
                                            {feedback.details && (
                                                <ul className="list-disc list-inside space-y-1 text-white/60 text-xs mb-3">
                                                    {feedback.details.map((d: string, i: number) => (
                                                        <li key={i}>{d}</li>
                                                    ))}
                                                </ul>
                                            )}
                                            {feedback.gameContext && (
                                                <div className="bg-white/5 rounded p-3 border-l-2 border-green-500">
                                                    <p className="text-[10px] uppercase text-green-500 font-bold mb-1">ROVER LINK</p>
                                                    <p className="text-green-300 text-xs italic">"{feedback.gameContext}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Demo Review Overlay */}
                        {phase === "demo_review" && (
                            <div className="absolute inset-0 bg-transparent flex items-end justify-center p-8 pointer-events-none">
                                {isMultiModule && completedModules.length < 4 ? (
                                    <Button onClick={nextModule} className="bg-cyan-600/90 hover:bg-cyan-500 text-white border border-cyan-500/30 px-6 py-3 text-lg font-mono tracking-widest shadow-lg backdrop-blur-md pointer-events-auto animate-pulse flex items-center gap-2">
                                        NEXT SYSTEM <ChevronRight className="w-5 h-5" />
                                    </Button>
                                ) : (
                                    <Button onClick={startPractice} className="bg-black/60 hover:bg-black/80 text-cyan-400 border border-cyan-500/30 px-6 py-3 text-lg font-mono tracking-widest shadow-lg backdrop-blur-md pointer-events-auto animate-pulse">
                                        TAKE CONTROL &gt;_
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Bottom: System Logs (Height 30% or Fixed) */}
                    <div className="h-[300px] bg-black/60 backdrop-blur-sm border-t border-white/10 flex flex-col">
                        <div className="px-4 py-2 bg-black/40 border-b border-white/10 flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-white/30" />
                            <span className="text-xs font-mono text-white/50 tracking-wider">SYSTEM LOGS</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs text-white/70">
                            {logs.map((l, i) => <div key={i} className={l.includes("COMPLETE") || l.includes("VERIFIED") || l.includes("SUCCESS") ? "text-green-400" : l.includes("ERROR") ? "text-red-400" : ""}>{l}</div>)}
                            <div ref={(el) => { el?.scrollIntoView({ behavior: "smooth" }) }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Completion Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-[#111] border border-green-500/30 p-8 rounded-2xl max-w-sm w-full text-center relative overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-1 bg-green-500 shadow-[0_0_20px_#22c55e]" />
                            <Rocket className="w-16 h-16 text-green-400 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-white mb-2">MISSION COMPLETE</h2>
                            <p className="text-white/60 mb-8">All systems verified. Ready for departure?</p>
                            <div className="space-y-3">
                                <Button onClick={() => router.push(levelId < 3 ? `/level/${levelId + 1}` : "/playground")} className="w-full bg-green-600 hover:bg-green-500 py-6 text-lg tracking-widest font-bold">
                                    GO TO SPACESHIP
                                </Button>
                                <Button onClick={() => router.push("/map")} className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/50">
                                    <MapIcon className="w-4 h-4 mr-2" /> RETURN TO MAP
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
