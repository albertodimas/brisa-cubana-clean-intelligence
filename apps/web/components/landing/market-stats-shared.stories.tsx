import type { Meta, StoryObj } from "@storybook/react";
import {
  HIGHLIGHT_STATS,
  SNAPSHOT_STATS,
  formatLastUpdated,
} from "./market-stats-shared";

function MarketStatsSharedDocs() {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold">Snapshot stats configuradas</h3>
        <ul className="list-disc pl-6 text-sm text-gray-600">
          {SNAPSHOT_STATS.map((stat) => (
            <li key={stat.id}>
              <strong>{stat.id}</strong>: {stat.description}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h3 className="text-lg font-semibold">Highlights disponibles</h3>
        <ul className="list-disc pl-6 text-sm text-gray-600">
          {HIGHLIGHT_STATS.map((stat) => (
            <li key={stat.id}>
              <strong>{stat.heading}</strong>: {stat.body}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <p className="text-sm text-gray-600">
          Ejemplo de <code>formatLastUpdated</code>:{" "}
          {formatLastUpdated("2025-01-01")}
        </p>
      </section>
    </div>
  );
}

const meta = {
  title: "Landing/Market Stats Shared",
  component: MarketStatsSharedDocs,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof MarketStatsSharedDocs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Docs: Story = {};
