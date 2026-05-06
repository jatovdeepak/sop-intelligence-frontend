import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Topbar() {

  /*
    Human-readable role
  */

  const [userRoleLabel] = useState(() => {
    return (
      sessionStorage.getItem(
        "roleLabel"
      ) || "User"
    );
  });

  /*
    Source system
  */

  const [system] = useState(() => {
    return (
      sessionStorage.getItem(
        "system"
      ) || "SOP"
    );
  });

  const navigate = useNavigate();

  const handleLogout = () => {

    sessionStorage.clear();

    navigate("/login");
  };

  return (
    <header
      className="
        flex
        h-16
        items-center
        justify-between
        border-b
        border-black/10
        bg-white
        px-6
        shadow-sm
      "
    >

      <div
        className="
          flex
          items-center
          gap-2
          text-sm
          text-slate-500
        "
      />

      <input
        className="
          w-96
          rounded-lg
          bg-slate-100
          px-4
          py-2
          text-sm
          outline-none
          focus:border-blue-500
          focus:ring-1
          focus:ring-blue-500
        "
        placeholder="Search SOP name..."
      />

      <div
        className="
          flex
          items-center
          gap-6
        "
      >

        <div
          className="
            relative
            cursor-pointer
          "
        >
          <span
            className="
              absolute
              -right-1
              -top-1
              flex
              h-4
              w-4
              items-center
              justify-center
              rounded-full
              bg-red-500
              text-[10px]
              text-white
            "
          >
            3
          </span>

          <span
            role="img"
            aria-label="notifications"
            className="text-xl"
          >
            🔔
          </span>
        </div>

        <div
          className="
            flex
            items-center
            gap-3
            border-l
            border-slate-200
            pl-4
          "
        >

          {/* Avatar */}

          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-full
              bg-blue-100
              font-bold
              text-blue-600
            "
          >
            {userRoleLabel
              ?.charAt(0)
              ?.toUpperCase()}
          </div>

          <div className="text-sm">

            <div className="font-medium">
              {system}
            </div>

            <div
              className="
                text-xs
                text-slate-500
              "
            >
              {userRoleLabel}
            </div>

          </div>

          <button
            onClick={handleLogout}
            className="
              ml-2
              rounded-md
              bg-slate-100
              px-3
              py-1.5
              text-xs
              font-medium
              text-slate-600
              transition-colors
              hover:bg-red-50
              hover:text-red-600
            "
          >
            Logout
          </button>

        </div>

      </div>

    </header>
  );
}