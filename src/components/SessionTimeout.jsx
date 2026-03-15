import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function SessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [token, setToken] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const API_URL = import.meta.env.VITE_API_BASE_URL || "";

  // Sync token when route changes
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, [location]);

  // Listen for login token updates
  useEffect(() => {
    const updateToken = () => {
      const newToken = localStorage.getItem("token");
      setToken(newToken);
    };

    window.addEventListener("tokenUpdated", updateToken);

    return () => {
      window.removeEventListener("tokenUpdated", updateToken);
    };
  }, []);

  const getTokenExp = () => {
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000;
    } catch {
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setShowWarning(false);
    navigate("/login");
  };

  const handleExtendSession = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/extend-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        handleLogout();
        return;
      }

      const data = await res.json();

      localStorage.setItem("token", data.token);
      window.dispatchEvent(new Event("tokenUpdated"));

      setShowWarning(false);
      setCountdown(10);
    } catch {
      handleLogout();
    }
  };

  useEffect(() => {
    const expTime = getTokenExp();
    if (!expTime) return;

    const now = Date.now();
    const timeRemaining = expTime - now;

    if (timeRemaining <= 0) {
      handleLogout();
      return;
    }

    const warnBefore = 10000;
    const delay = Math.max(timeRemaining - warnBefore, 0);

    const timer = setTimeout(() => {
      setShowWarning(true);
      setCountdown(10);
    }, delay);

    return () => clearTimeout(timer);
  }, [token]);

  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold">Session Expiring</h3>

        <p className="mt-2 text-sm text-gray-600">
          You will be logged out in <b>{countdown}</b> seconds.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={handleLogout}
            className="rounded px-3 py-2 text-sm bg-gray-200"
          >
            Logout
          </button>

          <button
            onClick={handleExtendSession}
            className="rounded px-3 py-2 text-sm text-white bg-orange-500"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}