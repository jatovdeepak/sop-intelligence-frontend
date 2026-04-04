import { useState, useEffect, useRef, useCallback } from "react";
import io from "socket.io-client";

// Use your environment API URL or default to localhost
const API_URL = import.meta.env.VITE_RAG_API_URL || "http://localhost:8000";
const socket = io(API_URL, { transports: ["websocket"] });

export function useSarvamService() {
  const [transcript, setTranscript] = useState("");
  const [translation, setTranslation] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  
  // --- NEW: TTS States ---
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  // --- NEW: Microphone Selection States ---
  const [availableMics, setAvailableMics] = useState([]);
  const [selectedMicId, setSelectedMicId] = useState("");

  // Use refs to securely hold completed sentences vs the current live sentence
  const finalTextRef = useRef("");
  const interimTextRef = useRef("");
  const finalTranslationRef = useRef("");
  const interimTranslationRef = useRef("");

  // Refs for recording
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // --- Refs for TTS streaming ---
  const audioChunksRef = useRef([]);
  const currentAudioRef = useRef(null);

  // --- NEW: Fetch available microphones on mount ---
  useEffect(() => {
    const fetchMics = async () => {
      try {
        // Request temporary audio permission FIRST. 
        // If we don't do this, the browser hides the real hardware names for privacy.
        const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        tempStream.getTracks().forEach(track => track.stop()); // Stop immediately

        // Now fetch the unmasked list of devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === "audioinput");
        
        setAvailableMics(audioInputs);

        // Auto-select the system default or the first available mic
        if (audioInputs.length > 0) {
          const defaultMic = audioInputs.find(mic => mic.deviceId === "default") || audioInputs[0];
          setSelectedMicId(defaultMic.deviceId);
        }
      } catch (err) {
        console.error("Failed to fetch microphones. Permission denied?", err);
      }
    };

    fetchMics();

    // Listen for if the user plugs in/unplugs a USB mic or headphones
    navigator.mediaDevices.addEventListener("devicechange", fetchMics);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", fetchMics);
    };
  }, []);

  useEffect(() => {
    // ---- Voice Handlers ----
    const handleTranscript = (data) => {
      interimTextRef.current = data.text;
      setTranscript((finalTextRef.current + " " + data.text).trim());
    };

    const handleTranscriptFinal = () => {
      if (interimTextRef.current) {
        finalTextRef.current = (finalTextRef.current + " " + interimTextRef.current).trim();
        interimTextRef.current = ""; 
        setTranscript(finalTextRef.current);
      }
    };

    const handleTranslation = (data) => {
      interimTranslationRef.current = data.text;
      setTranslation((finalTranslationRef.current + " " + data.text).trim());
    };

    const handleTranslationFinal = () => {
      if (interimTranslationRef.current) {
        finalTranslationRef.current = (finalTranslationRef.current + " " + interimTranslationRef.current).trim();
        interimTranslationRef.current = "";
        setTranslation(finalTranslationRef.current);
      }
    };

    // --- TTS Handlers ---
    const handleTTSChunk = (data) => {
      // Decode base64 to binary array
      const byteCharacters = atob(data.chunk);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      audioChunksRef.current.push(new Uint8Array(byteNumbers));
    };

    const handleTTSDone = () => {
      // Combine all chunks into an MP3 blob
      const blob = new Blob(audioChunksRef.current, { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      
      audio.onended = () => {
        setIsPlayingTTS(false);
        URL.revokeObjectURL(url); // Clean up memory
      };
      
      audio.play().catch(e => {
        console.error("Audio playback failed", e);
        setIsPlayingTTS(false);
      });
      
      audioChunksRef.current = []; // Reset for next time
    };

    // Attach listeners
    socket.on("transcript", handleTranscript);
    socket.on("transcript_final", handleTranscriptFinal);
    socket.on("translation", handleTranslation);
    socket.on("translation_final", handleTranslationFinal);
    socket.on("tts_audio_chunk", handleTTSChunk);
    socket.on("tts_audio_done", handleTTSDone);

    return () => {
      socket.off("transcript", handleTranscript);
      socket.off("transcript_final", handleTranscriptFinal);
      socket.off("translation", handleTranslation);
      socket.off("translation_final", handleTranslationFinal);
      socket.off("tts_audio_chunk", handleTTSChunk);
      socket.off("tts_audio_done", handleTTSDone);
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

  const resetData = useCallback(() => {
    setTranscript("");
    setTranslation("");
    finalTextRef.current = "";
    interimTextRef.current = "";
    finalTranslationRef.current = "";
    interimTranslationRef.current = "";
  }, []);

  const startRecording = async () => {
    resetData();
    setIsRecording(true);
    socket.emit("start_stt", {});

    try {
      // --- NEW: Apply the selected Mic ID to the audio constraints ---
      const audioConstraints = selectedMicId 
        ? { deviceId: { exact: selectedMicId } } 
        : true;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
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

  const stopRecording = useCallback(() => {
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

    // Force finalize any remaining interim text
    if (interimTextRef.current) {
      finalTextRef.current = (finalTextRef.current + " " + interimTextRef.current).trim();
      setTranscript(finalTextRef.current);
    }
    if (interimTranslationRef.current) {
      finalTranslationRef.current = (finalTranslationRef.current + " " + interimTranslationRef.current).trim();
      setTranslation(finalTranslationRef.current);
    }
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // --- TTS Functions ---
  const playTextToSpeech = useCallback((text, languageCode = "en-IN") => {
    // If already playing, stop it
    if (isPlayingTTS && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setIsPlayingTTS(false);
      return; 
    }

    setIsPlayingTTS(true);
    audioChunksRef.current = []; 
    socket.emit("speak_text", { text, language: languageCode });
  }, [isPlayingTTS]);

  const stopTTS = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsPlayingTTS(false);
  }, []);

  return {
    isRecording,
    transcript,
    translation,
    toggleRecording,
    stopRecording,
    resetData,
    playTextToSpeech,
    stopTTS,
    isPlayingTTS,
    
    // --- NEW: Export device states so the UI component can use them ---
    availableMics,
    selectedMicId,
    setSelectedMicId
  };
}