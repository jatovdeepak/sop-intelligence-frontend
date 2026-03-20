import React from 'react';
import { useServiceStatus } from '../context/ServiceStatusContext'; // Adjust path as needed
import { 
  Activity, Layers, Database, Cpu, 
  Clock, Wifi, WifiOff 
} from 'lucide-react';

// Utility functions for formatting
const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 MB';
  const mb = bytes / 1024 / 1024;
  if (mb > 1024) return (mb / 1024).toFixed(2) + ' GB';
  return mb.toFixed(2) + ' MB';
};

const formatUptime = (seconds) => {
  if (!seconds) return '0s';
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
};

export default function RagServiceMonitor() {
  const { rag } = useServiceStatus();
  const { metrics, status: connectionStatus } = rag;

  if (!metrics && connectionStatus !== 'online') {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? (
            <Activity className="h-8 w-8 animate-pulse text-indigo-500" />
          ) : (
             <WifiOff className="h-8 w-8 text-red-500" />
          )}
          <p className="font-medium text-sm">
            {connectionStatus === 'connecting' || connectionStatus === 'reconnecting' 
              ? 'Connecting to RAG Service...' 
              : 'RAG Service Offline'}
          </p>
        </div>
      </div>
    );
  }

  const safeMetrics = metrics || {};
  const heapPercent = safeMetrics.memory ? 
    (safeMetrics.memory.heapUsed / safeMetrics.memory.heapTotal) * 100 : 0;

  return (
    <div className="space-y-6 text-left bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-[0_2px_8px_rgba(255,165,0,0.4)]">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-6 w-6 text-indigo-600" />
            RAG AI Service
          </h2>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> 
            Uptime: <span className="font-medium text-slate-700">{formatUptime(safeMetrics.uptime)}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border bg-white
            ${connectionStatus === 'online' ? 'text-emerald-700 border-emerald-200' : 
              connectionStatus === 'offline' ? 'text-red-700 border-red-200' : 
              'text-amber-700 border-amber-200'}`}>
            {connectionStatus === 'online' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            Status: {connectionStatus.toUpperCase()}
          </span>
          
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border bg-white
            ${connectionStatus === 'online' && safeMetrics?.db?.status === 'online' 
              ? 'text-emerald-700 border-emerald-200' 
              : 'text-red-700 border-red-200'}`}
          >
            <Database className="h-4 w-4" />
            ChromaDB: {connectionStatus === 'online' ? (safeMetrics?.db?.status?.toUpperCase() || 'UNKNOWN') : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU USAGE */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-lg">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">CPU Usage</h3>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-bold text-slate-800">
                {safeMetrics?.cpu?.usagePercent || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ease-out
                  ${(safeMetrics?.cpu?.usagePercent || 0) > 80 ? 'bg-red-500' : 
                    (safeMetrics?.cpu?.usagePercent || 0) > 60 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                style={{ width: `${safeMetrics?.cpu?.usagePercent || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* PROCESS MEMORY (RSS) */}
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-slate-700">
            <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">Process Memory</h3>
          </div>
          <div>
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800">
                  {formatBytes(safeMetrics?.memory?.heapUsed)}
                </span>
              </div>
              <span className="text-sm font-bold text-purple-600 pb-1">{heapPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="h-2.5 rounded-full bg-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${heapPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER METRICS */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-6 items-center text-sm">
        <span className="text-slate-500 font-medium">Model Status:</span>
        {safeMetrics?.modelLoaded ? (
           <span className="text-emerald-600 font-semibold">Loaded & Ready</span>
        ) : (
          <span className="text-slate-400">Awaiting query...</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span className="animate-pulse h-2 w-2 bg-indigo-500 rounded-full"></span>
          Live updating every 5s
        </div>
      </div>
    </div>
  );
}