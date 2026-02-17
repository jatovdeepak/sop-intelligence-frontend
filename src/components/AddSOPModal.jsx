import { X, ChevronDown } from "lucide-react";

export default function AddSOPModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-[520px] rounded-2xl bg-white p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-lg font-semibold text-slate-900">Add SOP</h2>
        <p className="mt-1 text-sm text-slate-500">
          Fill in the details below to add a new Standard Operating Procedure.
        </p>

        {/* Form */}
        <div className="mt-6 space-y-4">
          {/* SOP ID & Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                SOP ID <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., SOP-025"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                SOP Name <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
                placeholder="Enter SOP name"
              />
            </div>
          </div>

          {/* Type & Version */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Type of SOP <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm">
                  <option>Select type</option>
                  <option>Quality</option>
                  <option>Production</option>
                  <option>Safety</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Version</label>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
                value="v1.0"
                readOnly
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm"
              placeholder="Enter SOP description..."
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Attach SOP Document <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm">
              <button className="rounded-md bg-white px-3 py-1 text-sm shadow">
                Choose File
              </button>
              <span className="text-slate-500">No file chosen</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white">
            Add SOP
          </button>
        </div>
      </div>
    </div>
  );
}
