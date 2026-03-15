import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Example of using the env variable in Login.jsx
  const API_URL = import.meta.env.VITE_API_BASE_URL || "";

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT and role in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        window.dispatchEvent(new Event("tokenUpdated"));

        navigate("/"); // Redirect to dashboard
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    }
  };

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-[#101522]">
      {/* Decorative blurred blobs for the glassmorphism effect to refract */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-[#ff6b00]/20 opacity-60 mix-blend-screen blur-[100px] filter"></div>
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-500/20 opacity-60 mix-blend-screen blur-[100px] filter"></div>

      {/* Glassmorphic Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl">
        
        {/* Branding matching the dashboard */}
        <div className="mb-8 flex flex-col items-center text-center">
          {/* Scaled-up Logo Snippet */}
          <div className="mb-4 flex h-16 w-36 items-center justify-center rounded-2xl bg-white shadow-lg">
            <img src="/logo.png" alt="Arizon logo" className="h-10 w-28 object-contain" />
          </div>
          <p className="text-sm font-light tracking-wide text-gray-300">
            SOP Intelligence System
          </p>
        </div>

        <h2 className="mb-6 text-center text-xl font-medium text-white">Welcome Back</h2>
        
        {error && (
          <div className="mb-5 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-center text-sm text-red-200 backdrop-blur-md">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-200">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-200">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 w-full rounded-xl bg-[#ff6b00] p-3 font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#e56000] hover:shadow-[#ff6b00]/30"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}