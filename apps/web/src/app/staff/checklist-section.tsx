"use client";

interface ChecklistTask {
  id: string;
  label: string;
  completed: boolean;
}

interface ChecklistSectionProps {
  tasks: ChecklistTask[];
  onToggle: (taskId: string) => void;
}

export function ChecklistSection({ tasks, onToggle }: ChecklistSectionProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
        Checklist de calidad
      </p>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <button
            type="button"
            key={task.id}
            onClick={() => onToggle(task.id)}
            className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
              task.completed
                ? "border-teal-400/40 bg-teal-500/10"
                : "border-white/10 bg-white/[0.02] hover:border-white/20"
            }`}
          >
            <div
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                task.completed
                  ? "border-teal-400 bg-teal-400"
                  : "border-white/30 bg-transparent"
              }`}
            >
              {task.completed ? (
                <svg
                  className="h-3 w-3 text-black"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : null}
            </div>
            <p
              className={`text-sm ${
                task.completed
                  ? "font-medium text-teal-100 line-through"
                  : "text-white"
              }`}
            >
              {task.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
