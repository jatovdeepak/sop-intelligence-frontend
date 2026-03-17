import React from 'react';
import { DatabaseBackup, AlertCircle } from 'lucide-react';

export default function StorageServiceMonitor() {
  return (
    <div className="space-y-6 text-left bg-slate-50 p-5 rounded-xl border border-slate-200">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-dashed">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DatabaseBackup className="h-6 w-6 text-orange-500" />
            Storage Service
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            Pending API Integration
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border bg-slate-50 text-slate-500 border-slate-200">
            <AlertCircle className="h-4 w-4" />
            STATUS: PENDING
          </span>
        </div>
      </div>

      {/* PLACEHOLDER CONTENT */}
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm border-dashed flex flex-col items-center justify-center text-center">
        <DatabaseBackup className="h-10 w-10 text-slate-300 mb-3" />
        <h3 className="font-medium text-slate-600">Storage Telemetry Not Yet Connected</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm">
          Ready for Storage Component integration. Add socket connections and metrics rendering logic here.
        </p>
      </div>
    </div>
  );
}