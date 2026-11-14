import { useState } from "react";
import { uploadProject } from "../services/api";

export default function FileUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first!");
      return;
    }

    setLoading(true);

    try {
      const data = await uploadProject(file);
      setResult(data);
      
      // Notify parent component (App.jsx) with the new project_id
      if (onUploadSuccess) {
        onUploadSuccess(data.project_id);
      }
    } catch (error) {
      alert(
        error.response?.data?.detail ||
        error.message ||
        "Upload failed. Check if backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-slate-900 text-white">
      <h2 className="text-xl font-bold mb-4">
        Upload Legacy Project
      </h2>

      <input
        type="file"
        onChange={(e) => {
          setFile(e.target.files?.[0] || null);
        }}
        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-4 px-5 py-2 rounded bg-blue-600 font-semibold disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Uploading..." : "Upload Project"}
      </button>

      {result && (
        <p className="mt-4 text-green-400">
          Project ID: {result.project_id} (Ready for Analysis!)
        </p>
      )}
    </div>
  );
}