import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ImageUpload({
  currentImageUrl,
  onUpload,
  isUploading,
  type = "profile", // "profile" or "cover"
  label,
}) {
  const [preview, setPreview] = useState(currentImageUrl);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload an image file (JPG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      await onUpload(file);
      toast.success(`${label} uploaded successfully`);
    } catch (error) {
      toast.error(error?.message || `Failed to upload ${label.toLowerCase()}`);
      setPreview(currentImageUrl); // Revert preview on error
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const aspectRatio = type === "cover" ? "aspect-[3/1]" : "aspect-square";
  const size = type === "cover" ? "w-full h-48" : "w-32 h-32";

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-900 dark:text-white">{label}</label>}
      
      <div className="relative">
        <div
          className={`${size} ${aspectRatio} rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center`}
        >
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <Camera className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">No {label?.toLowerCase()}</p>
            </div>
          )}
        </div>

        {preview && !isUploading && (
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex-1 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {preview ? "Change" : "Upload"}
            </>
          )}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
