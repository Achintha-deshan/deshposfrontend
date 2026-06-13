"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import api from "../../services/api"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function AIAssistantPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages([{
      role: "assistant",
      content: `ආයුබෝවන්! 🙏 මම DeshPos AI Assistant. ඔයාගේ business ගැන ඕනෑම දෙයක් අහන්න!\n\nඋදාහරණ:\n• "ඔයේ sales summary"\n• "Low stock products"\n• "මේ month profit කීයද?"\n• "Top selling products"\n• "Supplier outstanding"`
    }])
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setLoading(true)

    try {
      const response = await api.post("/ai/ask", {
        message: userMessage,
        history: messages.slice(-6).map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      })
      const aiResponse = response.data.data.reply
      setMessages(prev => [...prev, { role: "assistant", content: aiResponse }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "❌ Error! Server check කරන්නකෝ."
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    "ඔයේ sales summary",
    "Low stock products",
    "Expired products",
    "මේ month profit",
    "Top selling products",
    "Supplier outstanding",
  ]

  return (
    <div className="h-screen bg-slate-900 flex flex-col">

      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.push("/dashboard")}
          className="text-slate-400 hover:text-white text-sm">←</button>
        <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-sm">🤖</div>
        <div>
          <h1 className="text-white font-bold text-sm">DeshPos AI</h1>
          <p className="text-slate-500 text-xs">Powered by Gemini</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 text-xs">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              msg.role === "user"
                ? "bg-blue-600 text-white rounded-br-sm"
                : "bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-sm"
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center text-xs mr-2 flex-shrink-0">
              🤖
            </div>
            <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {quickQuestions.map((q, i) => (
              <button key={i}
                onClick={() => setInput(q)}
                className="flex-shrink-0 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs hover:bg-slate-700 whitespace-nowrap">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ඕනෑ දෙයක් අහන්නකෝ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-40 transition">
            {loading ? "⏳" : "➤"}
          </button>
        </div>
      </div>
    </div>
  )
}