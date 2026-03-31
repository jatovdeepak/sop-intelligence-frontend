import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Globe,
  HelpCircle,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Image as ImageIcon,
  Video,
  Maximize2,
  Play,
  WifiOff,
  Copy,
  Check,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Square,
  Activity,
  Volume2,
  VolumeX,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import MediaModal from "../components/MediaModal";
import { useServiceStatus } from "../context/ServiceStatusContext";
import { useSarvamService } from "../services/sarvam_service";

export default function ChatWithSOP({ sop, onClose }) {
  // --- STATE & REFS ---
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeMedia, setActiveMedia] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // 🔥 Admin & Approval State
  const [isAdmin, setIsAdmin] = useState(false);
  const [approvingIndex, setApprovingIndex] = useState(null);
  const [adminComment, setAdminComment] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // 🔥 TTS Active Tracking State
  const [activeTTSIndex, setActiveTTSIndex] = useState(null);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // 🔥 RAG SERVICE STATUS
  const { rag } = useServiceStatus();
  const isRagOffline = rag.status !== "online" && rag.status !== "connecting";

  const API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";

  // 🔥 SARVAM VOICE SERVICE
  const {
    isRecording,
    transcript,
    translation,
    toggleRecording,
    stopRecording,
    resetData: resetVoiceData,
    playTextToSpeech,
    stopTTS,
    isPlayingTTS,
  } = useSarvamService();

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
      setQuestion(transcript); // Show the exact heard words in native language
    }
  }, [transcript, isRecording]);

  // --- DERIVED SOP ID ---
  const rawId = sop?.sopId || sop?._id || "unknown";
  const safeDocumentId = rawId
    .toString()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();

  // --- INITIALIZATION ---
  useEffect(() => {
    let storedId = sessionStorage.getItem("sop_user_id");
    if (!storedId) {
      storedId = "user_" + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem("sop_user_id", storedId);
    }
    setUserId(storedId);
    fetchHistory(storedId);

    const userRole = sessionStorage.getItem("role");
    setIsAdmin(userRole === "Admin");
  }, []);

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

  // --- NEW FEATURES FUNCTIONS ---
  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = async () => {
    if (
      window.confirm("Are you sure you want to clear the current chat view?")
    ) {
      // 1. Clear the UI immediately for a snappy user experience
      setMessages([]);

      // 2. Tell the backend to permanently delete it
      try {
        const res = await fetch(`${API_URL}/user/clear-history/${userId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });

        if (!res.ok) {
          console.error("Failed to clear chat history on the server.");
          // Optional: You could fetch the history back here if the deletion failed
        }
      } catch (err) {
        console.error("Error clearing chat history:", err);
      }
    }
  };

  const handleSuggestionClick = (text) => {
    setQuestion(text);
    handleAsk(text);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const submitApproval = async (index, msg) => {
    if (isRagOffline) return;
    setIsApproving(true);

    try {
      const res = await fetch(`${API_URL}/admin/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: safeDocumentId,
          question: msg.originalQuestion,
          answer: msg.content,
          admin_comment: adminComment,
        }),
      });

      if (res.ok) {
        setMessages((prev) =>
          prev.map((m, i) =>
            i === index
              ? { ...m, isApproved: true, adminComment: adminComment }
              : m
          )
        );
        setApprovingIndex(null);
        setAdminComment("");
      } else {
        alert("Failed to approve answer. Please check server logs.");
      }
    } catch (error) {
      console.error("Approval error:", error);
      alert("An error occurred while approving.");
    } finally {
      setIsApproving(false);
    }
  };

  // --- API FUNCTIONS ---
  const fetchHistory = async (id) => {
    try {
      const res = await fetch(
        `${API_URL}/user/history/${id}/${safeDocumentId}`
      );
      if (!res.ok) return;
      const data = await res.json();

      if (data && data.length > 0) {
        const historyMessages = [];
        data.forEach((item) => {
          const msgTime = item.timestamp
            ? new Date(item.timestamp)
            : new Date();

          historyMessages.push({
            role: "user",
            content: item.question,
            timestamp: msgTime,
          });

          if (item.suggestions && item.suggestions.length > 0) {
            historyMessages.push({
              role: "assistant",
              type: "suggestions",
              content:
                "I found similar questions in my memory. Did you mean one of these?",
              suggestions: item.suggestions,
              originalQuestion: item.question,
              timestamp: msgTime,
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
              timestamp: msgTime,
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
    if (isRagOffline) return;

    if (isRecording) {
      stopRecording();
    }

    // The text the user actually saw/typed/spoke (Native Language)
    const rawInput = queryOverride || question;
    if (!rawInput.trim()) return;

    // The text we send to the backend to search the SOP (English)
    let englishQuestion = rawInput;

    // If they used voice and we have a translation, use the translation for the backend
    if (
      !queryOverride &&
      transcript &&
      rawInput.trim() === transcript.trim() &&
      translation
    ) {
      englishQuestion = translation;
    }

    // Show the NATIVE Question in the chat bubble
    const displayQuestion = skipCache
      ? `Search anyway: "${rawInput}"`
      : rawInput;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: displayQuestion, timestamp: new Date() },
    ]);

    if (!queryOverride) {
      setQuestion("");
      resetVoiceData(); // Clear the Sarvam voice states so the next message is fresh
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    }

    setLoading(true);
    setApprovingIndex(null);

    try {
      const res = await fetch(`${API_URL}/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          document_id: safeDocumentId,
          question: rawInput,
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
            originalQuestion: data.original_question || englishQuestion,
            timestamp: new Date(),
          },
        ]);
      } else {
        let finalContent = (data.data || data.answer || "").trim();
        if (!finalContent)
          finalContent =
            "⚠️ Sorry, I received an empty response from the server.";

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
            originalQuestion: englishQuestion,
            timestamp: new Date(),
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
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-orange-50 px-6 py-4 border-b shrink-0">
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
            <div className="flex items-center gap-4">
              {/* Service Status Indicator */}
              <div className="flex items-center gap-2 text-xs font-medium bg-white px-2 py-1 rounded-md border shadow-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isRagOffline ? "bg-red-500" : "bg-emerald-500"
                  }`}
                ></div>
                <span
                  className={isRagOffline ? "text-slate-600" : "text-slate-600"}
                >
                  {isRagOffline ? "RAG Disconnected" : "RAG Connected"}
                </span>
              </div>

              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear Chat History"
                  className="rounded-lg p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}

              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-500 hover:bg-orange-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Service Down Alert Banner */}
          {isRagOffline && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3 shrink-0 flex items-center gap-3 text-red-700 text-sm">
              <WifiOff className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p>
                <strong>Connection Lost:</strong> The RAG AI Service is
                currently offline. You can view your chat history, but new
                questions cannot be answered right now.
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
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } group`}
              >
                <div
                  className={`relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-orange-500 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {msg.role === "user" && (
                    <button
                      onClick={() => handleCopy(msg.content, i)}
                      className="absolute top-3 -left-10 p-1.5 text-slate-400 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm rounded-md border"
                      title="Copy question"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
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
                              onClick={() => handleSuggestionClick(sug)}
                              disabled={isRagOffline}
                              className="text-left px-3 py-2 text-sm border border-slate-300 bg-white rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:hover:border-slate-300 disabled:hover:text-slate-800"
                            >
                              "{sug}"
                            </button>
                          ))}
                          <button
                            onClick={() =>
                              handleAsk(msg.originalQuestion, true)
                            }
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
                            h1: ({ children }) => (
                              <h1 className="text-base font-bold text-slate-800 mt-5 mb-2 border-b border-slate-200 pb-1">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-[15px] font-bold text-slate-800 mt-4 mb-2">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-[13px] font-bold text-orange-700 bg-orange-50 px-2 py-1.5 rounded-md mt-4 mb-2 border border-orange-100">
                                {children}
                              </h3>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3 rounded-md border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200 m-0">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="bg-slate-50 px-3 py-2 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-3 py-2 text-[13px] text-slate-600 border-t border-slate-200 whitespace-pre-wrap">
                                {children}
                              </td>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3 text-[13px] text-slate-700 leading-relaxed">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 mb-4 text-[13px] text-slate-700 space-y-1.5 marker:text-orange-500">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-5 mb-4 text-[13px] text-slate-700 space-y-1.5">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="pl-1">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-slate-900">
                                {children}
                              </strong>
                            ),
                            img: ({ src, alt }) => {
                              const isVideo =
                                alt === "VIDEO" ||
                                src.match(/\.(mp4|webm|ogg)$/i) ||
                                src.includes(".mp4");
                              const mediaObj = {
                                url: src,
                                caption: alt,
                                type: isVideo ? "video" : "image",
                              };

                              if (isVideo) {
                                return (
                                  <div
                                    className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-w-sm shadow-sm relative group cursor-pointer"
                                    onClick={() => setActiveMedia(mediaObj)}
                                  >
                                    <div
                                      className="absolute inset-0 z-10 bg-transparent"
                                      title="Click to expand"
                                    />
                                    <video
                                      src={src}
                                      className="w-full max-h-[200px] object-contain bg-black"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                      <Maximize2
                                        size={14}
                                        className="text-white"
                                      />
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                      <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                                        <Play
                                          fill="currentColor"
                                          size={20}
                                          className="ml-0.5"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  className="my-4 max-w-sm relative group cursor-pointer"
                                  onClick={() => setActiveMedia(mediaObj)}
                                >
                                  <img
                                    src={src}
                                    alt={alt}
                                    className="rounded-xl shadow-sm border border-slate-200 w-full object-cover max-h-[240px]"
                                  />
                                  <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <Maximize2
                                      size={14}
                                      className="text-white"
                                    />
                                  </div>
                                  {alt &&
                                    alt !== "image" &&
                                    alt !== "Image" &&
                                    alt !== "None" && (
                                      <div className="mt-1.5 text-xs text-slate-500 text-center italic">
                                        {alt}
                                      </div>
                                    )}
                                </div>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>

                        {/* Fallback Media Gallery */}
                        {msg.media &&
                          (() => {
                            const unusedMedia = msg.media.filter(
                              (m) => !msg.content.includes(m.url)
                            );
                            if (unusedMedia.length === 0) return null;

                            return (
                              <div className="mt-4 border-t border-slate-100 pt-3">
                                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                                  References & Media
                                </p>

                                <div className="flex overflow-x-auto gap-3 pb-2 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-slate-200">
                                  {unusedMedia.map((m, idx) => {
                                    const isVideo =
                                      m.type === "video" ||
                                      m.url.match(/\.(mp4|webm|ogg)$/i);

                                    return (
                                      <div
                                        key={idx}
                                        className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm flex flex-col shrink-0 w-[100px] snap-start"
                                      >
                                        {isVideo ? (
                                          <div
                                            className="relative pt-[56.25%] bg-black group cursor-pointer"
                                            onClick={() => setActiveMedia(m)}
                                          >
                                            <div className="absolute inset-0 bg-transparent z-10" />
                                            <video
                                              src={m.url}
                                              className="absolute inset-0 w-full h-full object-cover opacity-80"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                                              <div className="bg-white/20 backdrop-blur-sm text-white rounded-full p-2 shadow-lg group-hover:scale-110 transition-transform">
                                                <Play
                                                  fill="currentColor"
                                                  size={14}
                                                  className="ml-0.5"
                                                />
                                              </div>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                              <Maximize2
                                                size={14}
                                                className="text-white"
                                              />
                                            </div>
                                          </div>
                                        ) : (
                                          <div
                                            className="relative group cursor-pointer flex-1"
                                            onClick={() => setActiveMedia(m)}
                                          >
                                            <img
                                              src={m.url}
                                              alt={m.caption || "Reference"}
                                              className="w-full h-18 object-cover group-hover:opacity-90 transition-opacity"
                                            />
                                            <div className="absolute top-2 right-2 bg-black/60 p-1.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                              <Maximize2
                                                size={14}
                                                className="text-white"
                                              />
                                            </div>
                                          </div>
                                        )}
                                        {m.caption && m.caption !== "None" && (
                                          <div className="p-2 text-[10px] text-slate-600 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                                            <span
                                              className="truncate mr-2"
                                              title={m.caption}
                                            >
                                              {m.caption}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })()}

                        {msg.isApproved && (
                          <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />{" "}
                              Verified by Expert
                            </div>
                            {msg.adminComment && (
                              <p className="text-emerald-700 mt-1">
                                <span className="font-medium">Admin Note:</span>{" "}
                                {msg.adminComment}
                              </p>
                            )}
                          </div>
                        )}

                        {approvingIndex === i && !msg.isApproved && isAdmin && (
                          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex flex-col gap-2">
                            <label className="text-xs font-semibold text-emerald-800">
                              Add Admin Note (Optional)
                            </label>
                            <input
                              type="text"
                              value={adminComment}
                              onChange={(e) => setAdminComment(e.target.value)}
                              className="text-sm px-2 py-1.5 border border-emerald-200 rounded outline-none focus:border-emerald-400 bg-white"
                              placeholder="e.g., Verified against standard procedure..."
                              disabled={isApproving}
                            />
                            <div className="flex items-center justify-end gap-2 mt-1">
                              <button
                                onClick={() => setApprovingIndex(null)}
                                className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1"
                                disabled={isApproving}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => submitApproval(i, msg)}
                                disabled={isApproving}
                                className="text-xs font-medium bg-emerald-500 text-white px-3 py-1.5 rounded hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                              >
                                {isApproving
                                  ? "Approving..."
                                  : "Confirm Approval"}
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-2">
                          <div className="text-xs text-slate-500">
                            {msg.source?.includes("cache")
                              ? "⚡ Answered from Cache"
                              : ""}
                          </div>

                          <div className="flex items-center gap-2">
                            {!msg.isApproved &&
                              approvingIndex !== i &&
                              isAdmin && (
                                <button
                                  onClick={() => {
                                    setApprovingIndex(i);
                                    setAdminComment("");
                                  }}
                                  disabled={isRagOffline}
                                  className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors flex items-center gap-1 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                  title="Approve this answer"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-medium">
                                    Approve
                                  </span>
                                </button>
                              )}

                            <button
                              onClick={() => handleTTS(msg.content, i)}
                              disabled={isPlayingTTS && activeTTSIndex !== i}
                              className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
                                activeTTSIndex === i
                                  ? "text-orange-500 bg-orange-50"
                                  : "text-slate-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                              }`}
                              title={
                                activeTTSIndex === i
                                  ? "Stop speaking"
                                  : "Listen to answer"
                              }
                            >
                              {activeTTSIndex === i ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                              <span className="text-[10px] font-medium">
                                {activeTTSIndex === i ? "Stop" : "Listen"}
                              </span>
                            </button>

                            <button
                              onClick={() => handleCopy(msg.content, i)}
                              className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors flex items-center gap-1"
                              title="Copy answer"
                            >
                              {copiedIndex === i ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />{" "}
                                  <span className="text-[10px] text-emerald-500 font-medium">
                                    Copied
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />{" "}
                                  <span className="text-[10px] font-medium">
                                    Copy
                                  </span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
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
          <div className="border-t px-4 py-2 bg-white shrink-0">
            <div className="flex flex-wrap gap-2">
              <div className="text-sm text-slate-500">Suggestions:</div>
              <button
                onClick={() =>
                  handleSuggestionClick(
                    "Can you summarize the main objective and scope of this SOP?"
                  )
                }
                disabled={isRagOffline}
                className="bg-orange-100 rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-white"
              >
                Summarize the main objective
              </button>
              <button
                onClick={() =>
                  handleSuggestionClick(
                    "What are the key safety precautions, warnings, or prerequisites mentioned?"
                  )
                }
                disabled={isRagOffline}
                className="bg-orange-100 rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-white"
              >
                Key safety precautions & warnings
              </button>
              <button
                onClick={() =>
                  handleSuggestionClick(
                    "List the step-by-step instructions for the primary procedure."
                  )
                }
                disabled={isRagOffline}
                className="bg-orange-100 rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:hover:bg-white"
              >
                Step-by-step instructions
              </button>
            </div>
          </div>

          {/* 🔥 INPUT AREA WITH VOICE BUTTON */}
          <div className="border-t px-6 py-4 bg-white shrink-0 relative">
            {/* English Translation Indicator above input */}
            {isRecording && translation && (
              <div className="absolute -top-7 left-6 bg-blue-50 text-blue-700 text-xs px-3 py-1.5 rounded-t-lg border border-blue-100 border-b-0 flex items-center gap-2 shadow-sm z-10 transition-all">
                <Activity size={12} className="animate-pulse" />
                <span className="truncate max-w-[280px]">
                  Translating: "{translation}"
                </span>
              </div>
            )}

            <div
              className={`flex items-end gap-2 rounded-xl border px-3 py-2 transition-all
              ${
                isRagOffline
                  ? "bg-slate-100 border-slate-200 opacity-70"
                  : "bg-slate-50 border-slate-200 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500"
              }`}
            >
              {/* Mic/Stop Button */}
              <button
                onClick={toggleRecording}
                disabled={isRagOffline}
                className={`flex-shrink-0 p-2 mb-0.5 rounded-full transition-colors duration-200 flex items-center justify-center
                  ${
                    isRecording
                      ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                title={isRecording ? "Stop Recording" : "Start Voice Input"}
              >
                {isRecording ? (
                  <Square size={16} fill="currentColor" />
                ) : (
                  <Mic size={16} />
                )}
              </button>

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
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed resize-none overflow-y-auto py-1.5"
                placeholder={
                  isRagOffline
                    ? "Service disconnected..."
                    : isRecording
                    ? "Listening in your language..."
                    : `Ask about ${sop?.id ?? "this SOP"}...`
                }
                disabled={loading || isRagOffline}
                rows={1}
              />

              <div className="flex items-center gap-2 pb-1">
                <button
                  onClick={() => handleAsk()}
                  disabled={loading || !question.trim() || isRagOffline}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 transition-colors disabled:cursor-not-allowed shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-400 text-center">
              {isRagOffline
                ? "Chat is unavailable while service is offline."
                : "Press Enter to send, Shift+Enter for new line. Tap Mic to dictate in your native language."}
            </p>
          </div>
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
