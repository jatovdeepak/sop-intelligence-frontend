import {
  Download,
  Printer,
  Save,
  X,
  FileText,
  CheckCircle,
  AlertTriangle,
  Pencil,
} from "lucide-react";

export default function FDAComplianceAnalysis({ sop, onClose }) {
  console.log("sop", sop);
  return (
    <div className="flex h-full flex-col">
      {/* HEADER — MATCHES FIGMA */}
      <div className="flex items-center justify-between bg-blue-50 px-6 py-4 border-b">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900">
              FDA Compliance Analysis
            </h1>
            <p className="text-sm text-slate-500">
              {sop?.id ?? "SOP-001"} · {sop?.name ?? "Equipment Calibration"}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          <HeaderButton icon={Download} label="Export PDF" />
          <HeaderButton icon={Printer} label="Print" />
          <HeaderButton icon={Save} label="Save" />
          <button
            onClick={onClose}
            className="ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6">
        {/* Score */}
        <div className="rounded-xl bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-slate-900">
              Overall Compliance Score
            </h2>
            <div className="text-right">
              <div className="text-3xl text-blue-600">92%</div>
              <div className="text-sm text-slate-500">Compliance Rating</div>
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded bg-slate-200">
            <div className="h-2 w-[92%] rounded bg-slate-900" />
          </div>

          <div className="mt-6 grid grid-cols-4 gap-4 text-center">
            <Stat label="Compliant" value="8" color="text-green-600" />
            <Stat label="Minor Issues" value="2" color="text-amber-500" />
            <Stat label="Major Issues" value="0" color="text-orange-500" />
            <Stat label="Critical" value="0" color="text-red-600" />
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-200" />

        {/* Summary of Findings */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-900">
              Summary of Findings
            </h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <Pencil className="h-4 w-4" />
              Add Note
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              The Equipment Calibration SOP demonstrates strong alignment with
              FDA 21 CFR Part 211.68 requirements for equipment calibration and
              maintenance. The document provides comprehensive procedures for
              ensuring equipment accuracy and reliability.
            </p>

            <p className="mt-3 text-sm text-slate-600">
              Key strengths include well-defined calibration intervals, detailed
              documentation requirements, and clear responsibility assignments.
              The SOP effectively addresses traceability requirements and
              includes proper deviation handling procedures.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-200" />

        {/* Applicable FDA Regulations */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-900">
              Applicable FDA Regulations
            </h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <Pencil className="h-4 w-4" />
              Add Note
            </button>
          </div>

          <div className="space-y-4">
            <RegulationCard
              title="21 CFR Part 211.68 - Automatic, Mechanical, and Electronic Equipment"
              description="Requirements for equipment calibration, inspection, and maintenance to ensure proper performance."
              status="Compliant"
            />

            <RegulationCard
              title="21 CFR Part 211.160 - General Requirements (Laboratory Controls)"
              description="Calibration of instruments, apparatus, gauges, and recording devices at suitable intervals."
              status="Compliant"
            />

            <RegulationCard
              title="21 CFR Part 11 - Electronic Records"
              description="Requirements for electronic signatures and records in calibration documentation."
              status="Partial Compliance"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-200" />

        {/* Detailed Observations */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-900">
              Detailed Observations
            </h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <Pencil className="h-4 w-4" />
              Add Note
            </button>
          </div>

          <div className="space-y-4">
            <ObservationCard
              status="ok"
              title="Calibration Frequency"
              description="Well-defined calibration schedules with appropriate frequencies based on equipment criticality and manufacturer recommendations."
              recommendation="Continue current practice. Consider annual review of calibration frequencies."
            />

            <ObservationCard
              status="ok"
              title="Documentation Requirements"
              description="Comprehensive documentation practices including calibration certificates, deviation reports, and trend analysis."
              recommendation="Maintain current documentation standards."
            />

            <ObservationCard
              status="warn"
              title="Electronic Record Management"
              description="Current procedure primarily addresses paper-based records. Limited guidance for electronic calibration records and digital signatures."
              recommendation="Expand Section 5.2 to include specific requirements for electronic records per 21 CFR Part 11."
            />

            <ObservationCard
              status="ok"
              title="Personnel Training"
              description="Clear requirements for personnel qualifications and training documentation."
              recommendation="No changes required."
            />

            <ObservationCard
              status="warn"
              title="Risk Assessment"
              description="While equipment criticality is mentioned, formal risk assessment methodology could be more detailed."
              recommendation="Consider adding a risk-based approach section referencing ICH Q9 principles."
            />

            <ObservationCard
              status="ok"
              title="CAPA Integration"
              description="Appropriate linkage to Corrective and Preventive Action system for calibration failures."
              recommendation="Continue current practice."
            />
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-200" />

        {/* Conclusion */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-900">Conclusion</h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <Pencil className="h-4 w-4" />
              Add Note
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">
              This SOP demonstrates strong compliance with FDA calibration
              requirements. The procedure is well-structured, comprehensive, and
              aligned with current good manufacturing practices (cGMP).
            </p>

            <p className="mt-3 text-sm text-slate-600">
              The identified minor issues are not critical but addressing them
              would enhance the SOP&apos;s robustness and ensure full compliance
              with electronic records requirements. The overall framework is
              solid and provides adequate controls for equipment calibration.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-200" />

        {/* Final Recommendation */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-medium text-slate-900">
              Final Recommendation
            </h3>
            <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <Pencil className="h-4 w-4" />
              Add Note
            </button>
          </div>

          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-slate-800">
              <strong>Overall Assessment:</strong> APPROVED with minor
              enhancements recommended
            </p>

            <div className="mt-4 text-sm text-slate-700">
              <p className="font-medium">Priority Actions:</p>
              <ol className="mt-2 list-decimal pl-5 space-y-1">
                <li>
                  <strong>Medium Priority:</strong> Enhance electronic records
                  section to fully address 21 CFR Part 11 requirements (Target:
                  60 days)
                </li>
                <li>
                  <strong>Low Priority:</strong> Incorporate formal risk
                  assessment methodology section (Target: 90 days)
                </li>
              </ol>
            </div>

            <div className="mt-4 text-sm text-slate-700">
              <p className="font-medium">Maintenance:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Annual review of calibration frequencies and intervals</li>
                <li>
                  Quarterly trending of calibration data for continuous
                  improvement
                </li>
                <li>Regular training updates as procedures evolve</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-slate-200" />

        {/* Notes */}
        <div className="mt-6">
          <h3 className="mb-2 font-medium">General Notes</h3>
          <textarea
            className="w-full rounded-lg border p-3 text-sm"
            placeholder="Add general notes about this compliance analysis..."
          />
          <button className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">
            Save General Notes
          </button>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-slate-400">
          Report generated on 1/31/2026
        </div>
      </div>
    </div>
  );
}

/* ---------- Header Button ---------- */

function HeaderButton({ icon: Icon, label }) {
  return (
    <button className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ---------- Shared Components ---------- */

function Section({ title, children }) {
  return (
    <div className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <Pencil className="h-4 w-4 text-slate-400" />
      </div>
      <div className="rounded-xl border bg-white p-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div className={`text-2xl ${color}`}>{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );
}

function ObservationCard({ status, title, description, recommendation }) {
  const isOk = status === "ok";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isOk
          ? "border-green-300 bg-green-50"
          : "border-amber-300 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2 font-medium text-slate-900">
        {isOk ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        )}
        {title}
      </div>

      <p className="mt-2 text-sm text-slate-700">
        {description}
      </p>

      <div className="mt-4 rounded-lg border border-slate-300 bg-white p-3">
        <p className="text-xs font-medium text-slate-500">
          Recommendation:
        </p>
        <p className="mt-1 text-sm text-slate-700">
          {recommendation}
        </p>
      </div>
    </div>
  );
}


function RegulationCard({ title, description, status }) {
  const partial = status !== "Compliant";

  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h4 className="text-sm font-medium text-slate-900">{title}</h4>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>

      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
          partial
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function RegRow({ title, status }) {
  const isPartial = status !== "Compliant";
  return (
    <div className="mb-2 flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{title}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-medium ${
          isPartial
            ? "bg-amber-100 text-amber-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function Observation({ title, status, note }) {
  const ok = status === "ok";
  return (
    <div
      className={`mb-4 rounded-xl border p-4 ${
        ok ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-center gap-2 font-medium">
        {ok ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        )}
        {title}
      </div>
      <p className="mt-2 text-sm text-slate-600">Recommendation: {note}</p>
    </div>
  );
}
