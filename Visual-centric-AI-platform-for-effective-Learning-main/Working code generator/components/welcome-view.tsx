"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
// Import only the icons that are actually used
// import { Loader2 } from "lucide-react"
// import { toast } from "sonner"
// import { ProviderSelector } from "@/components/provider-selector"

import { LLMProvider } from "@/lib/providers/config"; // Import LLMProvider

interface WelcomeViewProps {
  prompt: string
  setPrompt: (value: string) => void
  onGenerate: (provider: string, model: string, systemPrompt: string | null, maxTokens: number | undefined) => void; // Update onGenerate signature
}

export function WelcomeView({
  prompt,
  setPrompt,
  onGenerate
}: WelcomeViewProps) {
  const [titleClass, setTitleClass] = useState("pre-animation")

  // Hardcoded values for provider, model, and system prompt
  const selectedProvider = LLMProvider.AZURE_OPENAI;
  const selectedModel = 'o4-mini';
  const selectedSystemPrompt = 'default';
  const customSystemPrompt = null; // No custom system prompt when hardcoded
  const maxTokens = undefined; // Default max tokens

  useEffect(() => {
    // Add typing animation class after component mounts
    const timer = setTimeout(() => {
      setTitleClass("typing-animation")
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  const handleGenerate = () => {
    onGenerate(selectedProvider, selectedModel, selectedSystemPrompt === 'default' ? null : customSystemPrompt, maxTokens);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-black">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black z-0 animate-pulse-slow"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
        <h1
          className={`text-4xl md:text-6xl font-bold tracking-wider text-white mb-12 ${titleClass}`}
          style={{ fontFamily: "'Space Mono', monospace" }}
        >
         WHAT ARE WE LEARNING TODAY?
        </h1>

        <div className="relative w-full mb-6">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the website you want to create..."
            className="min-h-[150px] w-full bg-gray-900/80 border-gray-800 focus:border-white focus:ring-white text-white placeholder:text-gray-500 pr-[120px] transition-all duration-300"
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="absolute bottom-4 right-4 bg-gray-900/90 hover:bg-gray-800 text-white font-medium tracking-wider py-3 px-12 text-base rounded-md transition-all duration-300 border border-gray-800 hover:border-gray-700 focus:border-white focus:ring-white"
          >
            GENERATE
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 0.6;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }

        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }

        .pre-animation {
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          border-right: 4px solid transparent;
        }

        .typing-animation {
          overflow: hidden;
          white-space: nowrap;
          border-right: 4px solid #fff;
          animation:
            typing 1.75s steps(40, end),
            blink-caret 0.75s step-end infinite;
        }

        @keyframes blink-caret {
          from, to { border-color: transparent }
          50% { border-color: #fff }
        }
      `}</style>
    </div>
  )
}
