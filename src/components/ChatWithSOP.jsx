import { X, Send, Globe, Copy } from "lucide-react";

export default function ChatWithSOP({ sop, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-[900px] flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-2xl bg-orange-50 px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">
              ✨
            </div>
            <div>
              <h2 className="text-base font-semibold">Chat with SOP</h2>
              <p className="text-sm text-slate-500">
                {sop?.id ?? "SOP-001"} · {sop?.name ?? "Equipment Calibration"}
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-orange-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-white px-6 py-6 space-y-6">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[60%] rounded-2xl bg-orange-500 px-4 py-3 text-sm text-white">
              <p>What are the key steps in this SOP?</p>
              <div className="mt-1 text-right text-xs opacity-80">03:36 PM</div>
            </div>
          </div>

          {/* Assistant Message */}
          <div className="flex">
            <div className="max-w-[70%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
              <p className="mb-2 font-medium">
                This SOP outlines 5 key steps for equipment calibration:
              </p>

              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  <strong>Pre-calibration preparation</strong> – Ensure equipment
                  is clean and at proper temperature
                </li>
                <li>
                  <strong>Standard reference setup</strong> – Use certified
                  reference standards
                </li>
                <li>
                  <strong>Calibration procedure</strong> – Follow manufacturer
                  guidelines
                </li>
                <li>
                  <strong>Documentation</strong> – Record all measurements and
                  deviations
                </li>
                <li>
                  <strong>Post-calibration verification</strong> – Verify
                  equipment meets specifications
                </li>
              </ol>

              <p className="mt-3">
                All steps must be performed by qualified QA personnel.
              </p>

              <div className="mt-3 border-t pt-2 text-xs text-slate-500">
                <p>📎 Section 3.1, Paragraph 2</p>
                <p>📎 Section 3.2, Paragraph 1</p>
              </div>

              <div className="mt-2 flex justify-end">
                <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
            </div>
          </div>

          {/* User Message */}
          <div className="flex justify-end">
            <div className="max-w-[60%] rounded-2xl bg-orange-500 px-4 py-3 text-sm text-white">
              <p>Who is responsible for calibration?</p>
              <div className="mt-1 text-right text-xs opacity-80">03:46 PM</div>
            </div>
          </div>

          {/* Assistant Message */}
          <div className="flex">
            <div className="max-w-[70%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800">
              <p className="mb-2">
                According to Section 3.2, the QA team is responsible for all
                equipment calibration activities:
              </p>

              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Primary responsibility:</strong> QA Manager
                </li>
                <li>
                  <strong>Execution:</strong> Qualified QA Technicians (Level 2
                  or above)
                </li>
                <li>
                  <strong>Review & Approval:</strong> QA Director
                </li>
              </ul>

              <p className="mt-3">
                All personnel must have completed calibration training and hold
                valid certification.
              </p>

              <div className="mt-3 border-t pt-2 text-xs text-slate-500">
                📎 Section 3.2, Paragraph 4
              </div>

              <div className="mt-2 flex justify-end">
                <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="border-t px-6 py-3">
          <div className="mb-2 text-sm text-slate-500">Suggestions:</div>
          <div className="flex flex-wrap gap-2">
            <Suggestion text="What are the key steps in this SOP?" />
            <Suggestion text="Who is responsible for this procedure?" />
            <Suggestion text="What are the critical quality checkpoints?" />
          </div>
        </div>

        {/* Input */}
        <div className="border-t px-6 py-4">
          <div className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder={`Ask about ${sop?.id ?? "this SOP"}...`}
            />
            <Globe className="h-4 w-4 text-slate-400" />
            <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

function Suggestion({ text }) {
  return (
    <button className="rounded-full border px-3 py-1 text-xs text-slate-700 hover:bg-slate-100">
      {text}
    </button>
  );
}
