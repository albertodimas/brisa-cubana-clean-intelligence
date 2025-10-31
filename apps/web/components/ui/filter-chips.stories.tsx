import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FilterChips, type FilterChip } from "./filter-chips";

const initialFilters: FilterChip[] = [
  { key: "status", label: "Estado", value: "Activo" },
  { key: "city", label: "Ciudad", value: "Miami" },
  { key: "premium", label: "Premium", value: true },
];

const meta = {
  title: "UI/FilterChips",
  component: FilterChips,
  parameters: {
    layout: "centered",
  },
  args: {
    filters: initialFilters,
  },
} satisfies Meta<typeof FilterChips>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    filters: initialFilters,
    onRemove: () => {},
    onClearAll: () => {},
  },
  render: (args) => {
    const [filters, setFilters] = React.useState(args.filters);

    React.useEffect(() => {
      setFilters(args.filters);
    }, [args.filters]);

    return (
      <FilterChips
        {...args}
        filters={filters}
        onRemove={(key) =>
          setFilters((current) => current.filter((chip) => chip.key !== key))
        }
        onClearAll={() => {
          setFilters([]);
          args.onClearAll?.();
        }}
      />
    );
  },
};
