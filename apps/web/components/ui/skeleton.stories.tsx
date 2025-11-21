import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton, SkeletonCard, SkeletonTable } from "./skeleton";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Textos: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <Skeleton variant="text" lines={3} />
      <Skeleton variant="text" lines={5} animation="wave" />
      <Skeleton variant="text" width="60%" />
    </div>
  ),
};

export const Formas: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <Skeleton variant="rounded" width={160} height={100} />
      <Skeleton variant="rectangular" width={200} height={40} />
      <Skeleton variant="rounded" width={200} height={40} animation="wave" />
    </div>
  ),
};

export const CardYTabla: Story = {
  render: () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <SkeletonCard showAvatar lines={4} />
      <SkeletonTable rows={4} columns={5} />
    </div>
  ),
};
