import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import GlobalKnowledgeBase from "./components/GlobalKnowledgeBase";
import VoiceInput from "./components/VoiceInput";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* <VoiceInput /> */}
    {/* <GlobalKnowledgeBase /> */}
    <App />
  </React.StrictMode>
);
