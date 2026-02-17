export default function Topbar() {
    return (
      <header className="h-16 bg-white border-b border-black/10 shadow-sm flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Online
        </div>
  
        <input
          className="w-96 rounded-lg bg-slate-100 px-4 py-2 text-sm outline-none"
          placeholder="Search SOP name..."
        />
  
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
              3
            </span>
            🔔
          </div>
  
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-300" />
            <div className="text-sm">
              <div className="font-medium">Admin User</div>
              <div className="text-xs text-slate-500">Administrator</div>
            </div>
          </div>
        </div>
      </header>
    );
  }
  