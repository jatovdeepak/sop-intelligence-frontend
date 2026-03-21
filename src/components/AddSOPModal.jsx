import { useState, useEffect } from "react";
import { X, ChevronDown, CheckCircle2, AlertCircle } from "lucide-react";

export default function AddSOPModal({ onClose, onSOPAdded }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); 
  const [availableSops, setAvailableSops] = useState([]);

  // Environment variables
  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const STORAGE_URL = import.meta.env.VITE_API_STORAGE_SERVER || "http://localhost:5001";
  
  // Form state tracking
  const [formData, setFormData] = useState({
    sopId: "",
    title: "",
    type: "",
    version: "v1.0",
    description: "",
    references: [], 
  });
  const [pdfFile, setPdfFile] = useState(null);

  // Fetch available SOPs for the dropdown when modal opens
  useEffect(() => {
    const fetchAvailableSOPs = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/sops`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableSops(data);
        }
      } catch (err) {
        console.error("Failed to fetch SOPs for references:", err);
      }
    };
    fetchAvailableSOPs();
  }, [API_URL]);

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

    if (!formData.sopId || !formData.title || !formData.type || !pdfFile) {
      showToast("error", "Please fill in all required fields and attach a PDF.");
      return;
    }

    setLoading(true);

    try {
      let fileUrl = "";
      let pdfbase64 = "";

      // STEP 1: Upload the file to the Storage Microservice
      const fileData = new FormData();
      fileData.append("file", pdfFile); // Note: field name "file" must match your multer config upload.single('file')

      const uploadRes = await fetch(`${STORAGE_URL}/api/upload`, {
        method: "POST",
        body: fileData,
      });

      const uploadJson = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadJson.error || "Failed to upload file to storage server");
      }

      // Extract the shiny new URL provided by the storage service
      fileUrl = uploadJson.url;
      pdfbase64 = uploadJson.pdfBase64;

      // STEP 2: Send the metadata AND the file URL to the main backend as JSON
      const sopData = {
        sopId: formData.sopId,
        title: formData.title,
        type: formData.type,
        version: formData.version,
        description: formData.description,
        references: formData.references, // JSON stringification is handled natively by body: JSON.stringify()
        status: "Active",
        requiredRoles: ["Operator"], // Using an array for roles
        pdfPath: fileUrl, // Save the absolute URL directly into the DB
        pdfPathBase64: pdfbase64
      };

      const token = sessionStorage.getItem("token");

      const response = await fetch(`${API_URL}/api/sops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // Switching to JSON since we aren't sending files here anymore
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify(sopData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to add SOP");
      }

      showToast("success", "SOP added successfully!");
      if (onSOPAdded) onSOPAdded(result);
      
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err) {
      showToast("error", err.message);
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

          <h2 className="text-lg font-semibold text-slate-900">Add SOP</h2>
          <p className="mt-1 text-sm text-slate-500">
            Fill in the details below to add a new Standard Operating Procedure.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  SOP ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="sopId"
                  value={formData.sopId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., SOP-025"
                  required
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter SOP name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Type of SOP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Quality">Quality</option>
                    <option value="Production">Production</option>
                    <option value="Safety">Safety</option>
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
                  className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                    const sop = availableSops.find((s) => s.sopId === refId);
                    return (
                      <span
                        key={refId}
                        className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800"
                      >
                        {sop ? `${sop.sopId} - ${sop.title}` : refId}
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
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  onChange={handleAddReference}
                  value="" // Always reset to default after selection
                >
                  <option value="" disabled>Select an SOP to reference...</option>
                  {availableSops
                    .filter((sop) => !formData.references.includes(sop.sopId)) // Hide already selected SOPs
                    .map((sop) => (
                      <option key={sop._id} value={sop.sopId}>
                        {sop.sopId} - {sop.title}
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
                className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter SOP description..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Attach SOP Document <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  required
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:rounded-md file:border-0
                    file:bg-white file:px-3 file:py-1
                    file:text-sm file:font-medium file:text-slate-700
                    file:shadow hover:file:bg-slate-50"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Add SOP"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}