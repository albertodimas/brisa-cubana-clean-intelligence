import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { UsersManager } from "./users-manager";
import {
  asyncError,
  asyncSuccess,
  defaultPageInfo,
  mockUsers,
  noopAsync,
} from "../.storybook/mocks/panel-fixtures";

type UsersManagerProps = React.ComponentProps<typeof UsersManager>;
type UsersManagerStoryArgs = Partial<UsersManagerProps>;

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

function UsersManagerPreview(props: Partial<UsersManagerProps> = {}) {
  const { query, setQuery, resetQuery } = useQuery();
  const merged: UsersManagerProps = {
    users: props.users ?? mockUsers,
    pageInfo: props.pageInfo ?? defaultPageInfo,
    isLoading: props.isLoading ?? false,
    isLoadingMore: props.isLoadingMore ?? false,
    onLoadMore:
      props.onLoadMore ?? (async () => console.info("[storybook] load more")),
    currentQuery: query,
    setQuery,
    resetQuery,
    refresh: props.refresh ?? noopAsync,
    onUpdate: props.onUpdate ?? asyncSuccess("Usuario actualizado"),
    onToggleActive:
      props.onToggleActive ?? asyncSuccess("Estado del usuario actualizado"),
    currentUserId: props.currentUserId ?? mockUsers[0].id,
    onToast:
      props.onToast ??
      ((message: string, type: "success" | "error") =>
        console.info(`[storybook toast][${type}] ${message}`)),
  };
  return <UsersManager {...merged} />;
}

const meta: Meta<UsersManagerStoryArgs> = {
  title: "Managers/UsersManager",
  component: UsersManager,
  render: (args) => <UsersManagerPreview {...args} />,
};

export default meta;

type Story = StoryObj<UsersManagerStoryArgs>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ToggleError: Story = {
  args: {
    onToggleActive: asyncError("No se pudo actualizar el usuario"),
  },
};
