import { useState } from "react";
import SOPIntelligenceUser from "./SOPIntelligenceUser";
import SOPIntelligenceAdmin from "./SOPIntelligenceAdmin";

export default function SOPIntelligence() {
    const [userRole, setUserRole] = useState("user");
  
    return (
      /* 1. h-full ensures it fills the container provided by your sidebar layout.
         2. overflow-hidden prevents this specific component from creating a page scroll.
      */
      <div className="flex h-full flex-col overflow-hidden bg-white">
        
        {/* Role Switch - Fixed height (flex-none) */}
        <div className="flex-none p-4">
          <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setUserRole("user")}
              className={`px-4 py-2 text-sm transition ${
                userRole === "user" ? "bg-orange-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              User
            </button>
            <button
              onClick={() => setUserRole("admin")}
              className={`px-4 py-2 text-sm transition ${
                userRole === "admin" ? "bg-orange-500 text-white" : "bg-white text-gray-700"
              }`}
            >
              Admin
            </button>
          </div>
        </div>
  
        {/* 3. Chat Container - flex-1 tells it to take ALL remaining space.
           4. overflow-hidden is vital here so the child handles the scrolling.
        */}
        <div className="flex-1 overflow-hidden relative border-t border-gray-100">
          {userRole === "user" ? (
            <SOPIntelligenceUser />
          ) : (
            <SOPIntelligenceAdmin />
          )}
        </div>
      </div>
    );
  }