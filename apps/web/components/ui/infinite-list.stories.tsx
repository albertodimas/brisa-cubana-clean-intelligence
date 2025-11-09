import { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { InfiniteList } from "./infinite-list";

type ActivityItem = {
  id: string;
  property: string;
  slot: string;
  crew: string;
  status: "listo" | "en curso" | "pendiente";
};

const baseItems: ActivityItem[] = Array.from({ length: 40 }).map(
  (_, index) => ({
    id: `activity-${index}`,
    property: index % 2 === 0 ? "Brickell Collection" : "Wynwood Loft",
    slot: `Hoy ${2 + (index % 5)}:${index % 2 === 0 ? "00" : "30"} PM`,
    crew: index % 3 === 0 ? "Cuadrilla Norte" : "Cuadrilla Express",
    status:
      index % 5 === 0 ? "pendiente" : index % 4 === 0 ? "en curso" : "listo",
  }),
);

function InfiniteListPreview() {
  const items = useMemo(() => baseItems, []);

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-brisa-300">
        Desplázate hasta el final para cargar más registros automáticamente.
      </p>
      <div className="h-[420px] overflow-y-auto pr-3">
        <InfiniteList
          items={items}
          getItemKey={(item) => item.id}
          pageSize={8}
          skeletonCount={2}
          loadingMessage="Sincronizando con operaciones…"
          className="space-y-3"
          renderItem={(item) => (
            <article className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white">
              <header className="flex items-center justify-between text-xs uppercase tracking-wide text-brisa-400">
                <span>{item.property}</span>
                <span>{item.slot}</span>
              </header>
              <p className="mt-2 text-base font-semibold">{item.crew}</p>
              <p className="text-xs text-brisa-300">
                Estado:
                <span
                  className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.status === "listo"
                      ? "bg-emerald-600/20 text-emerald-200"
                      : item.status === "en curso"
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-red-500/20 text-red-200"
                  }`}
                >
                  {item.status}
                </span>
              </p>
            </article>
          )}
        />
      </div>
    </div>
  );
}

const meta = {
  title: "UI/Infinite List",
  component: InfiniteList,
} satisfies Meta<typeof InfiniteList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ScrollInfinite: Story = {
  args: {
    items: [],
    renderItem: () => null,
    getItemKey: () => "key",
  },
  render: () => <InfiniteListPreview />,
};

export const Vacio: Story = {
  args: {
    items: [],
    renderItem: () => null,
    getItemKey: () => "key",
  },
  render: () => (
    <InfiniteList
      items={[]}
      getItemKey={() => "empty"}
      renderItem={() => null}
      emptyMessage="No hay actividades registradas para este día."
    />
  ),
};
