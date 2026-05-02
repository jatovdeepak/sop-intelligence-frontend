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
  AlertCircle,
  Mic,
  Square,
  Activity,
  Send,
  Maximize2,
  Terminal,
  X,
  Database,
  ListFilter,
  Code,
  LayoutList,
  Volume2,
  VolumeX,
  MoreVertical,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MediaModal from "../components/MediaModal";
import { useServiceStatus } from "../context/ServiceStatusContext";
import { useSarvamService } from "../services/sarvam_service";

export default function SOPIntelligence() {
  // --- STATE & REFS ---
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMedia, setActiveMedia] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Top Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ type: null, message: "" });

  // Admin & Approval State
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Approved Q/A Management State
  const [approvedQaLoading, setApprovedQaLoading] = useState(false);
  const [showApprovedModal, setShowApprovedModal] = useState(false);
  const [approvedQaRows, setApprovedQaRows] = useState([]);
  const [approvedQaSearch, setApprovedQaSearch] = useState("");

  // TTS Active Tracking State
  const [activeTTSIndex, setActiveTTSIndex] = useState(null);

  // DEBUG PANEL STATE
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);
  const [activeContextData, setActiveContextData] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Service Status
  const { rag } = useServiceStatus();
  const isRagOffline = rag?.status !== "online" && rag?.status !== "connecting";

  // API URLs
  const API_RAG_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  // SARVAM VOICE SERVICE
  const {
    isRecording,
    transcript,
    translation,
    toggleRecording,
    stopRecording,
    resetData: resetVoiceData,
    availableMics,
    selectedMicId,
    setSelectedMicId,
    playTextToSpeech,
    stopTTS,
    isPlayingTTS
  } = useSarvamService();

  // Handle outside click for top options menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset the UI icon if the audio finishes playing naturally
  useEffect(() => {
    if (!isPlayingTTS) setActiveTTSIndex(null);
  }, [isPlayingTTS]);

  // Strip Markdown syntax before sending to Sarvam so it doesn't read asterisks out loud
  const handleTTS = (rawText, index) => {
    if (isPlayingTTS && activeTTSIndex === index) {
      stopTTS();
      setActiveTTSIndex(null);
    } else {
      const cleanText = rawText.replace(/[#*`_~>]/g, "").trim();
      setActiveTTSIndex(index);
      playTextToSpeech(cleanText, "en-IN");
    }
  };

  // Sync Native Transcript into the Main Question Input
  useEffect(() => {
    if (isRecording && transcript) {
      setQuestion(transcript); 
    }
  }, [transcript, isRecording]);

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
  }, [API_BASE_URL]);

  useEffect(() => {
    if (userId) fetchHistory(userId, "global");
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
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
      const res = await fetch(`${API_RAG_URL}/global-user/history/${uid}/${embId}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data && data.length > 0) {
        const historyMessages = [];
        data.forEach((item) => {
          historyMessages.push({ role: "user", content: item.question });
          
          if (item.answer) {
            historyMessages.push({
              role: "assistant",
              type: "answer",
              content: item.answer,
              source: item.source,
              isApproved: item.is_approved,
              adminComment: item.admin_comment,
              media: item.media || [],
              pages: item.page_numbers || [],
              originalQuestion: item.question,
              suggestions: item.suggestions || [],
              searchContext: null 
            });
          } else if (item.suggestions && item.suggestions.length > 0) {
            historyMessages.push({
              role: "assistant",
              type: "suggestions",
              content: "I found similar questions in my memory. Did you mean one of these?",
              suggestions: item.suggestions,
              originalQuestion: item.question,
            });
          }
        });
        setMessages(historyMessages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your personal chat history?")) return;
    try {
      await fetch(`${API_RAG_URL}/global-user/clear-history/${userId}`, { method: "POST" });
      setMessages([]);
      setActiveContextData(null);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm("⚠️ WARNING: Are you sure you want to clear ALL verified AI caches across EVERY document? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${API_RAG_URL}/admin/clear-cache/global`, { method: "POST" });
      if (res.ok) alert("All AI caches have been cleared globally.");
      else alert("Failed to clear caches. You may not have the required permissions.");
    } catch (err) {
      console.error("Failed to clear all caches:", err);
      alert("An error occurred communicating with the server.");
    }
  };

  const handleGlobalSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: "info", message: "Fetching latest SOPs from database..." });
    try {
      const token = sessionStorage.getItem("token");
      const dbResponse = await fetch(`${API_BASE_URL}/api/sops`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!dbResponse.ok) throw new Error("Failed to fetch SOPs from the database.");
      const allSops = await dbResponse.json();
      const activeSops = allSops.filter((sop) => sop.status === "Active");

      if (activeSops.length === 0) {
        setSyncStatus({ type: "warning", message: "No active SOPs found to sync." });
        setIsSyncing(false);
        setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);
        return;
      }

      setSyncStatus({ type: "info", message: `Found ${activeSops.length} active SOPs. Building global vector database...` });

      const ragResponse = await fetch(`${API_RAG_URL}/global-api/bulk-embed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeSops),
      });

      if (!ragResponse.ok) {
        const errorData = await ragResponse.json();
        throw new Error(errorData.detail || "Failed to embed SOPs.");
      }

      const resultData = await ragResponse.json();
      setSyncStatus({ type: "success", message: `Success! ${resultData.message}` });
      
      fetch(`${API_RAG_URL}/global-api/sync-approved-qas`, { method: "POST" }).catch(e => console.error(e));

      setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);
    } catch (error) {
      console.error("Sync Error:", error);
      setSyncStatus({ type: "error", message: error.message });
      setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchApprovedQAs = async () => {
    setApprovedQaLoading(true);
    try {
      const res = await fetch(`${API_RAG_URL}/global-api/approved-qas`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed");
      setApprovedQaRows(data.data || []);
      setShowApprovedModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setApprovedQaLoading(false);
    }
  };

  const handleDeleteSingleApprovedQA = async (qaId) => {
    const ok = window.confirm("Delete this approved Q/A?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_RAG_URL}/global-api/approved-qas/${qaId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Delete failed");
      setApprovedQaRows((prev) => prev.filter((item) => item.id !== qaId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteApprovedQAs = async () => {
    const ok = window.confirm("Delete ALL approved Q/A vectors?\n\nThis cannot be undone.");
    if (!ok) return;
    setApprovedQaLoading(true);
    try {
      const res = await fetch(`${API_RAG_URL}/global-api/approved-qas`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Delete failed");
      setApprovedQaRows([]);
      setShowApprovedModal(false);
      setSyncStatus({ type: "success", message: data.message || "Deleted." });
    } catch (err) {
      setSyncStatus({ type: "error", message: err.message });
    } finally {
      setApprovedQaLoading(false);
      setTimeout(() => { setSyncStatus({ type: null, message: "" }); }, 5000);
    }
  };

  const handleSyncApprovedQAs = async () => {
    setApprovedQaLoading(true);
    setSyncStatus({ type: "info", message: "Syncing approved Q/A..." });
    try {
      const res = await fetch(`${API_RAG_URL}/global-api/sync-approved-qas`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Sync failed");
      setSyncStatus({ type: "success", message: data.message || "Synced." });
      await fetchApprovedQAs();
    } catch (err) {
      setSyncStatus({ type: "error", message: err.message });
    } finally {
      setApprovedQaLoading(false);
      setTimeout(() => { setSyncStatus({ type: null, message: "" }); }, 5000);
    }
  };

  const handleAsk = async (queryOverride = null, skipCache = false, targetSopOverride = null, approvedQaId = null) => {
    if (isRagOffline || isSyncing) return;
    if (isRecording) stopRecording();

    const rawInput = queryOverride || question;
    if (!rawInput.trim()) return;

    let englishQuestion = rawInput;
    if (!queryOverride && transcript && rawInput.trim() === transcript.trim() && translation) {
      englishQuestion = translation;
    }

    const chatHistoryPayload = messages
      .filter(msg => msg.role === 'user' || (msg.role === 'assistant' && msg.type === 'answer'))
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    const displayQuestion = skipCache ? `Search anyway: "${rawInput}"` : rawInput;

    // ALWAYS show the user message bubble when a search is triggered
    setMessages((prev) => [...prev, { role: "user", content: displayQuestion }]);

    if (!queryOverride) {
      setQuestion("");
      resetVoiceData();
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }

    setLoading(true);
    setApprovingIndex(null);

    try {
      const res = await fetch(`${API_RAG_URL}/global-api/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          question: englishQuestion,
          available_sops: [],
          chat_history: chatHistoryPayload,
          approved_qa_id: approvedQaId,
          skip_cache: skipCache
        }),
      });

      const data = await res.json();

      if (data.type === "approved_suggestions") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              type: "approved_suggestions",
              content: data.data,
              approvedOptions: data.approved_options,
              originalQuestion: englishQuestion
            }
          ]);
          setLoading(false);
          return;
      }

      const searchCtx = data.search_context || data.debug_info || null;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          type: "answer",
          content: data.data || data.message,
          originalQuestion: englishQuestion,
          media: data.media || [],
          pages: data.page_numbers || [],
          suggestions: data.suggestions || [], 
          searchContext: searchCtx,
          isApproved: data.source === "Expert Approved Answer" 
        },
      ]);

      if (searchCtx) setActiveContextData(searchCtx);

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
      const res = await fetch(`${API_RAG_URL}/global-api/expert/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: "global", 
          question: msg.originalQuestion, 
          answer: msg.content, 
          admin_comment: adminComment,
          media: msg.media || [],
          page_numbers: msg.pages || []
        }),
      });

      if (res.ok) {
        setMessages((prev) => prev.map((m, i) => 
          i === index ? { ...m, isApproved: true, adminComment: adminComment } : m
        ));
        
        setApprovingIndex(null);
        setAdminComment("");
        
        setSyncStatus({ type: "success", message: "Answer approved and instantly cached to the global database." });
        setTimeout(() => setSyncStatus({ type: null, message: "" }), 4000);
        
      } else {
        const errorData = await res.json();
        alert(`Failed to approve answer: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Approval error:", error);
      alert("Network error while trying to approve the answer.");
    } finally {
      setIsApproving(false);
    }
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full max-w-xl mx-auto px-4 text-center animate-in fade-in zoom-in duration-500">
      <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 shadow-sm border border-orange-200">
        <Sparkles className="w-6 h-6 text-orange-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">How can I help you today?</h2>
      <p className="text-xs text-slate-500 mb-6">
        Ask any question and I will automatically route it to the right documentation to get you instant, verified answers.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {["What is the emergency shutdown procedure?", "List all daily maintenance tasks", "Show me the safety protocols", "Who needs to approve a bypass?"].map((prompt, i) => (
          <button
            key={i}
            onClick={() => {
              setQuestion(prompt);
              setTimeout(() => textareaRef.current?.focus(), 0);
            }}
            className="p-3 text-left border border-slate-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm transition-all text-xs text-slate-600 bg-white"
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
        <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-sm z-20 relative">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-orange-500 p-1.5 rounded-lg text-white">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-s font-bold text-slate-800 leading-tight">SOP Intelligence</span>
              {/* <div className="flex items-center text-[10px] mt-0.5">
                <span className="text-slate-500 mr-1.5">Context:</span>
                <span className="text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  🌍 Global AI (Search All)
                </span>
              </div> */}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 1. Debug View (Kept outside menu) */}
            <button
              onClick={() => setIsContextPanelOpen(!isContextPanelOpen)}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md transition-colors ${
                isContextPanelOpen ? "text-purple-700 bg-purple-100" : "text-slate-600 bg-slate-100 hover:bg-slate-200"
              }`}
              title="Toggle RAG Debug Data"
            >
              <Terminal className="w-3 h-3" />
              <span className="hidden sm:inline">Debug View</span>
            </button>

            {/* 2. View Approved (Kept outside menu if Admin) */}
            {isAdmin && (
              <button
                onClick={fetchApprovedQAs}
                disabled={approvedQaLoading}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
              >
                <Database className="w-3 h-3" />
                <span className="hidden sm:inline">View Approved</span>
              </button>
            )}

            {/* 3. New Options Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <MoreVertical className="w-3 h-3" />
                <span className="hidden sm:inline">Options</span>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded-md shadow-lg z-50 flex flex-col py-1 overflow-hidden">
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => { handleGlobalSync(); setIsMenuOpen(false); }}
                        disabled={isSyncing || approvedQaLoading}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-blue-600 hover:bg-blue-50 text-left w-full transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? "animate-spin" : ""}`} /> Sync DB
                      </button>

                      <button
                        onClick={() => { handleSyncApprovedQAs(); setIsMenuOpen(false); }}
                        disabled={approvedQaLoading}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-emerald-700 hover:bg-emerald-50 text-left w-full transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-3 h-3" /> Sync Approved
                      </button>

                      <button
                        onClick={() => { handleDeleteApprovedQAs(); setIsMenuOpen(false); }}
                        disabled={approvedQaLoading}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-red-700 hover:bg-red-50 text-left w-full transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" /> Delete Approved
                      </button>

                      <button
                        onClick={() => { handleClearCache(); setIsMenuOpen(false); }}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-100 text-left w-full transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Clear Cache
                      </button>

                      <div className="border-t border-slate-100 my-1"></div>
                    </>
                  )}
                  
                  <button
                    onClick={() => { handleClearHistory(); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium text-red-600 hover:bg-red-50 text-left w-full transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear Chat
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {isRagOffline && (
          <div className="bg-red-500 text-white px-4 py-1.5 shrink-0 flex items-center justify-center gap-2 text-[11px] font-medium shadow-sm z-20">
            <WifiOff className="h-3.5 w-3.5" /> System Offline: New questions cannot be answered right now.
          </div>
        )}

        {syncStatus.message && (
          <div className={`px-4 py-1.5 text-[11px] font-medium text-center shrink-0 shadow-sm z-20 ${
              syncStatus.type === "error" ? "bg-red-50 text-red-700 border-b border-red-200" :
              syncStatus.type === "success" ? "bg-emerald-50 text-emerald-700 border-b border-emerald-200" :
              syncStatus.type === "warning" ? "bg-amber-50 text-amber-700 border-b border-amber-200" :
              "bg-blue-50 text-blue-700 border-b border-blue-200"
            }`}>
            {syncStatus.message}
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative z-10 transition-all duration-300">
            <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 relative scrollbar-thin scrollbar-thumb-slate-200">
              {messages.length === 0 ? (
                renderEmptyState()
              ) : (
                <div className="max-w-4xl mx-auto space-y-4 pb-2">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>
                      {msg.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mr-2.5 mt-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-orange-500" />
                        </div>
                      )}

                      <div className={`relative max-w-[85%] md:max-w-[75%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                          msg.role === "user" ? "bg-orange-500 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                        }`}>
                        {msg.role === "user" && (
                          <button
                            onClick={() => handleCopy(msg.content, i)}
                            className="absolute top-1.5 -left-10 p-1.5 text-slate-400 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm rounded-lg border border-slate-200"
                            title="Copy question"
                          >
                            {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}

                        {msg.role === "assistant" ? (
                          msg.type === "approved_suggestions" ? (
                            <div className="flex flex-col space-y-3">
                              <p className="font-medium flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" /> {msg.content}
                              </p>
                              <div className="flex flex-col gap-2 mt-2">
                                {msg.approvedOptions?.map((opt, idx) => (
                                  <button
                                    key={`sug-approved-${idx}`}
                                    onClick={() => handleAsk(opt.question, false, null, opt.id)}
                                    disabled={isRagOffline}
                                    className="text-left px-3 py-2.5 text-sm border border-emerald-200 bg-white rounded-lg hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md transition-all shadow-sm disabled:opacity-50 font-medium flex items-start gap-2 group"
                                  >
                                    <Sparkles className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                                    <span className="text-slate-700 group-hover:text-emerald-800">{opt.question}</span>
                                  </button>
                                ))}
                                <button
                                  onClick={() => handleAsk(msg.originalQuestion, true)}
                                  disabled={isRagOffline}
                                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors mt-2 disabled:opacity-50"
                                >
                                  None of these, search anyway <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ) : msg.type === "suggestions" ? (
                            <div className="flex flex-col space-y-2">
                              <p className="font-medium flex items-center gap-1.5 text-slate-700">
                                <HelpCircle className="w-4 h-4 text-orange-500" /> {msg.content}
                              </p>
                              <div className="flex flex-col gap-1.5 mt-1">
                                {msg.suggestions.map((sug, idx) => (
                                  <button
                                    key={`sug-type-${idx}`}
                                    onClick={() => handleAsk(sug)}
                                    disabled={isRagOffline}
                                    className="text-left px-3 py-2 text-xs border border-slate-200 bg-slate-50 rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-all shadow-sm disabled:opacity-50 font-medium flex items-center gap-2"
                                  >
                                    <ArrowRight className="w-3 h-3 text-orange-500" /> {sug}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="w-full prose prose-slate prose-sm prose-p:my-1 prose-headings:my-2 prose-li:my-0 prose-ul:my-1 max-w-none prose-p:leading-relaxed prose-a:text-orange-600 text-[13px]">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => <h1 className="text-base font-bold text-slate-800 mt-5 mb-2 border-b border-slate-200 pb-1">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-[15px] font-bold text-slate-800 mt-4 mb-2">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-[13px] font-bold text-orange-700 bg-orange-50 px-2 py-1.5 rounded-md mt-4 mb-2 border border-orange-100">{children}</h3>,
                                  table: ({ children }) => <div className="overflow-x-auto my-3 rounded-md border border-slate-200"><table className="min-w-full divide-y divide-slate-200 m-0">{children}</table></div>,
                                  th: ({ children }) => <th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider">{children}</th>,
                                  td: ({ children }) => <td className="px-3 py-2 text-[13px] text-slate-600 border-t border-slate-200 whitespace-pre-wrap">{children}</td>,
                                  p: ({ children }) => <p className="mb-3 text-[13px] text-slate-700 leading-relaxed">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc pl-5 mb-4 text-[13px] text-slate-700 space-y-1.5 marker:text-orange-500">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-4 text-[13px] text-slate-700 space-y-1.5">{children}</ol>,
                                  li: ({ children }) => <li className="pl-1">{children}</li>,
                                  strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                                  img: ({ src, alt }) => {
                                    const isVideo = alt === "VIDEO" || src.match(/\.(mp4|webm|ogg)$/i) || src.includes(".mp4");
                                    const mediaObj = { url: src, caption: alt, type: isVideo ? "video" : "image" };

                                    if (isVideo) {
                                      return (
                                        <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-sm shadow-sm relative group cursor-pointer" onClick={() => setActiveMedia(mediaObj)}>
                                          <div className="absolute inset-0 z-10 bg-transparent" title="Click to expand" />
                                          <video src={src} className="w-full max-h-[200px] object-contain bg-black" />
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
                                      <div className="my-4 max-w-sm relative group cursor-pointer" onClick={() => setActiveMedia(mediaObj)}>
                                        <img src={src} alt={alt} className="rounded-xl shadow-sm border border-slate-200 w-full object-cover max-h-[240px]" />
                                        <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                          <Maximize2 size={14} className="text-white" />
                                        </div>
                                        {alt && alt !== "image" && alt !== "Image" && alt !== "None" && (
                                          <div className="mt-1.5 text-xs text-slate-500 text-center italic">{alt}</div>
                                        )}
                                      </div>
                                    );
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>

                              {msg.pages && msg.pages.length > 0 && (
                                <div className="mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
                                  <strong className="text-slate-600">Referenced Documents & Pages:</strong> {msg.pages.join(" | ")}
                                </div>
                              )}

                              {msg.suggestions && msg.suggestions.length > 0 && (
                                <div className="mt-4 border-t border-slate-100 pt-3">
                                  <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">Suggested Follow-ups</p>
                                  <div className="flex flex-wrap gap-2">
                                    {msg.suggestions.map((sug, idx) => (
                                      <button
                                        key={`sug-followup-${idx}`}
                                        onClick={() => handleAsk(sug)}
                                        disabled={isRagOffline || isSyncing}
                                        className="text-left px-3 py-1.5 text-xs border border-orange-200 bg-orange-50 text-orange-700 rounded-full hover:bg-orange-500 hover:text-white transition-all shadow-sm disabled:opacity-50 font-medium flex items-center gap-1.5"
                                      >
                                        <ArrowRight className="w-3 h-3" /> {sug}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {msg.media && (() => {
                                const unusedMedia = msg.media.filter((m) => !msg.content.includes(m.url));
                                if (unusedMedia.length === 0) return null;
                                return (
                                  <div className="mt-4 border-t border-slate-100 pt-3">
                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">References & Media</p>
                                    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                                      {unusedMedia.map((m, idx) => (
                                        <div key={idx} className="shrink-0 w-24 h-16 rounded-md overflow-hidden border border-slate-200 relative group cursor-pointer shadow-sm" onClick={() => setActiveMedia(m)}>
                                          {m.type === "video" || m.url.match(/\.(mp4|webm)$/i) ? (
                                            <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                                              <Play className="text-white/80 w-6 h-6 group-hover:scale-110 transition-transform" />
                                            </div>
                                          ) : (
                                            <img src={m.url} alt="Reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              {msg.isApproved && (
                                <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-xs flex gap-2 items-start shadow-sm">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-emerald-800">Verified by Expert</span>
                                    {msg.adminComment && <span className="text-emerald-700 mt-0.5">{msg.adminComment}</span>}
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                                <div className="flex items-center gap-2">
                                  <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                    {msg.source?.includes("cache") && <><AlertCircle className="w-3 h-3" /> Fast Cache</>}
                                  </div>
                                  {msg.searchContext && (
                                    <button 
                                      onClick={() => {
                                        setActiveContextData(msg.searchContext);
                                        setIsContextPanelOpen(true);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition-colors"
                                    >
                                      <Terminal className="w-3 h-3" /> View Source Data
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {!msg.isApproved && approvingIndex !== i && isAdmin && (
                                    <button onClick={() => { setApprovingIndex(i); setAdminComment(""); }} disabled={isRagOffline} className="px-2 py-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1" title="Approve this answer">
                                      <ThumbsUp className="w-3 h-3" /><span className="text-[11px] font-medium">Approve</span>
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => handleTTS(msg.content, i)}
                                    disabled={isPlayingTTS && activeTTSIndex !== i}
                                    className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                                      activeTTSIndex === i
                                        ? "text-orange-600 bg-orange-50"
                                        : "text-slate-500 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500"
                                    }`}
                                    title={activeTTSIndex === i ? "Stop speaking" : "Listen to answer"}
                                  >
                                    {activeTTSIndex === i ? (
                                      <VolumeX className="w-3.5 h-3.5" />
                                    ) : (
                                      <Volume2 className="w-3.5 h-3.5" />
                                    )}
                                    <span className="text-[11px] font-medium">
                                      {activeTTSIndex === i ? "Stop" : "Listen"}
                                    </span>
                                  </button>

                                  <button onClick={() => handleCopy(msg.content, i)} className="px-2 py-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors flex items-center gap-1">
                                    {copiedIndex === i ? <><Check className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[11px] text-emerald-500 font-medium">Copied</span></> : <><Copy className="w-3.5 h-3.5" /><span className="text-[11px] font-medium">Copy</span></>}
                                  </button>
                                </div>
                              </div>

                              {approvingIndex === i && !msg.isApproved && isAdmin && (
                                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col gap-2 shadow-inner">
                                  <label className="text-xs font-semibold text-slate-700">Add Approval Note (Optional)</label>
                                  <input type="text" value={adminComment} onChange={(e) => setAdminComment(e.target.value)} className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-md outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white" placeholder="e.g., Verified against procedure V2.1" disabled={isApproving} />
                                  <div className="flex justify-end gap-1.5 mt-1">
                                    <button onClick={() => setApprovingIndex(null)} className="text-[11px] font-medium text-slate-600 hover:bg-slate-200 px-2.5 py-1.5 rounded-md" disabled={isApproving}>Cancel</button>
                                    <button onClick={() => submitApproval(i, msg)} disabled={isApproving} className="text-[11px] font-medium bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors shadow-sm">{isApproving ? "Approving..." : "Confirm Verification"}</button>
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

                  {loading && (
                    <div className="flex justify-start">
                      <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0 mr-2.5 mt-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-orange-500" />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1 h-[40px]">
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} className="h-2" />
                </div>
              )}
            </div>

            {/* INPUT AREA */}
            <div className="bg-white px-3 py-3 md:px-6 md:py-4 border-t border-slate-200 shrink-0 relative">
              {isRecording && translation && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 md:left-6 md:translate-x-0 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-t-lg border border-blue-100 border-b-0 flex items-center gap-2 shadow-sm z-10 transition-all">
                  <Activity size={12} className="animate-pulse" />
                  <span className="truncate max-w-[280px]">Translating: "{translation}"</span>
                </div>
              )}

              <div className="max-w-4xl mx-auto">
                <div className={`relative flex items-end gap-2 rounded-xl border px-3 py-2 transition-all shadow-sm ${isRagOffline || isSyncing ? "bg-slate-50 border-slate-200 opacity-70" : "bg-white border-slate-300 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500"}`}>
                  <div className="flex items-center gap-0.5 mb-0.5 shrink-0">
                    <button onClick={toggleRecording} disabled={isRagOffline} className={`flex-shrink-0 p-2 rounded-full transition-colors duration-200 flex items-center justify-center ${isRecording ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse" : "bg-slate-200 text-slate-600 hover:bg-slate-300"}`} title={isRecording ? "Stop Recording" : "Start Voice Input"}>
                      {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={16} />}
                    </button>

                    {availableMics && availableMics.length > 1 && (
                      <div className="relative flex items-center justify-center w-6 h-8 rounded hover:bg-slate-100 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 pointer-events-none"><path d="m6 9 6 6 6-6"/></svg>
                        <select value={selectedMicId} onChange={(e) => setSelectedMicId(e.target.value)} disabled={isRecording || isRagOffline} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" title="Switch Microphone">
                          {availableMics.map((mic, idx) => <option key={mic.deviceId} value={mic.deviceId} className="text-black">{mic.label || `Mic ${idx + 1}`}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <textarea ref={textareaRef} value={question} onChange={(e) => { setQuestion(e.target.value); handleTextareaInput(); }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }} placeholder={isRagOffline ? "Service disconnected..." : isSyncing ? "Syncing database, please wait..." : isRecording ? "Listening in your language..." : "Ask anything about all documents..."} disabled={loading || isRagOffline || isSyncing} rows={1} className="flex-1 bg-transparent py-1.5 text-[13px] outline-none resize-none overflow-y-auto disabled:cursor-not-allowed max-h-[120px] scrollbar-thin scrollbar-thumb-slate-200" />
                  
                  <div className="flex items-center gap-2 pb-0.5">
                    <button onClick={() => handleAsk()} disabled={loading || !question.trim() || isRagOffline || isSyncing} className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors shadow-sm shrink-0">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex justify-center text-[10px] text-slate-400 font-medium">
                  {isRagOffline ? "Chat is unavailable while offline." : "Press Enter to send, Shift + Enter for new line. Tap Mic to dictate."}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT DEBUG PANEL */}
          {isContextPanelOpen && (
            <div className="w-full sm:w-80 md:w-[400px] shrink-0 border-l border-white/40 bg-slate-50/90 backdrop-blur-md h-full flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-30 absolute right-0 top-0 sm:relative transition-all duration-300">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white/80 shadow-sm shrink-0">
                <h3 className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                  <Terminal size={14} className="text-purple-600" /> RAG Debug Data
                </h3>
                <button onClick={() => setIsContextPanelOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-slate-300">
                {!activeContextData ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                    <Database className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">No active search context.</p>
                    <p className="text-[10px] mt-1">Ask a question or click "View Source Data" on an existing answer.</p>
                  </div>
                ) : (
                  <div className="space-y-3 font-mono">
                    
                    {/* Final LLM Context Section */}
                    <details className="border border-slate-200 rounded-md bg-white/80 shadow-sm group" open>
                      <summary className="p-2.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none group-open:border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <span className="flex items-center gap-1.5"><Code size={13} className="text-orange-500"/> Final LLM Context</span>
                      </summary>
                      <div className="p-0 bg-slate-900/95 overflow-hidden rounded-b-md">
                        <pre className="text-[10px] text-emerald-400 p-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                          {activeContextData.final_llm_context || "No context assembled for LLM."}
                        </pre>
                      </div>
                    </details>

                    {/* Reranked Search Section */}
                    <details className="border border-slate-200 rounded-md bg-white/80 shadow-sm group">
                      <summary className="p-2.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none group-open:border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <span className="flex items-center gap-1.5"><ListFilter size={13} className="text-blue-500"/> Reranked Data</span>
                        <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full">{activeContextData.reranked_search?.length || 0} chunks</span>
                      </summary>
                      <div className="p-2 bg-slate-50/50 max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
                        {activeContextData.reranked_search?.map((item, idx) => (
                          <div key={idx} className="border border-slate-200/60 p-2 rounded bg-white text-[10px]">
                            <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-slate-100">
                              <span className="font-bold text-slate-600 bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Score: {item.score?.toFixed(5)}</span>
                              <span className="text-slate-400 truncate max-w-[120px]" title={item.id}>{item.id}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-slate-600 leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Initial Similarity Search (ChromaDB) */}
                    <details className="border border-slate-200 rounded-md bg-white/80 shadow-sm group">
                      <summary className="p-2.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none group-open:border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <span className="flex items-center gap-1.5"><Database size={13} className="text-purple-500"/> Initial Vector Search</span>
                        <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full">{activeContextData.initial_search?.length || 0} chunks</span>
                      </summary>
                      <div className="p-2 bg-slate-50/50 max-h-[300px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-300">
                        {activeContextData.initial_search?.map((item, idx) => (
                          <div key={idx} className="border border-slate-200/60 p-2 rounded bg-white text-[10px]">
                            <div className="flex justify-between items-center mb-1.5 pb-1.5 border-b border-slate-100">
                              <span className="font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Dist: {item.distance?.toFixed(3)}</span>
                              <span className="text-slate-400 truncate max-w-[120px]" title={item.id}>{item.id}</span>
                            </div>
                            <p className="whitespace-pre-wrap text-slate-500 leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* Extracted Parent Data */}
                    <details className="border border-slate-200 rounded-md bg-white/80 shadow-sm group">
                      <summary className="p-2.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none group-open:border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <span className="flex items-center gap-1.5"><LayoutList size={13} className="text-emerald-500"/> Extracted Parent Nodes</span>
                        <span className="text-[10px] text-slate-400 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full">{activeContextData.parent_sections?.length || 0} nodes</span>
                      </summary>
                      <div className="p-0 bg-slate-900/95 overflow-hidden rounded-b-md">
                        <pre className="text-[10px] text-sky-400 p-3 max-h-[300px] overflow-y-auto whitespace-pre-wrap break-words leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
                          {JSON.stringify(activeContextData.parent_sections, null, 2)}
                        </pre>
                      </div>
                    </details>

                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showApprovedModal && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  Approved Q/A Vector Database
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {approvedQaRows.length} records
                </p>
              </div>

              <button
                onClick={() => setShowApprovedModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <input
                value={approvedQaSearch}
                onChange={(e) => setApprovedQaSearch(e.target.value)}
                placeholder="Search question..."
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
              />
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3">Question</th>
                    <th className="text-left px-4 py-3">Answer</th>
                    <th className="text-left px-4 py-3 w-24">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {approvedQaRows
                    .filter((row) =>
                      row.question
                        ?.toLowerCase()
                        .includes(approvedQaSearch.toLowerCase())
                    )
                    .map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 align-top text-slate-700 font-medium max-w-xs">
                          {row.question}
                        </td>

                        <td className="px-4 py-3 align-top text-slate-600 text-xs">
                          <div className="line-clamp-4 whitespace-pre-wrap">
                            {row.answer}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-top">
                          <button
                            onClick={() =>
                              handleDeleteSingleApprovedQA(row.id)
                            }
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      <MediaModal mediaItem={activeMedia} onClose={() => setActiveMedia(null)} />
    </>
  );
}