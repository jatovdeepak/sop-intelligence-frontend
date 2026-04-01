import { useState, useEffect } from "react";
import { X, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";
import { SOP_API } from "../services/api-service"; // <-- NEW IMPORT

export default function EditSOPModal({ sop, onClose, onSOPEdited }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); 
  const [availableSops, setAvailableSops] = useState([]);

  // Environment variables
  const STORAGE_URL = import.meta.env.VITE_API_STORAGE_SERVER || "http://localhost:5001";
  
  // Form state tracking initialized with the existing SOP data
  const [formData, setFormData] = useState({
    title: sop.title || "",
    type: sop.type || "",
    version: sop.version || "v1.0",
    description: sop.description || "",
    status: sop.status || "Draft",
    references: sop.references || [], // Array holding selected SOP IDs
  });
  const [pdfFile, setPdfFile] = useState(null);

  // Fetch available SOPs for the dropdown when modal opens
  useEffect(() => {
    const fetchAvailableSOPs = async () => {
      try {
        // Use the optimized metadata endpoint via api-service
        const response = await SOP_API.getAllMetadata();
        
        // Filter out the current SOP so it can't reference itself
        setAvailableSops(response.data.filter(s => s._id !== sop._id));
      } catch (err) {
        console.error("Failed to fetch SOPs for references:", err);
      }
    };
    fetchAvailableSOPs();
  }, [sop._id]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Handle text inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input
  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  // Handle adding a reference from the dropdown
  const handleAddReference = (e) => {
    const selectedSopId = e.target.value;
    if (selectedSopId && !formData.references.includes(selectedSopId)) {
      setFormData({
        ...formData,
        references: [...formData.references, selectedSopId],
      });
    }
  };

  // Handle removing a reference pill
  const removeReference = (idToRemove) => {
    setFormData({
      ...formData,
      references: formData.references.filter((id) => id !== idToRemove),
    });
  };

  // Submit to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast(null);

    // PDF is no longer required for edits, but title and type are
    if (!formData.title || !formData.type) {
      showToast("error", "Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      // Default to existing PDF data from the SOP prop
      let fileUrl = sop.pdfPath;
      let pdfbase64 = sop.pdfPathBase64;

      // STEP 1: If the user selected a new file, upload it to the Storage Microservice
      // We keep raw fetch here because it targets a separate STORAGE_URL microservice
      if (pdfFile) {
        const fileUploadData = new FormData();
        fileUploadData.append("file", pdfFile); // "file" must match multer config on storage server

        const uploadRes = await fetch(`${STORAGE_URL}/api/upload`, {
          method: "POST",
          body: fileUploadData,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadJson.error || "Failed to upload new file to storage server");
        }

        fileUrl = uploadJson.url;
        pdfbase64 = uploadJson.pdfBase64;
      }

      // STEP 2: Structure the data as standard JSON, matching the Add modal
      const sopData = {
        title: formData.title,
        type: formData.type,
        version: formData.version,
        description: formData.description,
        status: formData.status,
        references: formData.references,
        requiredRoles: sop.requiredRoles, // Preserve existing roles
        pdfPath: fileUrl, // Will be the new URL or the old one
        pdfPathBase64: pdfbase64 
      };

      // STEP 3: Send as application/json to main API via api-service
      const response = await SOP_API.updateSOP(sop._id, sopData);
      const result = response.data;

      showToast("success", "SOP updated successfully!");
      if (onSOPEdited) onSOPEdited(result);
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      // Handle Axios error structure
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update SOP";
      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div 
          className={`fixed right-4 top-4 z-[70] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 ${
            toast.type === "success" 
              ? "border border-green-200 bg-green-50 text-green-800" 
              : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          {toast.message}
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="relative w-[520px] rounded-2xl bg-white p-6 shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-lg font-semibold text-slate-900">Edit SOP</h2>
          <p className="mt-1 text-sm text-slate-500">
            Update the details for {sop.sopId}.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-500">
                  SOP ID (Read-only)
                </label>
                <input
                  name="sopId"
                  value={sop.sopId}
                  disabled
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  SOP Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter SOP name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Quality">Quality</option>
                    <option value="Production">Production</option>
                    <option value="Safety">Safety</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <div className="relative">
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Version</label>
                <input
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Referenced SOPs Multi-Select Dropdown */}
            <div>
              <label className="mb-2 block text-sm font-medium">Referenced SOPs</label>
              
              {/* Selected SOP Pills */}
              {formData.references.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {formData.references.map((refId) => {
                    const foundSop = availableSops.find((s) => s.sopId === refId);
                    return (
                      <span
                        key={refId}
                        className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800"
                      >
                        {foundSop ? `${foundSop.sopId} - ${foundSop.title}` : refId}
                        <button
                          type="button"
                          onClick={() => removeReference(refId)}
                          className="ml-1 flex h-4 w-4 items-center justify-center rounded-full hover:bg-orange-200"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Dropdown to add more SOPs */}
              <div className="relative">
                <select
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={handleAddReference}
                  value="" // Always reset to default after selection
                >
                  <option value="" disabled>Select an SOP to reference...</option>
                  {availableSops
                    .filter((s) => !formData.references.includes(s.sopId)) // Hide already selected SOPs
                    .map((s) => (
                      <option key={s._id} value={s.sopId}>
                        {s.sopId} - {s.title}
                      </option>
                    ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter SOP description..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Replace SOP Document (Optional)
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:rounded-md file:border-0
                    file:bg-white file:px-3 file:py-1
                    file:text-sm file:font-medium file:text-slate-700
                    file:shadow hover:file:bg-slate-100 cursor-pointer"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Leave blank to keep the existing PDF.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}