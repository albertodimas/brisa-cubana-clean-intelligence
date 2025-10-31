import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "./pagination";

const meta = {
  title: "UI/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
  },
  args: {
    count: 20,
    hasMore: true,
    label: "clientes",
  },
} satisfies Meta<typeof Pagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [count, setCount] = React.useState(args.count);
    const [hasMore, setHasMore] = React.useState(args.hasMore);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
      setCount(args.count);
      setHasMore(args.hasMore);
    }, [args.count, args.hasMore]);

    return (
      <Pagination
        {...args}
        count={count}
        hasMore={hasMore}
        isLoading={isLoading}
        onLoadMore={async () => {
          setIsLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 900));
          setCount((current) => current + 10);
          if (count + 10 >= 60) {
            setHasMore(false);
          }
          setIsLoading(false);
        }}
      />
    );
  },
};
