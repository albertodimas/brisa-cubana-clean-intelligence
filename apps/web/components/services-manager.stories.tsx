import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { ServicesManager } from "./services-manager";
import {
  asyncSuccess,
  defaultPageInfo,
  mockServices,
  noopAsync,
} from "../.storybook/mocks/panel-fixtures";

type ServicesManagerProps = React.ComponentProps<typeof ServicesManager>;
type ServicesManagerStoryArgs = Partial<ServicesManagerProps>;

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

function ServicesManagerPreview(props: Partial<ServicesManagerProps> = {}) {
  const { query, setQuery, resetQuery } = useQuery();
  const merged: ServicesManagerProps = {
    services: props.services ?? mockServices,
    createService: props.createService ?? asyncSuccess("Servicio creado"),
    updateService: props.updateService ?? asyncSuccess("Servicio actualizado"),
    toggleService:
      props.toggleService ?? asyncSuccess("Estado de servicio actualizado"),
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
  return <ServicesManager {...merged} />;
}

const meta: Meta<ServicesManagerStoryArgs> = {
  title: "Managers/ServicesManager",
  component: ServicesManager,
  render: (args) => <ServicesManagerPreview {...args} />,
};

export default meta;

type Story = StoryObj<ServicesManagerStoryArgs>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
