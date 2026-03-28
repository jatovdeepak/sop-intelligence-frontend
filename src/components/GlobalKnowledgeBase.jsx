import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

const GlobalKnowledgeBase = () => {
  // API Endpoints
  const MAIN_API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ type: null, message: "" });

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I am connected to the entire SOP database. What procedure can I help you find today?" }
  ]);
  const [input, setInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // ==============================
  // SYNC HANDLER
  // ==============================
  const handleGlobalSync = async () => {
    setIsSyncing(true);
    setSyncStatus({ type: "info", message: "Fetching latest SOPs from database..." });

    try {
      // 1. Fetch SOPs from Node.js backend
      const token = sessionStorage.getItem("token"); // Ensure token is available
      const dbResponse = await fetch(`${MAIN_API_URL}/api/sops`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!dbResponse.ok) throw new Error("Failed to fetch SOPs from the database.");
      const allSops = await dbResponse.json();

      // Filter for active SOPs
      const activeSops = allSops.filter(sop => sop.status === "Active");

      if (activeSops.length === 0) {
        setSyncStatus({ type: "warning", message: "No active SOPs found to sync." });
        setIsSyncing(false);
        setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);
        return;
      }

      setSyncStatus({ 
        type: "info", 
        message: `Found ${activeSops.length} active SOPs. Building global vector database...` 
      });

      // 2. Send to Python RAG backend
      const ragResponse = await fetch(`${RAG_API_URL}/api/bulk-global-embed`, {
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
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSyncStatus({ type: null, message: "" }), 5000);

    } catch (error) {
      console.error("Sync Error:", error);
      setSyncStatus({ type: "error", message: error.message });
    } finally {
      setIsSyncing(false);
    }
  };

  // ==============================
  // CHAT HANDLER
  // ==============================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const userText = input.trim();
    setInput("");
    
    // Add User Message to UI
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`${RAG_API_URL}/user/global-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: "user_123", // Replace with real user ID from your auth context
          question: userText,
          available_sops: [] 
        })
      });

      if (!response.ok) throw new Error("Network response was not ok");
      
      const data = await response.json();
      
      // Add AI Response to UI
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: data.data,
        media: data.media,
        pages: data.page_numbers
      }]);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Sorry, I encountered an error connecting to the Global Database." 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[650px] w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-200 mt-6">
      
      {/* HEADER WITH SYNC BUTTON */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          Global SOP Search
        </div>
        
        <button
          onClick={handleGlobalSync}
          disabled={isSyncing}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors duration-200 flex items-center shadow-sm ${
            isSyncing 
              ? "bg-blue-500 cursor-not-allowed opacity-80" 
              : "bg-blue-700 hover:bg-blue-800"
          }`}
          title="Sync latest SOPs to the RAG Vector Database"
        >
          {isSyncing && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isSyncing ? "Syncing Database..." : "Sync Database"}
        </button>
      </div>

      {/* STATUS BANNER */}
      {syncStatus.message && (
        <div className={`px-4 py-2 text-sm text-center border-b ${
          syncStatus.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
          syncStatus.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
          syncStatus.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
          'bg-blue-50 text-blue-700 border-blue-200'
        }`}>
          {syncStatus.message}
        </div>
      )}

      {/* CHAT MESSAGES AREA */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
            }`}>
              
              {msg.role === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <div className="prose prose-sm prose-blue max-w-none">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                  
                  {/* Optional: Render Citations/Pages at bottom of AI message */}
                  {msg.pages && msg.pages.length > 0 && (
                     <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                       <strong className="text-gray-600">Referenced Documents & Pages:</strong> {msg.pages.join(' | ')}
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm rounded-bl-none">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white rounded-b-lg flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question across all active SOPs..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isChatLoading || isSyncing}
        />
        <button 
          type="submit" 
          disabled={isChatLoading || !input.trim() || isSyncing}
          className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Send
        </button>
      </form>

    </div>
  );
};

export default GlobalKnowledgeBase;