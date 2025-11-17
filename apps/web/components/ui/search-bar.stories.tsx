import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SearchBar, type SearchBarProps } from "./search-bar";

type SearchBarStoryProps = Omit<SearchBarProps, "value" | "onChange"> & {
  initialValue?: string;
};

function SearchBarPreview({
  initialValue = "",
  ...props
}: SearchBarStoryProps) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="max-w-lg">
      <SearchBar
        {...props}
        value={value}
        onChange={(next) => setValue(next)}
        onClear={() => setValue("")}
      />
      <p className="mt-3 text-xs text-brisa-400">
        Valor actual:{" "}
        <span className="font-mono text-brisa-200">{value || "(vacío)"}</span>
      </p>
    </div>
  );
}

const meta = {
  title: "UI/SearchBar",
  component: SearchBarPreview,
  args: {
    placeholder: "Buscar reservas, clientes, propiedades…",
    initialValue: "",
  },
} satisfies Meta<typeof SearchBarPreview>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    isLoading: true,
    initialValue: "Brickell",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    initialValue: "Modo lectura",
  },
};
