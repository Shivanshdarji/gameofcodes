"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef } from "react";

interface CodeEditorProps {
    initialCode?: string;
    onChange?: (value: string | undefined) => void;
}

export default function CodeEditor({ initialCode = "// Write your C code here\n", onChange }: CodeEditorProps) {
    const editorRef = useRef(null);

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // @ts-ignore
        editorRef.current = editor;
    };

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border border-surface-border bg-[#1e1e1e]">
            <Editor
                height="100%"
                defaultLanguage="c"
                defaultValue={initialCode}
                theme="vs-dark"
                onMount={handleEditorDidMount}
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    fontFamily: "'Fira Code', monospace",
                }}
            />
        </div>
    );
}
