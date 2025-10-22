"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

const VIDEO_SRC = "/assets/video/night-shift.mp4";
const POSTER_SRC = "/assets/video/night-shift-poster.jpg";

function useAssetAvailability(path: string) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkAsset() {
      try {
        const response = await fetch(path, { method: "HEAD" });
        if (!cancelled) {
          setAvailable(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
        }
      }
    }

    void checkAsset();

    return () => {
      cancelled = true;
    };
  }, [path]);

  return available;
}

export function NightShiftMedia() {
  const videoAvailable = useAssetAvailability(VIDEO_SRC);
  const posterAvailable = useAssetAvailability(POSTER_SRC);

  const poster = useMemo(
    () => (posterAvailable ? POSTER_SRC : undefined),
    [posterAvailable],
  );

  if (videoAvailable) {
    return (
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl border border-brisa-200 shadow-inner dark:border-brisa-700">
        <video
          className="h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          controls
          poster={poster}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
          Tu navegador no soporta la reproducción de video.
        </video>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-dashed border-brisa-200 bg-brisa-50/70 p-6 text-brisa-600 shadow-sm dark:border-brisa-800 dark:bg-brisa-900/40 dark:text-brisa-200">
      <h3 className="text-xl font-semibold">B-roll nocturno en camino</h3>
      <p className="mt-3 text-sm leading-relaxed text-brisa-500 dark:text-brisa-300">
        Este espacio mostrará el video vertical del turno nocturno (#60). Usa
        clip 9:16 (1080×1920) con duración de 60–90 segundos y exporta una
        miniatura 4:5 para versiones sociales.
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-brisa-400 dark:text-brisa-500">
        Fecha objetivo: 27-oct-2025
      </p>
      <Image
        src="/assets/mockups/16-9/portal-dashboard-1920w.webp"
        alt="Referencia del portal operacional"
        width={1280}
        height={720}
        className="mt-6 h-auto w-full rounded-2xl opacity-20"
      />
      <p className="mt-4 text-xs text-brisa-400 dark:text-brisa-500">
        Cuando el video final esté listo, súbelo a `public/assets/video` con el
        nombre `night-shift.mp4` y una imagen `night-shift-poster.jpg`. Este
        bloque se actualizará automáticamente.
      </p>
    </div>
  );
}
