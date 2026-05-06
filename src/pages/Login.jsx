import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
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

        /*
          Auth token
        */
      
        sessionStorage.setItem(
          "token",
          data.token
        );
      
        /*
          Internal RBAC role
        */
      
        sessionStorage.setItem(
          "role",
          data.role
        );
      
        /*
          Human-readable role
        */
      
        sessionStorage.setItem(
          "roleLabel",
          data.role
        );
      
        /*
          Source system
        */
      
        sessionStorage.setItem(
          "system",
          "SOP Intelligence"
        );
      
        sessionStorage.setItem(
          "sop_user_id",
          data.userid
        );
      
        window.dispatchEvent(
          new Event("tokenUpdated")
        );
      
        navigate("/");
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server error. Please try again." , err);
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // Added pr-10 to prevent text from typing under the eye icon
                className="w-full rounded-xl border border-white/10 bg-white/5 p-3 pr-10 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-[#ff6b00] focus:outline-none focus:ring-1 focus:ring-[#ff6b00]"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  // Eye-off icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  // Eye icon
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
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