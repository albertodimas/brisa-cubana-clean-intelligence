import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { PropertiesManager } from "./properties-manager";
import {
  asyncSuccess,
  defaultPageInfo,
  mockCustomers,
  mockProperties,
  noopAsync,
} from "../.storybook/mocks/panel-fixtures";

type PropertiesManagerProps = React.ComponentProps<typeof PropertiesManager>;
type PropertiesManagerStoryArgs = Partial<PropertiesManagerProps>;

function useQuery(initial: QueryParams = {}) {
  const [query, setQueryState] = useState<QueryParams>(initial);
  const setQuery = async (next: QueryParams) => {
    console.info("[storybook] setQuery", next);
    setQueryState(next);
  };
  const resetQuery = async () => {
    console.info("[storybook] resetQuery");
    setQueryState(initial);
  };
  return { query, setQuery, resetQuery };
}

function PropertiesManagerPreview(props: Partial<PropertiesManagerProps> = {}) {
  const { query, setQuery, resetQuery } = useQuery();
  const merged: PropertiesManagerProps = {
    properties: props.properties ?? mockProperties,
    customers: props.customers ?? mockCustomers,
    createProperty: props.createProperty ?? asyncSuccess("Propiedad creada"),
    updateProperty:
      props.updateProperty ?? asyncSuccess("Propiedad actualizada"),
    onToast:
      props.onToast ??
      ((message: string, type: "success" | "error") =>
        console.info(`[storybook toast][${type}] ${message}`)),
    pageInfo: props.pageInfo ?? defaultPageInfo,
    isLoading: props.isLoading ?? false,
    isLoadingMore: props.isLoadingMore ?? false,
    onLoadMore:
      props.onLoadMore ?? (async () => console.info("[storybook] load more")),
    onRefresh: props.onRefresh ?? noopAsync,
    currentQuery: query,
    setQuery,
    resetQuery,
  };
  return <PropertiesManager {...merged} />;
}

const meta: Meta<PropertiesManagerStoryArgs> = {
  title: "Managers/PropertiesManager",
  component: PropertiesManager,
  render: (args) => <PropertiesManagerPreview {...args} />,
};

export default meta;

type Story = StoryObj<PropertiesManagerStoryArgs>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
