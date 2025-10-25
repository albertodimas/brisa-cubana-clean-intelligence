"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Play, X, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/cn";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export interface VideoSectionProps {
  /**
   * URL del video (YouTube, Vimeo, o video directo)
   */
  videoUrl: string;
  /**
   * URL de la imagen de thumbnail/preview
   */
  thumbnailUrl?: string;
  /**
   * Título del video
   */
  title?: string;
  /**
   * Descripción del video
   */
  description?: string;
  /**
   * Tipo de video
   */
  type?: "youtube" | "vimeo" | "direct";
  /**
   * Aspect ratio del video
   */
  aspectRatio?: "16/9" | "4/3" | "1/1" | "21/9";
  /**
   * Mostrar controles personalizados (solo para video directo)
   */
  controls?: boolean;
  /**
   * Autoplay (solo para video directo)
   */
  autoplay?: boolean;
  /**
   * Loop (solo para video directo)
   */
  loop?: boolean;
  /**
   * Muted por defecto
   */
  muted?: boolean;
  /**
   * Clases adicionales
   */
  className?: string;
}

/**
 * Componente de video embebido con modal y controles personalizados
 */
export function VideoSection({
  videoUrl,
  thumbnailUrl,
  title,
  description,
  type = "direct",
  aspectRatio = "16/9",
  controls = true,
  autoplay = false,
  loop = false,
  muted = false,
  className,
}: VideoSectionProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(muted);
  const [showModal, setShowModal] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const aspectRatioClasses = {
    "16/9": "aspect-video",
    "4/3": "aspect-[4/3]",
    "1/1": "aspect-square",
    "21/9": "aspect-[21/9]",
  };

  const handlePlayClick = () => {
    if (type === "direct") {
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    } else {
      setShowModal(true);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const getEmbedUrl = () => {
    if (type === "youtube") {
      const videoId =
        videoUrl.split("v=")[1]?.split("&")[0] || videoUrl.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (type === "vimeo") {
      const videoId = videoUrl.split("/").pop();
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return videoUrl;
  };

  return (
    <>
      <div className={cn("relative group", className)}>
        {/* Contenedor del video */}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl bg-brisa-900",
            aspectRatioClasses[aspectRatio],
          )}
        >
          {type === "direct" ? (
            // Video directo (MP4, WebM, etc.)
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                poster={thumbnailUrl}
                className="w-full h-full object-cover"
                loop={loop}
                muted={isMuted}
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Tu navegador no soporta el elemento de video.
              </video>

              {/* Overlay con controles */}
              <motion.div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent",
                  "flex items-center justify-center transition-opacity duration-300",
                  isPlaying && "opacity-0 group-hover:opacity-100",
                )}
              >
                {/* Botón de play */}
                <motion.button
                  onClick={handlePlayClick}
                  className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl hover:bg-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? (
                    <svg
                      className="w-10 h-10 text-brisa-900 ml-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <Play className="w-10 h-10 text-brisa-900 ml-1" />
                  )}
                </motion.button>
              </motion.div>

              {/* Controles de volumen */}
              {controls && (
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={handleMuteToggle}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            // Thumbnail para videos embebidos (YouTube, Vimeo)
            <>
              <div
                className="w-full h-full bg-cover bg-center"
                style={{
                  backgroundImage: thumbnailUrl
                    ? `url(${thumbnailUrl})`
                    : undefined,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                <motion.button
                  onClick={handlePlayClick}
                  className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl hover:bg-white transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-10 h-10 text-brisa-900 ml-1" />
                </motion.button>
              </div>
            </>
          )}

          {/* Texto descriptivo */}
          {(title || description) && (
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
              {title && (
                <h3 className="text-xl font-semibold text-white mb-1">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-sm text-white/90">{description}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para videos embebidos */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent size="xl" className="p-0">
          <div className={cn("w-full", aspectRatioClasses[aspectRatio])}>
            {showModal && type !== "direct" && (
              <iframe
                src={getEmbedUrl()}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
