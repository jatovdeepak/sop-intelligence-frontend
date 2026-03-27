import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Search,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Trash2,
  WifiOff,
  Copy,
  Check,
  Maximize2,
  Play,
  ThumbsUp,
  FileText,
  ChevronDown,
  RefreshCw 
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MediaModal from "../components/MediaModal";
import { useServiceStatus } from "../context/ServiceStatusContext";

export default function SOPIntelligence() {
  // --- STATE & REFS ---
  const [userId, setUserId] = useState("");
  const [embeddingId, setEmbeddingId] = useState("global"); // Default to global mode
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState(true); // Changed to true to directly open chat window
  const [activeMedia, setActiveMedia] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // SOP Fetching State
  const [availableSops, setAvailableSops] = useState([]);
  const [fetchingSops, setFetchingSops] = useState(true);

  // Admin & Approval State
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Service Status
  const { rag } = useServiceStatus();
  const isRagOffline = rag?.status !== "online" && rag?.status !== "connecting";

  // API URLs
  const API_RAG_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // --- INITIALIZATION ---
  useEffect(() => {
    let storedId = sessionStorage.getItem("sop_user_id");
    if (!storedId) {
      storedId = "user_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("sop_user_id", storedId);
    }
    setUserId(storedId);

    const userRole = sessionStorage.getItem("role");
    setIsAdmin(userRole === "Admin");

    // Fetch available SOPs for the dropdown/routing
    const fetchSOPs = async () => {
      setFetchingSops(true);
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/sops`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableSops(data);
        } else {
          console.error("Failed to fetch SOPs");
        }
      } catch (err) {
        console.error("Error fetching SOPs:", err);
      } finally {
        setFetchingSops(false);
      }
    };

    fetchSOPs();
  }, [API_BASE_URL]);

  // Fetch history when entering chat mode or changing embedding ID
  useEffect(() => {
    // Now allows fetching for 'global' as well
    if (chatMode && embeddingId) {
      fetchHistory(userId, embeddingId);
    }
  }, [chatMode, embeddingId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [question]);

  // --- FUNCTIONS ---
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const fetchHistory = async (uid, embId) => {
    try {
      const res = await fetch(`${API_RAG_URL}/user/history/${uid}/${embId}`);
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
              originalQuestion: item.question,
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
              originalQuestion: item.question,
            });
          }
        });
        setMessages(historyMessages);
      } else {
        // Handle empty history states
        if (embId === "global") {
          setMessages([{
            role: "assistant", 
            type: "answer", 
            content: "Hi! I am your Global SOP Assistant. You can say 'hi', ask me to list available SOPs, or ask a specific question and I'll route it to the right document."
          }]);
        } else {
          setMessages([]); // Clear if no history for this specific SOP
        }
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your personal chat history for all SOPs?")) return;
    try {
      await fetch(`${API_RAG_URL}/user/clear-history/${userId}`, { method: "POST" });
      setMessages([]);
      // Reload the global welcome message if we are on global
      if (embeddingId === "global") {
        setMessages([{
          role: "assistant", 
          type: "answer", 
          content: "Hi! I am your Global SOP Assistant. You can say 'hi', ask me to list available SOPs, or ask a specific question and I'll route it to the right document."
        }]);
      }
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleClearCache = async () => {
    if (!embeddingId || embeddingId === "global") {
      alert("Please select a specific SOP to clear its cache.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to clear the AI cache for this document? This will remove all verified answers and speed optimizations globally.`)) return;
    
    try {
      const res = await fetch(`${API_RAG_URL}/admin/clear-cache/${embeddingId}`, { 
        method: "POST" 
      });
      
      if (res.ok) {
        alert(`Cache cleared successfully.`);
      } else {
        alert("Failed to clear cache. You may not have the required permissions.");
      }
    } catch (err) {
      console.error("Failed to clear cache:", err);
      alert("An error occurred while communicating with the server to clear the cache.");
    }
  };

  const handleAsk = async (queryOverride = null, skipCache = false, targetSopOverride = null) => {
    if (isRagOffline) return;

    const currentQuestion = queryOverride || question;
    if (!currentQuestion.trim()) return;

    // Use override if auto-switching from global, otherwise use current dropdown state
    const currentTarget = targetSopOverride || embeddingId;

    if (!currentTarget) {
      alert("Please select an SOP to chat with.");
      return;
    }

    if (!chatMode) setChatMode(true);

    const displayQuestion = skipCache
      ? `Search anyway: "${currentQuestion}"`
      : currentQuestion;

    if (!targetSopOverride) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: displayQuestion },
      ]);
    }

    if (!queryOverride) {
      setQuestion("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    
    setLoading(true);
    setApprovingIndex(null);

    try {
      // ==========================================
      // GLOBAL ROUTER MODE
      // ==========================================
      if (currentTarget === "global") {
        // Send a lightweight catalog mapping using embeddingId as the strict 'id'
        const sopCatalogForLLM = availableSops.map(s => ({
          id: s.embeddingId, // The RAG API needs this ID to retrieve the document
          sopId: s.sopId,
          title: s.title,
          type: s.type
        }));

        const res = await fetch(`${API_RAG_URL}/user/global-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId, // Added userId to store global history
            question: currentQuestion,
            available_sops: sopCatalogForLLM
          }),
        });

        const data = await res.json();

        // 1. If LLM found an exact SOP match based on the query, auto-switch to it
        if (data.intent === "auto_select" && data.auto_select_id) {
          
          const matchedSop = availableSops.find(
            s => s.sopId === data.auto_select_id || s.embeddingId === data.auto_select_id
          );

          if (matchedSop) {
            const actualEmbeddingId = matchedSop.embeddingId;
            const sopName = matchedSop.sopId || "the requested document";

            // ❌ REMOVED: setEmbeddingId(actualEmbeddingId); // <-- We no longer switch the UI state

            setMessages((prev) => [
              ...prev,
              { role: "assistant", type: "answer", content: `*Detected intent for **${sopName}**. Searching that document for your answer...*` }
            ]);
            
            // Recursively call handleAsk. targetSopOverride ensures it queries the right DB,
            // but the UI stays on "global"
            return handleAsk(currentQuestion, skipCache, actualEmbeddingId);
          }
        }

        // 2. If it's just a greeting, a request to list SOPs, or unknown
        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "answer", content: data.message, originalQuestion: currentQuestion }
        ]);

        // 3. Append loose suggestions if any exist, translating them to UI readable format
        if (data.suggested_ids && data.suggested_ids.length > 0) {
          setMessages((prev) => [
            ...prev,
            { 
              role: "assistant", 
              type: "suggestions", 
              content: "I'm not 100% sure, but these SOPs might contain what you need:", 
              suggestions: data.suggested_ids.map(id => {
                const match = availableSops.find(s => s.embeddingId === id);
                return match ? match.sopId : "Unknown Document";
              }), 
              originalQuestion: currentQuestion 
            }
          ]);
        }
        setLoading(false);
        return; 
      }

      // ==========================================
      // STANDARD SPECIFIC SOP RAG QUERY
      // ==========================================
      const res = await fetch(`${API_RAG_URL}/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          document_id: currentTarget, // This explicitly passes the embeddingId to the API
          history_id: embeddingId,
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
            media: data.media || [],
            originalQuestion: currentQuestion,
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
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitApproval = async (index, msg) => {
    if (isRagOffline) return;
    setIsApproving(true);
    try {
      const res = await fetch(`${API_RAG_URL}/admin/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: embeddingId,
          question: msg.originalQuestion,
          answer: msg.content,
          admin_comment: adminComment,
        }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === index ? { ...m, isApproved: true, adminComment: adminComment } : m
          )
        );
        setApprovingIndex(null);
        setAdminComment("");
      } else {
        alert("Failed to approve answer.");
      }
    } catch (error) {
      console.error("Approval error:", error);
    } finally {
      setIsApproving(false);
    }
  };

  // Helper to find selected SOP title for the header using the embeddingId
  const getSelectedSopTitle = () => {
    if (embeddingId === "global") return "🌍 Global AI Assistant";
    const selected = availableSops.find(s => s.embeddingId === embeddingId);
    return selected ? `${selected.sopId} ${selected.title ? `- ${selected.title}` : ""}` : "Document";
  };

  /* ───────────────── LANDING PAGE ───────────────── */
  if (!chatMode) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <div className="w-full max-w-3xl px-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">
              SOP Intelligence
            </h1>
            <p className="mt-2 text-slate-500">
              Select an SOP, ask questions, and generate insights instantly
            </p>
          </div>

          <div className="space-y-4">
            {/* Multi SOP Dropdown Selector */}
            <div className="relative max-w-md mx-auto mb-6">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={embeddingId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setEmbeddingId(selectedId);
                  if (selectedId && selectedId !== "global") {
                    setChatMode(true);
                  }
                }}
                disabled={fetchingSops}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:bg-slate-50 disabled:text-slate-400 cursor-pointer text-slate-700"
              >
                <option value="global">🌍 Global AI Assistant (Ask anything)</option>
                {availableSops.map((sop) => (
                  // Use embeddingId strictly as the option value, but display the human-readable SOP ID
                  <option key={sop._id || sop.embeddingId} value={sop.embeddingId}>
                    {sop.sopId} {sop.title ? `- ${sop.title}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                disabled={!embeddingId}
                placeholder={embeddingId === "global" ? "Ask me anything (e.g. 'list all maintenance sops')" : "Ask anything about the selected SOP…"}
                className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-14 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleAsk()}
                disabled={!embeddingId || !question.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-orange-500 p-2 text-white shadow hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors"
                title={!embeddingId ? "Select an SOP first" : "Search"}
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>
            
            {isRagOffline && (
              <p className="text-center text-xs text-red-500 mt-4 flex items-center justify-center gap-1">
                <WifiOff className="w-3 h-3" /> AI Service is currently offline.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────── CHAT PAGE ───────────────── */
  return (
    <>
      <div className="flex h-full flex-col bg-slate-50">
        <div className="border-b bg-white px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              SOP Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Chatting with: <span className="font-medium text-orange-600 truncate inline-block align-bottom max-w-[200px]">{getSelectedSopTitle()}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* If they click "Reset Chat", it takes them to the Manual Selector Landing Page */}
            <button 
              onClick={() => {
                setChatMode(false);
                setMessages([]);
                setEmbeddingId("global");
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Manual Select
            </button>

            {isAdmin && embeddingId !== "global" && (
              <button 
                onClick={handleClearCache}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                title="Clear AI Cache for this specific SOP"
              >
                <RefreshCw className="w-4 h-4" />
                Clear Cache
              </button>
            )}

            <button 
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </button>
          </div>
        </div>

        {isRagOffline && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 shrink-0 flex items-center gap-2 text-red-700 text-xs">
            <WifiOff className="h-4 w-4" />
            <p><strong>Offline:</strong> New questions cannot be answered right now.</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              } group`}
            >
              <div
                className={`relative max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-orange-500 text-white"
                    : "bg-white border border-slate-200 text-slate-800"
                }`}
              >
                {/* User Copy Button */}
                {msg.role === "user" && (
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="absolute top-3 -left-10 p-1.5 text-slate-400 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-md border"
                    title="Copy question"
                  >
                    {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}

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
                            className="text-left px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors disabled:opacity-50"
                          >
                            "{sug}"
                          </button>
                        ))}
                        {embeddingId !== "global" && (
                          <button
                            onClick={() => handleAsk(msg.originalQuestion, true)}
                            disabled={isRagOffline}
                            className="flex items-center gap-2 text-left px-3 py-2 text-sm border border-transparent rounded-lg hover:bg-slate-100 text-slate-500 transition-colors mt-2 disabled:opacity-50"
                          >
                            <ArrowRight className="w-4 h-4" />
                            None of these, search anyway.
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="ml-5 list-disc space-y-1 mb-3">{children}</ul>,
                          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1 mb-3">{children}</ol>,
                          li: ({ children }) => <li>{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                          table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="min-w-full divide-y divide-slate-300 border">{children}</table></div>,
                          th: ({ children }) => <th className="bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-900 border">{children}</th>,
                          td: ({ children }) => <td className="whitespace-nowrap px-3 py-2 text-sm text-slate-500 border">{children}</td>,
                          img: ({ src, alt }) => {
                            const isVideo = alt === "VIDEO" || src.match(/\.(mp4|webm|ogg)$/i);
                            const mediaObj = { url: src, caption: alt, type: isVideo ? "video" : "image" };
                            
                            return (
                              <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-sm shadow-sm relative group cursor-pointer" onClick={() => setActiveMedia(mediaObj)}>
                                {isVideo ? (
                                  <>
                                    <video src={src} className="w-full max-h-[200px] object-contain bg-black" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                      <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 shadow-lg"><Play fill="currentColor" size={20} className="ml-0.5" /></div>
                                    </div>
                                  </>
                                ) : (
                                  <img src={src} alt={alt} className="w-full max-h-[240px] object-cover" />
                                )}
                                <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20"><Maximize2 size={14} className="text-white" /></div>
                                {alt && alt !== "image" && alt !== "None" && <div className="p-1.5 text-xs text-slate-500 text-center italic border-t bg-white">{alt}</div>}
                              </div>
                            );
                          },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>

                      {/* Fallback Media Gallery */}
                      {msg.media && (() => {
                        const unusedMedia = msg.media.filter((m) => !msg.content.includes(m.url));
                        if (unusedMedia.length === 0) return null;
                        return (
                          <div className="mt-4 border-t border-slate-100 pt-3">
                            <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Additional References</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                              {unusedMedia.map((m, idx) => (
                                <div key={idx} className="shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-200 relative group cursor-pointer" onClick={() => setActiveMedia(m)}>
                                  {m.type === "video" || m.url.match(/\.(mp4|webm)$/i) ? (
                                    <div className="w-full h-full bg-black flex items-center justify-center"><Play className="text-white/70" size={24} /></div>
                                  ) : (
                                    <img src={m.url} alt="Reference" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Admin Verification Banner */}
                      {msg.isApproved && (
                        <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5 font-semibold">
                            <CheckCircle className="w-4 h-4 text-emerald-600" /> Verified by Expert
                          </div>
                          {msg.adminComment && (
                            <p className="text-emerald-700 mt-1"><span className="font-medium">Admin Note:</span> {msg.adminComment}</p>
                          )}
                        </div>
                      )}

                      {/* Inline Approval Form (Admins Only) */}
                      {approvingIndex === i && !msg.isApproved && isAdmin && (
                        <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex flex-col gap-2">
                          <label className="text-xs font-semibold text-emerald-800">Add Admin Note (Optional)</label>
                          <input
                            type="text"
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            className="text-sm px-2 py-1.5 border border-emerald-200 rounded outline-none focus:border-emerald-400 bg-white"
                            placeholder="e.g., Verified against procedure..."
                            disabled={isApproving}
                          />
                          <div className="flex justify-end gap-2 mt-1">
                            <button onClick={() => setApprovingIndex(null)} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1" disabled={isApproving}>Cancel</button>
                            <button onClick={() => submitApproval(i, msg)} disabled={isApproving} className="text-xs font-medium bg-emerald-500 text-white px-3 py-1.5 rounded hover:bg-emerald-600 transition-colors">
                              {isApproving ? "Approving..." : "Confirm Approval"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Action Bar (Copy & Approve) */}
                      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                        <div className="text-[10px] text-slate-400">
                          {msg.source?.includes("cache") ? "⚡ Answered from Cache" : ""}
                        </div>
                        <div className="flex items-center gap-2">
                          {!msg.isApproved && approvingIndex !== i && isAdmin && (
                            <button onClick={() => { setApprovingIndex(i); setAdminComment(""); }} disabled={isRagOffline} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1" title="Approve this answer">
                              <ThumbsUp className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">Approve</span>
                            </button>
                          )}
                          <button onClick={() => handleCopy(msg.content, i)} className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors flex items-center gap-1">
                            {copiedIndex === i ? (
                              <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] text-emerald-500 font-medium">Copied</span></>
                            ) : (
                              <><Copy className="w-3.5 h-3.5" /><span className="text-[10px] font-medium">Copy</span></>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500 w-fit animate-pulse">
              Thinking…
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white px-6 py-4">
          <div className={`relative flex items-end rounded-xl border transition-all ${isRagOffline ? "bg-slate-50 border-slate-200 opacity-70" : "bg-white border-slate-300 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100"}`}>
            <textarea
              ref={textareaRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder={isRagOffline ? "Service disconnected..." : "Ask a follow-up question…"}
              disabled={loading || isRagOffline}
              rows={1}
              className="w-full bg-transparent py-3 pl-4 pr-12 text-sm outline-none resize-none overflow-y-auto disabled:cursor-not-allowed"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim() || isRagOffline}
              className="absolute right-2 bottom-2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            {isRagOffline ? "Chat is unavailable while offline." : "Press Enter to send, Shift+Enter for new line"}
          </p>
        </div>
      </div>

      {/* Media Overlay Modal */}
      <MediaModal
        mediaItem={activeMedia}
        onClose={() => setActiveMedia(null)}
      />
    </>
  );
}