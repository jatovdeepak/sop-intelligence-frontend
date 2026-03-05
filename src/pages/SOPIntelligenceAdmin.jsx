// import { useState, useEffect, useRef } from "react";
// import { Sparkles, Search, HelpCircle, ArrowRight, CheckCircle, Check } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";

// export default function SOPIntelligenceAdmin() {
//   const [question, setQuestion] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [chatMode, setChatMode] = useState(false);
  
//   // NEW: State to track drafted admin comments before they are saved
//   const [commentDrafts, setCommentDrafts] = useState({});

//   const bottomRef = useRef(null);

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading]);

//   const handleAsk = async (queryOverride = null, skipCache = false) => {
//     const currentQuestion = queryOverride || question;
//     if (!currentQuestion.trim()) return;

//     if (!chatMode) setChatMode(true);

//     const displayQuestion = skipCache 
//       ? `Search anyway: "${currentQuestion}"` 
//       : currentQuestion;

//     setMessages((prev) => [...prev, { role: "user", content: displayQuestion }]);
    
//     if (!queryOverride) setQuestion(""); 
//     setLoading(true);

//     try {
//       const res = await fetch("http://localhost:8000/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ question: currentQuestion, skip_cache: skipCache }),
//       });

//       const data = await res.json();

//       if (data.type === "suggestions") {
//         setMessages((prev) => [
//           ...prev,
//           {
//             role: "assistant",
//             type: "suggestions",
//             content: data.message || "Did you mean one of these?",
//             suggestions: data.data || [], 
//             originalQuestion: data.original_question || currentQuestion 
//           },
//         ]);
//       } else {
//         let finalContent = (data.data || data.answer || "").trim();
//         if (!finalContent) {
//           finalContent = "⚠️ Sorry, I received an empty response from the server.";
//         }

//         setMessages((prev) => [
//           ...prev,
//           {
//             role: "assistant",
//             type: "answer",
//             content: finalContent, 
//             source: data.source || "rag", 
//             // NEW: Store approval data and the question so we can approve it later
//             isApproved: data.is_approved || false,
//             adminComment: data.admin_comment || "",
//             question: currentQuestion
//           },
//         ]);
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           type: "answer",
//           content: "❌ An error occurred while fetching the response.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // NEW: Function to handle admin approval
//   const handleApprove = async (index, msg) => {
//     const comment = commentDrafts[index] || "";
//     try {
//       const res = await fetch("http://localhost:8000/approve", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           question: msg.question,
//           answer: msg.content,
//           admin_comment: comment,
//         }),
//       });

//       if (res.ok) {
//         // Update the specific message in UI to show it's now approved
//         setMessages((prev) => {
//           const newMsgs = [...prev];
//           newMsgs[index] = { 
//             ...newMsgs[index], 
//             isApproved: true, 
//             adminComment: comment 
//           };
//           return newMsgs;
//         });
        
//         // Clear the draft text
//         setCommentDrafts((prev) => {
//           const newDrafts = { ...prev };
//           delete newDrafts[index];
//           return newDrafts;
//         });
//       }
//     } catch (error) {
//       console.error("Failed to approve answer:", error);
//       alert("Failed to save approval.");
//     }
//   };

//   /* ───────────────── LANDING PAGE ───────────────── */
//   if (!chatMode) {
//     return (
//       <div className="flex h-full items-center justify-center">
//         <div className="w-full max-w-3xl px-6">
//           <div className="mb-8 text-center">
//             <h1 className="text-3xl font-semibold text-slate-900">
//             SOP Intelligence (Admin)
//             </h1>
//             <p className="mt-2 text-slate-500">
//               Ask questions, analyze SOPs, validate answers, and generate insights instantly
//             </p>
//           </div>
//           <div className="relative">
//             <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
//             <input
//               value={question}
//               onChange={(e) => setQuestion(e.target.value)}
//               onKeyDown={(e) => e.key === "Enter" && handleAsk()}
//               placeholder="Ask anything about your SOPs…"
//               className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-14 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
//             />
//             <button
//               onClick={() => handleAsk()}
//               className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-orange-500 p-2 text-white shadow hover:bg-orange-600"
//             >
//               <Sparkles className="h-5 w-5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   /* ───────────────── CHAT PAGE ───────────────── */
//   return (
//     <div className="flex h-full flex-col bg-slate-50">
//       <div className="border-b bg-white px-6 py-4 flex justify-between items-center">
//         <h1 className="text-sm font-semibold text-slate-900">SOP Intelligence (Admin Mode)</h1>
//       </div>

//       <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
//         {messages.map((msg, i) => (
//           <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
//             <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
//               {msg.role === "assistant" ? (
//                 msg.type === "suggestions" ? (
//                   <div className="flex flex-col space-y-3">
//                     <p className="font-medium flex items-center gap-2">
//                       <HelpCircle className="w-4 h-4 text-orange-500" />
//                       {msg.content}
//                     </p>
//                     <div className="flex flex-col gap-2">
//                       {msg.suggestions.map((sug, idx) => (
//                         <button
//                           key={idx}
//                           onClick={() => handleAsk(sug, false)} 
//                           className="text-left px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
//                         >
//                           "{sug}"
//                         </button>
//                       ))}
                      
//                       <button
//                         onClick={() => handleAsk(msg.originalQuestion, true)} 
//                         className="flex items-center gap-2 text-left px-3 py-2 text-sm border border-transparent rounded-lg hover:bg-slate-100 text-slate-500 transition-colors mt-2"
//                       >
//                         <ArrowRight className="w-4 h-4" />
//                         None of these, search anyway.
//                       </button>
//                     </div>
//                   </div>
//                 ) : (
//                   <div>
//                     <ReactMarkdown
//                       remarkPlugins={[remarkGfm]}
//                       components={{
//                         p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
//                         ul: ({ children }) => <ul className="ml-5 list-disc space-y-1 mb-2">{children}</ul>,
//                         ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1 mb-2">{children}</ol>,
//                         li: ({ children }) => <li>{children}</li>,
//                         strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
//                       }}
//                     >
//                       {msg.content}
//                     </ReactMarkdown>

//                     {/* NEW: Admin Validation Block */}
//                     {msg.type === "answer" && (
//                       <div className="mt-4">
//                         {msg.isApproved ? (
//                           <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex flex-col gap-1.5">
//                             <div className="flex items-center gap-1.5 font-semibold">
//                               <CheckCircle className="w-4 h-4 text-emerald-600" />
//                               Approved Answer
//                             </div>
//                             {msg.adminComment && (
//                               <p className="text-emerald-700 mt-1">
//                                 <span className="font-medium">Admin Note:</span> {msg.adminComment}
//                               </p>
//                             )}
//                           </div>
//                         ) : (
//                           <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
//                             <input
//                               type="text"
//                               placeholder="Add an admin comment (optional)..."
//                               value={commentDrafts[i] || ""}
//                               onChange={(e) => setCommentDrafts({ ...commentDrafts, [i]: e.target.value })}
//                               className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
//                             />
//                             <button
//                               onClick={() => handleApprove(i, msg)}
//                               className="flex items-center justify-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors w-fit"
//                             >
//                               <Check className="w-4 h-4" />
//                               Validate & Approve
//                             </button>
//                           </div>
//                         )}
//                       </div>
//                     )}

//                     {msg.source === "cache" && (
//                       <span className="text-[10px] text-slate-400 mt-3 block border-t pt-2 border-slate-100">
//                         ⚡ Answered from Cache
//                       </span>
//                     )}
//                   </div>
//                 )
//               ) : (
//                 msg.content
//               )}
//             </div>
//           </div>
//         ))}

//         {loading && (
//           <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500 w-fit">
//             Thinking…
//           </div>
//         )}
//         <div ref={bottomRef} />
//       </div>

//       <div className="border-t bg-white px-6 py-4">
//         <div className="relative">
//           <input
//             value={question}
//             onChange={(e) => setQuestion(e.target.value)}
//             onKeyDown={(e) => e.key === "Enter" && handleAsk()}
//             placeholder="Ask a follow-up question…"
//             className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
//           />
//           <button
//             onClick={() => handleAsk()}
//             disabled={loading}
//             className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600 disabled:opacity-50"
//           >
//             <Sparkles className="h-4 w-4" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }





import { useState, useEffect, useRef } from "react";
import { Sparkles, Search, HelpCircle, ArrowRight, CheckCircle, Check, Trash2, DatabaseZap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function SOPIntelligenceAdmin() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_RAG_URL || "";

  const [commentDrafts, setCommentDrafts] = useState({});
  const bottomRef = useRef(null);

  // 👈 NEW: Fetch Admin test history on component mount
  useEffect(() => {
    fetchHistory("admin_tester");
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // 👈 NEW: Function to load previous admin chats
  // 👈 UPDATE THIS FUNCTION in both User and Admin components
  const fetchHistory = async (id) => {
    try {
      const res = await fetch(`${API_URL}/user/history/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      
      if (data && data.length > 0) {
        const historyMessages = [];
        data.forEach((item) => {
          historyMessages.push({ role: "user", content: item.question });
          
          // 👈 NEW: Check if this was a suggestion message
          if (item.suggestions && item.suggestions.length > 0) {
            historyMessages.push({
              role: "assistant",
              type: "suggestions",
              content: "I found similar questions in my memory. Did you mean one of these?",
              suggestions: item.suggestions,
              originalQuestion: item.question
            });
          } else {
            // Normal answer message
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
        setChatMode(true);
      }
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleClearCache = async () => {
    if(!window.confirm("Clear the Semantic Cache? This forces RAG for all queries.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/clear-cache`, { method: "POST" });
      const data = await res.json();
      alert(data.message);
    } catch (err) {
      alert("Error clearing cache");
    }
  };

  const handleClearAllHistory = async () => {
    if(!window.confirm("WARNING: Clear ALL user chat history? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_URL}/admin/clear-history`, { method: "POST" });
      const data = await res.json();
      alert(data.message);
      setMessages([]);
      setChatMode(false);
    } catch (err) {
      alert("Error clearing history");
    }
  };

  const handleAsk = async (queryOverride = null, skipCache = false) => {
    const currentQuestion = queryOverride || question;
    if (!currentQuestion.trim()) return;

    if (!chatMode) setChatMode(true);

    const displayQuestion = skipCache 
      ? `Search anyway: "${currentQuestion}"` 
      : currentQuestion;

    setMessages((prev) => [...prev, { role: "user", content: displayQuestion }]);
    
    if (!queryOverride) setQuestion(""); 
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/user/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: "admin_tester", // Admin test queries use this ID
          question: currentQuestion, 
          skip_cache: skipCache 
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
            originalQuestion: data.original_question || currentQuestion 
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
            question: currentQuestion
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

  const handleApprove = async (index, msg) => {
    const comment = commentDrafts[index] || "";
    try {
      const res = await fetch(`${API_URL}/admin/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: msg.question,
          answer: msg.content,
          admin_comment: comment,
        }),
      });

      if (res.ok) {
        setMessages((prev) => {
          const newMsgs = [...prev];
          newMsgs[index] = { 
            ...newMsgs[index], 
            isApproved: true, 
            adminComment: comment 
          };
          return newMsgs;
        });
        
        setCommentDrafts((prev) => {
          const newDrafts = { ...prev };
          delete newDrafts[index];
          return newDrafts;
        });
      }
    } catch (error) {
      console.error("Failed to approve answer:", error);
      alert("Failed to save approval.");
    }
  };

  /* ───────────────── LANDING PAGE ───────────────── */
  if (!chatMode) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-full max-w-3xl px-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">
              SOP Intelligence (Admin)
            </h1>
            <p className="mt-2 text-slate-500">
              Ask questions, analyze SOPs, validate answers, and generate insights instantly
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Test the system to validate answers…"
              className="w-full rounded-2xl border border-slate-300 bg-white py-4 pl-12 pr-14 text-sm shadow-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <button
              onClick={() => handleAsk()}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl bg-orange-500 p-2 text-white shadow hover:bg-orange-600"
            >
              <Sparkles className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────── CHAT PAGE ───────────────── */
  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b bg-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-sm font-semibold text-slate-900">SOP Intelligence (Admin Mode)</h1>
        
        <div className="flex gap-4">
          <button 
            onClick={handleClearCache}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            <DatabaseZap className="w-4 h-4" />
            Clear Cache
          </button>
          <button 
            onClick={handleClearAllHistory}
            className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All History
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xl rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "bg-orange-500 text-white" : "bg-white border border-slate-200 text-slate-800"}`}>
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
                          className="text-left px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors"
                        >
                          "{sug}"
                        </button>
                      ))}
                      
                      <button
                        onClick={() => handleAsk(msg.originalQuestion, true)} 
                        className="flex items-center gap-2 text-left px-3 py-2 text-sm border border-transparent rounded-lg hover:bg-slate-100 text-slate-500 transition-colors mt-2"
                      >
                        <ArrowRight className="w-4 h-4" />
                        None of these, search anyway.
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="ml-5 list-disc space-y-1 mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1 mb-2">{children}</ol>,
                        li: ({ children }) => <li>{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>

                    {msg.type === "answer" && (
                      <div className="mt-4">
                        {msg.isApproved ? (
                          <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-sm text-emerald-800 flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Approved Answer
                            </div>
                            {msg.adminComment && (
                              <p className="text-emerald-700 mt-1">
                                <span className="font-medium">Admin Note:</span> {msg.adminComment}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Add an admin comment (optional)..."
                              value={commentDrafts[i] || ""}
                              onChange={(e) => setCommentDrafts({ ...commentDrafts, [i]: e.target.value })}
                              className="w-full text-sm rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                            <button
                              onClick={() => handleApprove(i, msg)}
                              className="flex items-center justify-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors w-fit"
                            >
                              <Check className="w-4 h-4" />
                              Validate & Approve
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.source === "cache" && (
                      <span className="text-[10px] text-slate-400 mt-3 block border-t pt-2 border-slate-100">
                        ⚡ Answered from Cache
                      </span>
                    )}
                  </div>
                )
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm text-slate-500 w-fit">
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white px-6 py-4">
        <div className="relative">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            placeholder="Test another query…"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-12 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
          <button
            onClick={() => handleAsk()}
            disabled={loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-orange-500 p-2 text-white hover:bg-orange-600 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}