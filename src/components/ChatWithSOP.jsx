import { useState, useEffect, useRef } from "react";
import { 
  X, Send, Globe, HelpCircle, ArrowRight, CheckCircle, 
  Sparkles, Image as ImageIcon, Video, Maximize2, Play, WifiOff 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MediaModal from "../components/MediaModal";
import { useServiceStatus } from "../context/ServiceStatusContext"; // 👈 Add this import

export default function ChatWithSOP({ sop, onClose }) {
  // --- STATE & REFS ---
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMedia, setActiveMedia] = useState(null); 
  const bottomRef = useRef(null);

  // 🔥 RAG SERVICE STATUS
  const { rag } = useServiceStatus();
  const isRagOffline = rag.status !== "online" && rag.status !== "connecting";

  const API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";

  // --- DERIVED SOP ID ---
  const rawId = sop?.sopId || sop?._id || "unknown";
  const safeDocumentId = rawId.toString().replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

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
      const res = await fetch(`${API_URL}/user/history/${id}/${safeDocumentId}`);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data && data.length > 0) {
        const historyMessages = [];
        data.forEach((item) => {
          const msgTime = item.timestamp ? new Date(item.timestamp) : new Date();

          historyMessages.push({ 
            role: "user", 
            content: item.question,
            timestamp: msgTime
          });
          
          if (item.suggestions && item.suggestions.length > 0) {
            historyMessages.push({
              role: "assistant",
              type: "suggestions",
              content: "I found similar questions in my memory. Did you mean one of these?",
              suggestions: item.suggestions,
              originalQuestion: item.question,
              timestamp: msgTime
            });
          } else {
            historyMessages.push({ 
              role: "assistant", 
              type: "answer", 
              content: item.answer, 
              source: item.source,
              isApproved: item.is_approved,    
              adminComment: item.admin_comment,
              media: item.media || [],
              timestamp: msgTime 
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
    if (isRagOffline) return; // Prevent asking if offline
    
    const currentQuestion = queryOverride || question;
    if (!currentQuestion.trim()) return;

    const displayQuestion = skipCache ? `Search anyway: "${currentQuestion}"` : currentQuestion;

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
          document_id: safeDocumentId,
          question: currentQuestion,
          skip_cache: skipCache,
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
        if (!finalContent) finalContent = "⚠️ Sorry, I received an empty response from the server.";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "answer",
            content: finalContent,
            source: data.source || "rag",
            isApproved: data.is_approved || false,
            adminComment: data.admin_comment || "",
            media: data.media || [], 
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

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">✨</div>
              <div>
                <h2 className="text-base font-semibold">Chat with SOP</h2>
                <p className="text-sm text-slate-500">{sop?.sopId ?? "SOP"} · {sop?.title ?? "."}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               {/* Small indicator dot in header for service status */}
              <div className="flex items-center gap-2 text-xs font-medium bg-white px-2 py-1 rounded-md border shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isRagOffline ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                <span className={isRagOffline ? 'text-slate-600' : 'text-slate-600'}>
                  {isRagOffline ? 'RAG Disconnected' : 'RAG Connected'}
                </span>
              </div>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-orange-100 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 🔥 Service Down Alert Banner */}
          {isRagOffline && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 shrink-0 flex items-center gap-3 text-red-700 text-sm">
              <WifiOff className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p>
                <strong>Connection Lost:</strong> The RAG AI Service is currently offline. You can view your chat history, but new questions cannot be answered right now.
              </p>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto bg-white px-6 py-6 space-y-6">
            {messages.length === 0 && !loading && (
               <div className="text-center text-slate-400 mt-10">
                 <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
                 <p>Ask a question to start exploring this SOP.</p>
               </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-800"}`}>
                  
                  {msg.role === "assistant" ? (
                    msg.type === "suggestions" ? (
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
                              disabled={isRagOffline}
                              className="text-left px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-slate-300 disabled:hover:text-slate-800"
                            >
                              "{sug}"
                            </button>
                          ))}
                          <button
                            onClick={() => handleAsk(msg.originalQuestion, true)}
                            disabled={isRagOffline}
                            className="flex items-center gap-2 text-left px-3 py-2 text-sm border border-transparent rounded-lg hover:bg-slate-200 text-slate-500 transition-colors mt-2 disabled:opacity-50"
                          >
                            <ArrowRight className="w-4 h-4" />
                            None of these, search anyway.
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc pl-5 space-y-2 mb-4">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-5 space-y-2 mb-4">{children}</ol>,
                            li: ({ children }) => <li>{children}</li>,
                            strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                            img: ({ src, alt }) => {
                              // Self-hosted media check
                              const isVideo = alt === 'VIDEO' || src.match(/\.(mp4|webm|ogg)$/i) || src.includes('.mp4');
                              const mediaObj = { url: src, caption: alt, type: isVideo ? 'video' : 'image' };
                              
                              if (isVideo) {
                                return (
                                  <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-lg shadow-sm relative group cursor-pointer" onClick={() => setActiveMedia(mediaObj)}>
                                    <div className="absolute inset-0 z-10 bg-transparent" title="Click to expand" />
                                    <video src={src} className="w-full max-h-[300px] object-contain bg-black" />
                                    <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                      <Maximize2 size={14} className="text-white" />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                      <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                                        <Play fill="currentColor" size={20} className="ml-0.5" />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="my-4 max-w-lg relative group cursor-pointer" onClick={() => setActiveMedia(mediaObj)}>
                                  <img src={src} alt={alt} className="rounded-xl shadow-sm border border-slate-200 w-full object-cover max-h-[400px]" />
                                  <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <Maximize2 size={14} className="text-white" />
                                  </div>
                                  {alt && alt !== 'image' && alt !== 'Image' && alt !== 'None' && (
                                    <div className="mt-1.5 text-xs text-slate-500 text-center italic">{alt}</div>
                                  )}
                                </div>
                              );
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>

                        {/* --- FALLBACK MEDIA GALLERY --- */}
                        {msg.media && (
                          (() => {
                            const unusedMedia = msg.media.filter(m => !msg.content.includes(m.url));
                            if (unusedMedia.length === 0) return null;

                            return (
                              <div className="mt-4 border-t border-slate-200 pt-3">
                                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Additional Resources</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {unusedMedia.map((m, idx) => {
                                    const isVideo = m.type === 'video' || m.url.match(/\.(mp4|webm|ogg)$/i);
                                    
                                    return (
                                      <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col">
                                        {isVideo ? (
                                          <div className="relative pt-[56.25%] bg-black group cursor-pointer" onClick={() => setActiveMedia(m)}>
                                            <div className="absolute inset-0 bg-transparent z-10" />
                                            <video src={m.url} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                              <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                                                <Play fill="currentColor" size={14} className="ml-0.5" />
                                              </div>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                              <Maximize2 size={14} className="text-white" />
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="relative group cursor-pointer" onClick={() => setActiveMedia(m)}>
                                            <img src={m.url} alt={m.caption || 'SOP Reference'} className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                              <Maximize2 size={14} className="text-white" />
                                            </div>
                                          </div>
                                        )}
                                        {m.caption && m.caption !== 'None' && (
                                          <div className="p-2 text-xs text-slate-600 bg-slate-50 flex-1 border-t border-slate-100 flex justify-between items-center">
                                            <span className="truncate mr-2">{m.caption}</span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {msg.isApproved && (
                          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle className="w-4 h-4 text-emerald-600" /> Verified by Expert
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
                            {msg.source === "cache" ? "⚡ Answered from Cache" : ""}
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
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

          {/* Quick Suggestions */}
          <div className="border-t px-6 py-3 bg-white shrink-0">
            <div className="mb-2 text-sm text-slate-500">Suggestions:</div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleAsk("give all points of Monthly Preventive Maintenance.")} 
                disabled={isRagOffline}
                className="rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-white"
              >
                give all points of Monthly Preventive Maintenance.
              </button>
              <button 
                onClick={() => handleAsk("How do I check the turret for free rotation?")} 
                disabled={isRagOffline}
                className="rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-white"
              >
                How do I check the turret for free rotation?
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t px-6 py-4 bg-white shrink-0">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all
              ${isRagOffline 
                ? 'bg-slate-100 border-slate-200 opacity-70' 
                : 'bg-slate-50 border-slate-200 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500'}`}
            >
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAsk()}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                placeholder={isRagOffline ? "Service disconnected..." : `Ask about ${sop?.id ?? "this SOP"}...`}
                disabled={loading || isRagOffline}
              />
              <Globe className="h-4 w-4 text-slate-400" />
              <button 
                onClick={() => handleAsk()}
                disabled={loading || !question.trim() || isRagOffline}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400 text-center">
              {isRagOffline ? "Chat is unavailable while service is offline." : "Press Enter to send, Shift+Enter for new line"}
            </p>
          </div>
        </div>
      </div>

      {/* Media Overlay Modal */}
      <MediaModal mediaItem={activeMedia} onClose={() => setActiveMedia(null)} />
    </>
  );
}