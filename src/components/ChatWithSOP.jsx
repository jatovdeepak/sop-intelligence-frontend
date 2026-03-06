import { useState, useEffect, useRef } from "react";
import { X, Send, Globe, Copy, HelpCircle, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatWithSOP({ sop, onClose }) {
  console.log("sop", sop);
  // --- STATE & REFS ---
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_RAG_URL || "";

  // --- INITIALIZATION ---
  useEffect(() => {
    let storedId = localStorage.getItem("sop_user_id");
    if (!storedId) {
      storedId = "user_" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("sop_user_id", storedId);
    }
    setUserId(storedId);
    fetchHistory(storedId);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // --- API FUNCTIONS ---
  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/user/history/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data && data.length > 0) {
        const historyMessages = [];
        data.forEach((item) => {
          historyMessages.push({ role: "user", content: item.question });
          
          if (item.suggestions && item.suggestions.length > 0) {
            historyMessages.push({
              role: "assistant",
              type: "suggestions",
              content: "I found similar questions in my memory. Did you mean one of these?",
              suggestions: item.suggestions,
              originalQuestion: item.question
            });
          } else {
            historyMessages.push({ 
              role: "assistant", 
              type: "answer", 
              content: item.answer, 
              source: item.source,
              isApproved: item.is_approved,     
              adminComment: item.admin_comment 
            });
          }
        });
        setMessages(historyMessages);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleAsk = async (queryOverride = null, skipCache = false) => {
    const currentQuestion = queryOverride || question;
    if (!currentQuestion.trim()) return;

    const displayQuestion = skipCache
      ? `Search anyway: "${currentQuestion}"`
      : currentQuestion;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: displayQuestion, timestamp: new Date() },
    ]);

    if (!queryOverride) setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          question: currentQuestion,
          skip_cache: skipCache,
          // Optional: If your backend needs to know WHICH sop to search, pass it here:
          // sop_id: sop?.id 
        }),
      });

      const data = await res.json();

      if (data.type === "suggestions") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "suggestions",
            content: data.message || "Did you mean one of these?",
            suggestions: data.data || [],
            originalQuestion: data.original_question || currentQuestion,
            timestamp: new Date()
          },
        ]);
      } else {
        let finalContent = (data.data || data.answer || "").trim();

        if (!finalContent) {
          finalContent = "⚠️ Sorry, I received an empty response from the server.";
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "answer",
            content: finalContent,
            source: data.source || "rag",
            isApproved: data.is_approved || false,
            adminComment: data.admin_comment || "",
            timestamp: new Date()
          },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "answer",
          content: "❌ An error occurred while fetching the response.",
          timestamp: new Date()
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Optional: Add a small toast notification here
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // --- UI RENDER ---
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-orange-50 px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">
              ✨
            </div>
            <div>
              <h2 className="text-base font-semibold">Chat with SOP</h2>
              <p className="text-sm text-slate-500">
                {sop?.sopId ?? "SOP"} · {sop?.title ?? "."}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-orange-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-white px-6 py-6 space-y-6">
          {messages.length === 0 && !loading && (
             <div className="text-center text-slate-400 mt-10">
               <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
               <p>Ask a question to start exploring this SOP.</p>
             </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {msg.role === "assistant" ? (
                  msg.type === "suggestions" ? (
                    // Suggestion Bubble
                    <div className="flex flex-col space-y-3">
                      <p className="font-medium flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-orange-500" />
                        {msg.content}
                      </p>
                      <div className="flex flex-col gap-2">
                        {msg.suggestions.map((sug, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAsk(sug, false)}
                            className="text-left px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                          >
                            "{sug}"
                          </button>
                        ))}
                        <button
                          onClick={() => handleAsk(msg.originalQuestion, true)}
                          className="flex items-center gap-2 text-left px-3 py-2 text-sm border border-transparent rounded-lg hover:bg-slate-200 text-slate-500 transition-colors mt-2"
                        >
                          <ArrowRight className="w-4 h-4" />
                          None of these, search anyway.
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Answer Bubble
                    <div>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-2">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>

                      {msg.isApproved && (
                        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            Verified by Admin
                          </div>
                          {msg.adminComment && (
                            <p className="text-emerald-700 mt-1">
                              <span className="font-medium">Admin Note:</span> {msg.adminComment}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                        <div className="text-xs text-slate-500">
                          {msg.source === "cache" ? "⚡ Answered from Cache" : "🤖 AI Generated"}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(msg.content)}
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                        >
                          <Copy className="h-4 w-4" /> Copy
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  // User Bubble
                  <>
                    <p>{msg.content}</p>
                    {msg.timestamp && (
                      <div className="mt-1 text-right text-[10px] opacity-80">
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[70%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-500 italic animate-pulse">
                Analyzing SOP...
              </div>
            </div>
          )}
          
          <div ref={bottomRef} />
        </div>

        {/* Quick Suggestions (Bottom Bar) */}
        <div className="border-t px-6 py-3 bg-white">
          <div className="mb-2 text-sm text-slate-500">Suggestions:</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => handleAsk("What are the key steps in this SOP?")} className="rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors">
              What are the key steps in this SOP?
            </button>
            <button onClick={() => handleAsk("Who is responsible for this procedure?")} className="rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors">
              Who is responsible for this procedure?
            </button>
            <button onClick={() => handleAsk("What are the critical quality checkpoints?")} className="rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors">
              What are the critical quality checkpoints?
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t px-6 py-4 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500 transition-all">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              placeholder={`Ask about ${sop?.id ?? "this SOP"}...`}
              disabled={loading}
            />
            <Globe className="h-4 w-4 text-slate-400" />
            <button 
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}