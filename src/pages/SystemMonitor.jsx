import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import BackendService from '../components/BackendService'; // Adjust path if needed
import RagServiceMonitor from '../components/RagServiceMonitor'; // Adjust path if needed
import StorageServiceMonitor from '../components/StorageServiceMonitor'; // Adjust path if needed

export default function SystemMonitor() {
  return (
    <div className="bg-slate-50 min-h-full p-6 space-y-8  border border-slate-200 shadow-sm">
      
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

      {/* 2. RAG AI SERVICE */}
      <section>
        <RagServiceMonitor />
      </section>

      {/* 3. STORAGE SERVICE */}
      <section>
        <StorageServiceMonitor />
      </section>

    </div>
  );
}