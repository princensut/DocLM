import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useFileValidation } from "../../hooks/useFileValidation";
import { Spinner } from "../../components/ui/Primitives";

export default function DocumentUploader({ onUpload, isUploading }) {
  const { validateFiles } = useFileValidation();
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleFiles = async (fileList) => {
    const { valid, errors: validationErrors } = validateFiles(fileList);
    setErrors(validationErrors);
    if (valid.length > 0) {
      await onUpload(valid);
    }
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {isUploading ? (
          <Spinner className="h-6 w-6 text-accent" />
        ) : (
          <UploadCloud size={28} className="text-text-muted" />
        )}
        <div>
          <p className="font-medium">
            {isUploading ? "Uploading…" : "Drop PDF or .txt files here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-text-muted">Up to 7MB per file · multiple files supported</p>
        </div>
      </div>
      {errors.length > 0 && (
        <div className="mt-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-sm text-danger">
              {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
