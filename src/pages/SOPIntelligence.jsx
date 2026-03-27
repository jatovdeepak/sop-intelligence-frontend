import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Trash2,
  WifiOff,
  Copy,
  Check,
  Play,
  ThumbsUp,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MediaModal from "../components/MediaModal";
import { useServiceStatus } from "../context/ServiceStatusContext";

export default function SOPIntelligence() {
  // --- STATE & REFS ---
  const [userId, setUserId] = useState("");
  const [embeddingId, setEmbeddingId] = useState("global");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
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

    const fetchSOPs = async () => {
      setFetchingSops(true);
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/api/sops`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setAvailableSops(data);
        }
      } catch (err) {
        console.error("Error fetching SOPs:", err);
      } finally {
        setFetchingSops(false);
      }
    };

    fetchSOPs();
  }, [API_BASE_URL]);

  // Fetch history when embedding ID changes
  useEffect(() => {
    if (embeddingId) fetchHistory(userId, embeddingId);
  }, [embeddingId, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-resize textarea
  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  };

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
        // ALWAYS set to empty array to show the landing page, even for global
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your personal chat history for this SOP?")) return;
    try {
      await fetch(`${API_RAG_URL}/user/clear-history/${userId}`, { method: "POST" });
      // Clear messages entirely to return to the landing page
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleClearCache = async () => {
    if (!embeddingId) return;

    // --- GLOBAL CACHE WIPE ---
    if (embeddingId === "global") {
      if (!window.confirm("⚠️ WARNING: Are you sure you want to clear ALL verified AI caches across EVERY document? This action cannot be undone.")) return;
      
      try {
        const res = await fetch(`${API_RAG_URL}/admin/clear-all-cache`, { method: "POST" });
        if (res.ok) {
          alert("All AI caches have been cleared globally.");
        } else {
          alert("Failed to clear caches. You may not have the required permissions.");
        }
      } catch (err) {
        console.error("Failed to clear all caches:", err);
        alert("An error occurred communicating with the server.");
      }
      return;
    }

    // --- SPECIFIC SOP CACHE WIPE ---
    if (!window.confirm(`Are you sure you want to clear the AI cache for this document? This removes all verified answers.`)) return;
    
    try {
      const res = await fetch(`${API_RAG_URL}/admin/clear-cache/${embeddingId}`, { method: "POST" });
      if (res.ok) {
        alert(`Cache cleared successfully.`);
      } else {
        alert("Failed to clear cache. You may not have the required permissions.");
      }
    } catch (err) {
      console.error("Failed to clear cache:", err);
      alert("An error occurred communicating with the server.");
    }
  };

  const handleAsk = async (queryOverride = null, skipCache = false, targetSopOverride = null) => {
    if (isRagOffline) return;

    const currentQuestion = queryOverride || question;
    if (!currentQuestion.trim()) return;

    const currentTarget = targetSopOverride || embeddingId;
    if (!currentTarget) {
      alert("Please select an SOP to chat with.");
      return;
    }

    const displayQuestion = skipCache ? `Search anyway: "${currentQuestion}"` : currentQuestion;

    if (!targetSopOverride) {
      setMessages((prev) => [...prev, { role: "user", content: displayQuestion }]);
    }

    if (!queryOverride) {
      setQuestion("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }
    
    setLoading(true);
    setApprovingIndex(null);

    try {
      // --- GLOBAL ROUTER MODE ---
      if (currentTarget === "global") {
        const sopCatalogForLLM = availableSops.map(s => ({
          id: s.embeddingId,
          sopId: s.sopId,
          title: s.title,
          type: s.type
        }));

        const res = await fetch(`${API_RAG_URL}/user/global-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            question: currentQuestion,
            available_sops: sopCatalogForLLM
          }),
        });

        const data = await res.json();

        if (data.intent === "auto_select" && data.auto_select_id) {
          const matchedSop = availableSops.find(s => s.sopId === data.auto_select_id || s.embeddingId === data.auto_select_id);
          if (matchedSop) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", type: "answer", content: `*Detected intent for **${matchedSop.sopId}**. Searching document...*` }
            ]);
            return handleAsk(currentQuestion, skipCache, matchedSop.embeddingId);
          }
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", type: "answer", content: data.message, originalQuestion: currentQuestion }
        ]);

        if (data.suggested_ids && data.suggested_ids.length > 0) {
          setMessages((prev) => [
            ...prev,
            { 
              role: "assistant", 
              type: "suggestions", 
              content: "These SOPs might contain what you need:", 
              suggestions: data.suggested_ids.map(id => availableSops.find(s => s.embeddingId === id)?.sopId || "Unknown Document"), 
              originalQuestion: currentQuestion 
            }
          ]);
        }
        setLoading(false);
        return; 
      }

      // --- SPECIFIC SOP QUERY ---
      const res = await fetch(`${API_RAG_URL}/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          document_id: currentTarget,
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
        let finalContent = (data.data || data.answer || "").trim() || "⚠️ Sorry, received an empty response.";
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
        { role: "assistant", type: "answer", content: "❌ An error occurred while fetching the response." },
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
          prev.map((m, i) => i === index ? { ...m, isApproved: true, adminComment: adminComment } : m)
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

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-6 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-orange-200">
        <Sparkles className="w-8 h-8 text-orange-500" />
      </div>
      <h2 className="text-3xl font-bold text-slate-800 mb-3">How can I help you today?</h2>
      <p className="text-slate-500 mb-8">
        {embeddingId === "global" 
          ? "Ask any question and I will automatically route it to the right documentation to get you instant, verified answers."
          : "Select an SOP from the top menu and ask any question to get instant, verified answers based on our documentation."}
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {['What is the emergency shutdown procedure?', 'List all daily maintenance tasks', 'Show me the safety protocols', 'Who needs to approve a bypass?'].map((prompt, i) => (
          <button 
            key={i}
            onClick={() => setQuestion(prompt)}
            className="p-4 text-left border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm transition-all text-sm text-slate-600 bg-white"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-full flex-col bg-slate-50 font-sans">
        
        {/* TOP HEADER */}
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="bg-orange-500 p-2 rounded-lg text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 leading-tight">SOP Intelligence</span>
              
              <div className="flex items-center text-xs mt-0.5">
                <span className="text-slate-500 mr-2">Context:</span>
                <div className="relative inline-flex items-center">
                  <select
                    value={embeddingId}
                    onChange={(e) => setEmbeddingId(e.target.value)}
                    disabled={fetchingSops}
                    className="appearance-none bg-slate-100 hover:bg-slate-200 border-none rounded-md py-1 pl-2 pr-7 outline-none text-slate-700 font-medium cursor-pointer transition-colors max-w-[250px] truncate"
                  >
                    <option value="global">🌍 Global AI (Search All)</option>
                    {availableSops.map((sop) => (
                      <option key={sop._id || sop.embeddingId} value={sop.embeddingId}>
                        {sop.sopId} {sop.title ? `- ${sop.title}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={handleClearCache}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  embeddingId === "global" 
                    ? "text-amber-700 bg-amber-100 hover:bg-amber-200" 
                    : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                }`}
                title={embeddingId === "global" ? "Clear ALL AI Caches globally" : "Clear AI Cache for this SOP"}
              >
                <RefreshCw className="w-3.5 h-3.5" /> 
                <span className="hidden sm:inline">
                  {embeddingId === "global" ? "Clear All Caches" : "Clear Cache"}
                </span>
              </button>
            )}
            <button 
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear Chat</span>
            </button>
          </div>
        </header>

        {isRagOffline && (
          <div className="bg-red-500 text-white px-6 py-2 shrink-0 flex items-center justify-center gap-2 text-xs font-medium shadow-sm z-20">
            <WifiOff className="h-4 w-4" /> System Offline: New questions cannot be answered right now.
          </div>
        )}

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 relative">
          {messages.length === 0 ? renderEmptyState() : (
            <div className="max-w-4xl mx-auto space-y-6 pb-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>
                  
                  {/* Avatar for Assistant */}
                  {msg.role === "assistant" && (
                     <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                       <Sparkles className="w-4 h-4 text-orange-500" />
                     </div>
                  )}

                  <div className={`relative max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === "user" ? "bg-orange-500 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                  }`}>
                    
                    {/* User Copy Button */}
                    {msg.role === "user" && (
                      <button
                        onClick={() => handleCopy(msg.content, i)}
                        className="absolute top-2 -left-12 p-2 text-slate-400 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm rounded-lg border border-slate-200"
                        title="Copy question"
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}

                    {msg.role === "assistant" ? (
                      msg.type === "suggestions" ? (
                        <div className="flex flex-col space-y-3">
                          <p className="font-medium flex items-center gap-2 text-slate-700">
                            <HelpCircle className="w-5 h-5 text-orange-500" /> {msg.content}
                          </p>
                          <div className="flex flex-col gap-2 mt-2">
                            {msg.suggestions.map((sug, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAsk(sug, false)}
                                disabled={isRagOffline}
                                className="text-left px-4 py-3 text-sm border border-slate-200 bg-slate-50 rounded-xl hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all shadow-sm disabled:opacity-50 font-medium"
                              >
                                "{sug}"
                              </button>
                            ))}
                            {embeddingId !== "global" && (
                              <button
                                onClick={() => handleAsk(msg.originalQuestion, true)}
                                disabled={isRagOffline}
                                className="flex items-center gap-2 text-left px-4 py-3 text-sm border border-transparent rounded-xl hover:bg-slate-100 text-slate-500 transition-colors mt-1 disabled:opacity-50"
                              >
                                <ArrowRight className="w-4 h-4" /> None of these, search anyway.
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-a:text-orange-600">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              table: ({ children }) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-200"><table className="min-w-full divide-y divide-slate-200 m-0">{children}</table></div>,
                              th: ({ children }) => <th className="bg-slate-50 px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">{children}</th>,
                              td: ({ children }) => <td className="px-4 py-3 text-sm text-slate-600 border-t border-slate-200 whitespace-pre-wrap">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>

                          {/* Fallback Media Gallery */}
                          {msg.media && (() => {
                            const unusedMedia = msg.media.filter((m) => !msg.content.includes(m.url));
                            if (unusedMedia.length === 0) return null;
                            return (
                              <div className="mt-5 border-t border-slate-100 pt-4">
                                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">References & Media</p>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                  {unusedMedia.map((m, idx) => (
                                    <div key={idx} className="shrink-0 w-32 h-24 rounded-lg overflow-hidden border border-slate-200 relative group cursor-pointer shadow-sm" onClick={() => setActiveMedia(m)}>
                                      {m.type === "video" || m.url.match(/\.(mp4|webm)$/i) ? (
                                        <div className="w-full h-full bg-slate-900 flex items-center justify-center"><Play className="text-white/80 w-8 h-8 group-hover:scale-110 transition-transform" /></div>
                                      ) : (
                                        <img src={m.url} alt="Reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Admin Verification Banner */}
                          {msg.isApproved && (
                            <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-sm flex gap-3 items-start shadow-sm">
                              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                              <div className="flex flex-col">
                                <span className="font-semibold text-emerald-800">Verified by Expert</span>
                                {msg.adminComment && <span className="text-emerald-700 mt-1">{msg.adminComment}</span>}
                              </div>
                            </div>
                          )}

                          {/* Action Bar */}
                          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
                              {msg.source?.includes("cache") && <><AlertCircle className="w-3.5 h-3.5" /> Fast Cache Answer</>}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!msg.isApproved && approvingIndex !== i && isAdmin && (
                                <button onClick={() => { setApprovingIndex(i); setAdminComment(""); }} disabled={isRagOffline} className="px-2.5 py-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-1.5" title="Approve this answer">
                                  <ThumbsUp className="w-4 h-4" /><span className="text-xs font-medium">Approve</span>
                                </button>
                              )}
                              <button onClick={() => handleCopy(msg.content, i)} className="px-2.5 py-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors flex items-center gap-1.5">
                                {copiedIndex === i ? (
                                  <><Check className="w-4 h-4 text-emerald-500" /><span className="text-xs text-emerald-500 font-medium">Copied</span></>
                                ) : (
                                  <><Copy className="w-4 h-4" /><span className="text-xs font-medium">Copy</span></>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Inline Approval Form */}
                          {approvingIndex === i && !msg.isApproved && isAdmin && (
                            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-3 shadow-inner">
                              <label className="text-sm font-semibold text-slate-700">Add Approval Note (Optional)</label>
                              <input
                                type="text"
                                value={adminComment}
                                onChange={(e) => setAdminComment(e.target.value)}
                                className="text-sm px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
                                placeholder="e.g., Verified against procedure V2.1"
                                disabled={isApproving}
                              />
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setApprovingIndex(null)} className="text-xs font-medium text-slate-600 hover:bg-slate-200 px-3 py-2 rounded-lg" disabled={isApproving}>Cancel</button>
                                <button onClick={() => submitApproval(i, msg)} disabled={isApproving} className="text-xs font-medium bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                                  {isApproving ? "Approving..." : "Confirm Verification"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-sm">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5 h-[52px]">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="bg-white px-4 py-4 md:px-8 md:py-5 border-t border-slate-200 shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className={`relative flex items-end rounded-2xl border bg-white transition-all shadow-sm ${
                isRagOffline ? "bg-slate-50 border-slate-200 opacity-70" : "border-slate-300 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-50"
              }`}
            >
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => {
                  setQuestion(e.target.value);
                  handleTextareaInput();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                placeholder={isRagOffline ? "Service disconnected..." : `Ask anything about ${embeddingId === 'global' ? 'all documents' : 'the selected SOP'}...`}
                disabled={loading || isRagOffline}
                rows={1}
                className="w-full bg-transparent py-4 pl-5 pr-14 text-[15px] outline-none resize-none overflow-y-auto disabled:cursor-not-allowed max-h-[150px] scrollbar-thin scrollbar-thumb-slate-200"
              />
              <button
                onClick={() => handleAsk()}
                disabled={loading || !question.trim() || isRagOffline}
                className="absolute right-2 bottom-2 rounded-xl bg-orange-500 p-2.5 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors shadow-sm"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2.5 flex justify-center text-[11px] text-slate-400 font-medium">
              {isRagOffline ? "Chat is unavailable while offline." : "Press Enter to send, Shift + Enter for new line."}
            </div>
          </div>
        </div>
      </div>

      <MediaModal mediaItem={activeMedia} onClose={() => setActiveMedia(null)} />
    </>
  );
}