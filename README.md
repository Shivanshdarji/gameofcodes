# 🚀 Code Chronicles: The C Expedition

**Code Chronicles** is an immersive, sci-fi educational game designed to teach the C programming language through interactive storytelling and 3D visualization.

![Banner](https://img.shields.io/badge/Status-Active_Development-cyan?style=for-the-badge) ![Version](https://img.shields.io/badge/Version-0.1.0-blue?style=for-the-badge)

## 🌌 Mission Overview

You play as a generic code-operator awakening a Mars Rover on the surface of the Red Planet. Your objective is to bring the rover's systems online, calibrate sensors, and navigate the terrain by writing valid C code.

Unlike traditional coding platforms, **Code Chronicles** visualizes your code's effect in real-time. If you write a bug, the rover fails physically. If you succeed, you see the machine come to life.

## ✨ Key Features

-   **🎮 Gamified Learning**: specific mission levels ranging from "Ignition" (Variables) to "Navigation" (Logic/Loops).
-   **🤖 AI Mentorship**: Built-in AI Companion analyzes your code logic (not just syntax) and provides cryptic, narrative-driven feedback.
-   **🎨 3D Visualization**: Built with **React Three Fiber**, the game renders a high-fidelity Mars environment and Rover model that reacts to your commands.
-   **📝 Interactive IDE**: Full-featured code editor (Monaco) with syntax highlighting for C.
-   **🧩 Drag & Drop Logic**: Hybrid interface allowing beginners to construct code logic visually before typing it out.
-   **🔊 Immersive Audio**: Synthesized voice briefings (TTS) and dynamic sound effects.

## 🛠️ Tech Stack

-   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **3D Engine**: Three.js / @react-three/fiber / @react-three/drei
-   **AI Integration**: OpenAI API (GPT-4o)
-   **Editor**: @monaco-editor/react
-   **Icons**: Lucide React

## 🚀 Getting Started

Follow these instructions to set up the mission control center on your local machine.

### Prerequisites
-   Node.js 18+ installed.
-   An OpenAI API Key (for the AI Mentor features).

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Shivanshdarji/Code-Chronicles.git
    cd Code-Chronicles
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory:
    ```env
    OPENAI_API_KEY=sk-your-api-key-here
    ```
    > **Note:** This file is ignored by git to keep your secrets safe.

4.  **Launch the Game**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🕹️ Controls

-   **Coding Phase**: Type valid C code in the right-hand editor.
-   **Visual Phase**: Drag and drop code blocks to understand structure.
-   **Execute**: Click "TAKE CONTROL" or "COMPILE" to run your code.
-   **Debug**: Check the "System Logs" panel at the bottom for errors and AI feedback.

## 📂 Project Structure

-   `app/`: Next.js App Router pages and API routes.
    -   `level/[id]/`: Dynamic game level logic.
    -   `api/validate-code`: AI validation logic.
-   `components/`: Reusable React components.
    -   `ui/LevelScene.tsx`: The 3D R3F Environment.
-   `public/`: Static assets (models, music).

## 🤝 Contributing

This project is currently in active development. Issues and Pull Requests are welcome!

## 📄 License

[MIT](LICENSE)
