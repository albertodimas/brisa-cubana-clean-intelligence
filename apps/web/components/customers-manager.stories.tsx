import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { CustomersManager } from "./customers-manager";
import {
  defaultPageInfo,
  mockCustomers,
} from "../.storybook/mocks/panel-fixtures";

type CustomersManagerProps = React.ComponentProps<typeof CustomersManager>;
type CustomersManagerStoryArgs = Partial<CustomersManagerProps>;

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

function CustomersManagerPreview(props: Partial<CustomersManagerProps> = {}) {
  const { query, setQuery, resetQuery } = useQuery();
  const merged: CustomersManagerProps = {
    customers: props.customers ?? mockCustomers,
    pageInfo: props.pageInfo ?? defaultPageInfo,
    isLoading: props.isLoading ?? false,
    isLoadingMore: props.isLoadingMore ?? false,
    onLoadMore:
      props.onLoadMore ?? (async () => console.info("[storybook] load more")),
    currentQuery: query,
    setQuery,
    resetQuery,
  };

  return <CustomersManager {...merged} />;
}

const meta: Meta<CustomersManagerStoryArgs> = {
  title: "Managers/CustomersManager",
  component: CustomersManager,
  render: (args) => <CustomersManagerPreview {...args} />,
};

export default meta;

type Story = StoryObj<CustomersManagerStoryArgs>;

export const Default: Story = {
  args: {},
};

export const EmptyState: Story = {
  args: {
    customers: [],
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};
