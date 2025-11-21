import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { QueryParams } from "@/hooks/use-paginated-resource";
import { BookingsManager } from "./bookings-manager";
import {
  asyncError,
  asyncSuccess,
  defaultPageInfo,
  mockBookings,
  mockProperties,
  mockServices,
  mockStaffUsers,
  noopAsync,
} from "../.storybook/mocks/panel-fixtures";

type BookingsManagerProps = React.ComponentProps<typeof BookingsManager>;
type BookingsManagerStoryArgs = Partial<BookingsManagerProps>;

function useQueryController(initial: QueryParams = {}) {
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

function BookingsManagerPreview(props: Partial<BookingsManagerProps> = {}) {
  const { query, setQuery, resetQuery } = useQueryController();
  const merged: BookingsManagerProps = {
    bookings: props.bookings ?? mockBookings,
    pageInfo: props.pageInfo ?? defaultPageInfo,
    isLoading: props.isLoading ?? false,
    isLoadingMore: props.isLoadingMore ?? false,
    onLoadMore:
      props.onLoadMore ?? (async () => console.info("[storybook] load more")),
    onUpdate: props.onUpdate ?? asyncSuccess("Reserva actualizada"),
    onAssignStaff: props.onAssignStaff ?? asyncSuccess("Personal asignado"),
    services: props.services ?? mockServices,
    properties: props.properties ?? mockProperties,
    staffUsers: props.staffUsers ?? mockStaffUsers,
    formatDateTime:
      props.formatDateTime ??
      ((value: string) =>
        new Date(value).toLocaleString("es-MX", {
          dateStyle: "medium",
          timeStyle: "short",
        })),
    currentQuery: query,
    setQuery,
    resetQuery,
    refresh: props.refresh ?? noopAsync,
    onToast:
      props.onToast ??
      ((message: string, type: "success" | "error") =>
        console.info(`[storybook toast][${type}] ${message}`)),
  };

  return <BookingsManager {...merged} />;
}

const meta: Meta<BookingsManagerStoryArgs> = {
  title: "Managers/BookingsManager",
  component: BookingsManager,
  render: (args) => <BookingsManagerPreview {...args} />,
};

export default meta;

type Story = StoryObj<BookingsManagerStoryArgs>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const ErrorAssigningStaff: Story = {
  args: {
    onAssignStaff: asyncError("No se pudo asignar al concierge"),
  },
};
