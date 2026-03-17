import React from 'react';
import { Layers, DatabaseBackup, LayoutDashboard } from 'lucide-react';
import BackendService from '../components/BackendService'; // Adjust path if needed
// import RagServiceMonitor from '../components/RagServiceMonitor';
// import StorageServiceMonitor from '../components/StorageServiceMonitor';

export default function SystemMonitor() {
  return (
    <div className="bg-slate-50 min-h-full p-6 space-y-8 rounded-2xl border border-slate-200 shadow-sm">
      
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <LayoutDashboard className="h-7 w-7 text-blue-600" />
          Microservices Monitor
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Real-time health and telemetry data across all system infrastructure.
        </p>
      </div>

      {/* 1. CORE BACKEND SERVICE */}
      <section>
        <BackendService />
      </section>

      {/* 2. SECONDARY SERVICES GRID (RAG & Storage) */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 px-1">Ancillary Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* RAG Service Placeholder */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-dashed">
            <div className="flex items-center gap-3 mb-4 text-slate-500">
              <div className="p-2.5 bg-indigo-50 text-indigo-500 rounded-lg">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-700">RAG AI Service</h3>
            </div>
            <div className="text-sm text-slate-400 p-6 text-center bg-slate-50 rounded-lg">
              {/* <RagServiceMonitor /> */}
              Ready for RAG Component integration
            </div>
          </div>

          {/* Storage Service Placeholder */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-dashed">
            <div className="flex items-center gap-3 mb-4 text-slate-500">
              <div className="p-2.5 bg-orange-50 text-orange-500 rounded-lg">
                <DatabaseBackup className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-700">Storage Service</h3>
            </div>
            <div className="text-sm text-slate-400 p-6 text-center bg-slate-50 rounded-lg">
              {/* <StorageServiceMonitor /> */}
              Ready for Storage Component integration
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}