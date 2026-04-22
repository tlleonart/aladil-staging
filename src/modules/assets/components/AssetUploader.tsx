"use client";

import { FileText, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { orpc } from "@/modules/core/orpc/client";
import { useMutation } from "@/modules/core/orpc/react";

interface AssetUploaderProps {
  value?: string | null;
  onChange: (assetId: string | null) => void;
  accept?: string;
  folder?: string;
  type?: "IMAGE" | "PDF" | "OTHER";
  label?: string;
  description?: string;
  currentAsset?: {
    id: string;
    bucket?: string;
    path?: string;
    filename: string;
    url?: string | null;
  } | null;
}

export function AssetUploader({
  value,
  onChange,
  accept = "image/*",
  folder = "uploads",
  type = "IMAGE",
  label = "Subir archivo",
  description,
  currentAsset,
}: AssetUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => orpc.assets.remove({ id }),
  });

  // Build preview URL from current asset (Convex-resolved URL)
  const currentPreviewUrl = currentAsset?.url ?? null;

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      try {
        // Upload via server-side API (bypasses RLS)
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Error al subir archivo");
        }

        const { url, assetId } = await res.json();

        setPreviewUrl(url);
        onChange(assetId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al subir archivo";
        setError(message);
        console.error("Upload error:", err);
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    },
    [onChange],
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;

    try {
      // Delete asset record (storage cleanup can be handled separately)
      await deleteAssetMutation.mutateAsync(value);
      setPreviewUrl(null);
      onChange(null);
    } catch (err) {
      console.error("Delete error:", err);
      setError("Error al eliminar archivo");
    }
  }, [value, deleteAssetMutation, onChange]);

  const displayUrl = previewUrl || currentPreviewUrl;
  const isImage = type === "IMAGE";
  const isPdf = type === "PDF";

  return (
    <div className="space-y-3">
      {/* Preview */}
      {displayUrl && (
        <div className="relative group">
          {isImage ? (
            <div className="relative w-full max-w-xs aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img
                src={displayUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={deleteAssetMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          ) : isPdf ? (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <FileText className="h-8 w-8 text-red-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {currentAsset?.filename || "Documento PDF"}
                </p>
                <a
                  href={displayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Ver PDF
                </a>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={deleteAssetMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <FileText className="h-8 w-8 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {currentAsset?.filename || "Archivo"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={deleteAssetMutation.isPending}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload area */}
      {!displayUrl && (
        <label className="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">Subiendo...</p>
              </>
            ) : (
              <>
                {isImage ? (
                  <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                )}
                <p className="text-sm text-gray-600 font-medium">{label}</p>
                {description && (
                  <p className="text-xs text-gray-400 mt-1">{description}</p>
                )}
              </>
            )}
          </div>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Change button when there's already an asset */}
      {displayUrl && (
        <label className="inline-block">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            asChild
          >
            <span className="cursor-pointer">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-1" />
                  Cambiar archivo
                </>
              )}
            </span>
          </Button>
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
