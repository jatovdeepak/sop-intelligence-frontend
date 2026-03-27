import React, { useState, useRef, useEffect } from "react";
import io from "socket.io-client";
import { Mic, Square, Send, Languages, Activity, MessageSquare } from "lucide-react";

const socket = io("http://localhost:8003", {
  transports: ["websocket"],
});

export default function VoiceInput() {
  const [text, setText] = useState("");
  const [liveTranslation, setLiveTranslation] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  // Use refs to securely hold completed sentences vs the current live sentence
  const finalTextRef = useRef("");
  const interimTextRef = useRef("");
  
  const finalTranslationRef = useRef("");
  const interimTranslationRef = useRef("");

  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    // ---- Voice Handlers ----
    const handleTranscript = (data) => {
      interimTextRef.current = data.text;
      setText((finalTextRef.current + " " + data.text).trim());
    };

    const handleTranscriptFinal = () => {
      if (interimTextRef.current) {
        finalTextRef.current = (finalTextRef.current + " " + interimTextRef.current).trim();
        interimTextRef.current = ""; // Reset for the next breath/sentence
        setText(finalTextRef.current);
      }
    };

    const handleTranslation = (data) => {
      interimTranslationRef.current = data.text;
      setLiveTranslation((finalTranslationRef.current + " " + data.text).trim());
    };

    const handleTranslationFinal = () => {
      if (interimTranslationRef.current) {
        finalTranslationRef.current = (finalTranslationRef.current + " " + interimTranslationRef.current).trim();
        interimTranslationRef.current = "";
        setLiveTranslation(finalTranslationRef.current);
      }
    };

    // ---- Manual Text Handler ----
    const handleTextTranslated = (data) => {
      setSubmittedData(prev => prev ? { ...prev, translation: data.text } : null);
    };

    // Attach listeners
    socket.on("transcript", handleTranscript);
    socket.on("transcript_final", handleTranscriptFinal);
    socket.on("translation", handleTranslation);
    socket.on("translation_final", handleTranslationFinal);
    socket.on("text_translated", handleTextTranslated);

    return () => {
      socket.off("transcript", handleTranscript);
      socket.off("transcript_final", handleTranscriptFinal);
      socket.off("translation", handleTranslation);
      socket.off("translation_final", handleTranslationFinal);
      socket.off("text_translated", handleTextTranslated);
    };
  }, []);

  const float32To16BitPCM = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  const bufferToBase64 = (int16Array) => {
    let binary = "";
    const bytes = new Uint8Array(int16Array.buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const startRecording = async () => {
    // Clear out old states for a fresh recording session
    setText("");
    setLiveTranslation("");
    finalTextRef.current = "";
    interimTextRef.current = "";
    finalTranslationRef.current = "";
    interimTranslationRef.current = "";
    setSubmittedData(null);
    setIsRecording(true);

    socket.emit("start_stt", {});

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = float32To16BitPCM(inputData);
        const base64Data = bufferToBase64(pcmData);

        socket.emit("audio_chunk", { chunk: base64Data });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error("Microphone access denied or failed:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    socket.emit("end_stt");
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Keep manual typing in sync with our refs
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    finalTextRef.current = val;
    interimTextRef.current = "";
  };

  const handleSend = () => {
    if (!text.trim() && !isRecording) return;

    if (isRecording) {
      stopRecording();
      // Force finalize any remaining interim text
      if (interimTextRef.current) {
        finalTextRef.current = (finalTextRef.current + " " + interimTextRef.current).trim();
      }
      if (interimTranslationRef.current) {
        finalTranslationRef.current = (finalTranslationRef.current + " " + interimTranslationRef.current).trim();
      }
    }

    const isManualText = !liveTranslation && text.trim().length > 0;

    setSubmittedData({
      original: finalTextRef.current || text,
      translation: isManualText ? "Translating text..." : (finalTranslationRef.current || liveTranslation),
    });

    if (isManualText) {
      socket.emit("translate_text", { text: text });
    }

    // Reset interface for the next interaction
    setText("");
    setLiveTranslation("");
    finalTextRef.current = "";
    interimTextRef.current = "";
    finalTranslationRef.current = "";
    interimTranslationRef.current = "";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4 font-sans">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">AI Voice & Text Translator</h2>
          <p className="text-gray-500 mt-2">Speak continuously or type in your native language.</p>
        </div>

        {/* Input Bar */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-200 p-2 flex items-end gap-2 transition-all hover:shadow-lg focus-within:shadow-lg focus-within:border-blue-400">
          
          <button
            onClick={toggleRecording}
            className={`flex-shrink-0 p-3 mb-1 rounded-full transition-colors duration-200 flex items-center justify-center
              ${
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            title={isRecording ? "Stop Recording" : "Start Voice Input"}
          >
            {isRecording ? <Square size={20} fill="currentColor" /> : <Mic size={20} />}
          </button>

          {/* Changed input to textarea to comfortably fit continuous dictation */}
          <textarea
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            disabled={isRecording}
            placeholder={isRecording ? "Listening continuously..." : "Type text or tap mic to speak..."}
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 px-2 py-3 text-lg disabled:opacity-60 resize-none min-h-[52px] max-h-[150px] overflow-y-auto"
            rows={1}
            style={{ fieldSizing: "content" }} // Modern CSS for auto-expanding height
          />

          <button
            onClick={handleSend}
            disabled={!text.trim() && !isRecording}
            className={`flex-shrink-0 p-3 mb-1 rounded-full transition-colors duration-200 flex items-center justify-center
              ${
                !text.trim() && !isRecording
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
              }`}
          >
            <Send size={20} className={text || isRecording ? "translate-x-0.5" : ""} />
          </button>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 mt-4 ml-4 text-sm text-red-500 font-medium">
            <Activity size={16} className="animate-pulse" />
            <span>Recording in progress... speak as long as you want.</span>
          </div>
        )}

        {/* Results Card */}
        {submittedData && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-gray-50/50 border-b border-gray-100">
              <div className="flex items-center gap-2 mb-2 text-gray-500">
                <MessageSquare size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Original Input</span>
              </div>
              <p className="text-gray-800 text-lg whitespace-pre-wrap">{submittedData.original}</p>
            </div>

            <div className="p-6 bg-blue-50/30">
              <div className="flex items-center gap-2 mb-2 text-blue-600">
                <Languages size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">English Translation</span>
              </div>
              <p className={`text-xl font-medium leading-relaxed whitespace-pre-wrap ${submittedData.translation === "Translating text..." ? "text-gray-400 animate-pulse" : "text-gray-900"}`}>
                {submittedData.translation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}