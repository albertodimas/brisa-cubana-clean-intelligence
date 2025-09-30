"use client";

import { useRef } from "react";
import { Button } from "@brisa/ui";

interface PhotoCaptureProps {
  photos: string[];
  onAddPhoto: (dataUrl: string) => void;
  onRemovePhoto: (index: number) => void;
}

export function PhotoCapture({
  photos,
  onAddPhoto,
  onRemovePhoto,
}: PhotoCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen válida");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onAddPhoto(dataUrl);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
          Fotos CleanScore™
        </p>
        <span className="text-xs text-neutral-500">{photos.length} fotos</span>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo}
                alt={`Evidencia ${index + 1}`}
                className="h-full w-full rounded-lg border border-white/10 object-cover"
              />
              <button
                type="button"
                onClick={() => onRemovePhoto(index)}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-rose-400 bg-rose-500 text-xs font-bold text-white shadow-lg transition hover:bg-rose-600 active:scale-90"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-8 text-center">
          <span className="text-3xl">📸</span>
          <p className="text-xs text-neutral-400">
            Captura fotos del resultado final para el reporte de calidad
          </p>
        </div>
      )}

      {/* Capture Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        intent="secondary"
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        {photos.length === 0 ? "Tomar primera foto" : "Agregar más fotos"}
      </Button>
    </div>
  );
}
