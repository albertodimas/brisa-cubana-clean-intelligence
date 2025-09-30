"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@brisa/ui";
import { ChecklistSection } from "./checklist-section";
import { PhotoCapture } from "./photo-capture";

interface ActiveServiceProps {
  booking: {
    id: string;
    scheduledAt: string;
    status: string;
    serviceName: string;
    propertyName: string;
    propertyAddress: string;
    notes?: string | null;
  };
  accessToken: string;
  onBack: () => void;
  onComplete: () => void;
}

interface ChecklistTask {
  id: string;
  label: string;
  completed: boolean;
}

export function ActiveService({
  booking,
  accessToken,
  onBack,
  onComplete,
}: ActiveServiceProps) {
  const [started, setStarted] = useState(booking.status === "IN_PROGRESS");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tasks, setTasks] = useState<ChecklistTask[]>([
    { id: "1", label: "Verificar acceso a la propiedad", completed: false },
    { id: "2", label: "Inspección visual inicial", completed: false },
    { id: "3", label: "Limpieza de pisos y superficies", completed: false },
    { id: "4", label: "Limpieza de baños", completed: false },
    { id: "5", label: "Limpieza de cocina", completed: false },
    { id: "6", label: "Aspirado y trapeado final", completed: false },
    { id: "7", label: "Retirar basura", completed: false },
    { id: "8", label: "Inspección final de calidad", completed: false },
  ]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (started) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [started]);

  async function handleStart() {
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking status");
      }

      setStarted(true);
    } catch (error) {
      console.error("Error starting service", error);
      alert("Error al iniciar el servicio. Intenta de nuevo.");
    }
  }

  async function handleComplete() {
    const allCompleted = tasks.every((task) => task.completed);
    if (!allCompleted) {
      const confirmed = window.confirm(
        "No todas las tareas están marcadas como completadas. ¿Deseas continuar?",
      );
      if (!confirmed) return;
    }

    if (photos.length === 0) {
      const confirmed = window.confirm(
        "No has capturado fotos para el CleanScore™. ¿Deseas continuar sin fotos?",
      );
      if (!confirmed) return;
    }

    try {
      setCompleting(true);
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiBase}/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete booking");
      }

      // TODO: Upload photos to storage
      // TODO: Generate CleanScore report

      onComplete();
    } catch (error) {
      console.error("Error completing service", error);
      alert("Error al completar el servicio. Intenta de nuevo.");
    } finally {
      setCompleting(false);
    }
  }

  function toggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function addPhoto(dataUrl: string) {
    setPhotos((prev) => [...prev, dataUrl]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = (completedCount / tasks.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 p-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={completing}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white transition hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
        >
          ←
        </button>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-300">
            Servicio activo
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">
            {booking.serviceName}
          </h2>
          <p className="text-xs text-neutral-400">{booking.propertyName}</p>
        </div>
      </div>

      {/* Timer Card */}
      {started ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-teal-400/40 bg-gradient-to-br from-teal-500/10 to-teal-600/5 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-teal-200">
            Tiempo transcurrido
          </p>
          <p className="font-mono text-5xl font-bold text-white">
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <span className="text-5xl">🚀</span>
          <p className="text-lg font-semibold text-white">
            ¿Listo para comenzar?
          </p>
          <p className="text-sm text-neutral-400">
            Inicia el servicio para activar el cronómetro y el checklist.
          </p>
          <Button intent="primary" onClick={handleStart}>
            Iniciar servicio
          </Button>
        </div>
      )}

      {started ? (
        <>
          {/* Progress Bar */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-neutral-400">
              <span>Progreso</span>
              <span className="text-teal-300">
                {completedCount}/{tasks.length}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <ChecklistSection tasks={tasks} onToggle={toggleTask} />

          {/* Photo Capture */}
          <PhotoCapture
            photos={photos}
            onAddPhoto={addPhoto}
            onRemovePhoto={removePhoto}
          />

          {/* Complete Button */}
          <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-neutral-900/95 p-6 backdrop-blur-lg">
            <div className="mx-auto max-w-md">
              <Button
                intent="primary"
                onClick={handleComplete}
                disabled={completing}
                className="w-full text-lg font-semibold"
              >
                {completing ? "Finalizando..." : "Completar servicio"}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
