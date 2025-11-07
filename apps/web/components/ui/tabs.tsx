"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-lg",
      "bg-brisa-900/50 p-1 text-brisa-300 backdrop-blur-sm",
      "border border-brisa-700/30",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex items-center justify-center whitespace-nowrap rounded-md",
      "px-3 py-1.5 text-sm font-medium ring-offset-brisa-900",
      "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
      "focus-visible:ring-brisa-500 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:text-brisa-50",
      "data-[state=inactive]:text-brisa-400 data-[state=inactive]:hover:text-brisa-200",
      className,
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-brisa-900 focus-visible:outline-none",
      "focus-visible:ring-2 focus-visible:ring-brisa-500 focus-visible:ring-offset-2",
      "data-[state=active]:animate-fade-in",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

interface AnimatedTabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  children: React.ReactNode;
}

/**
 * Tabs con indicador animado que se desliza entre los tabs activos
 */
const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  AnimatedTabsListProps
>(({ className, children, ...props }, ref) => {
  const [activeTab, setActiveTab] = React.useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState({
    left: 0,
    width: 0,
  });

  const listRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      listRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [ref],
  );

  React.useEffect(() => {
    if (!listRef.current) return;

    const activeElement = listRef.current.querySelector(
      '[data-state="active"]',
    ) as HTMLElement;

    if (activeElement) {
      const listRect = listRef.current.getBoundingClientRect();
      const activeRect = activeElement.getBoundingClientRect();

      setIndicatorStyle({
        left: activeRect.left - listRect.left,
        width: activeRect.width,
      });
    }
  }, [activeTab, children]);

  return (
    <TabsPrimitive.List
      ref={handleRef}
      className={cn(
        "relative inline-flex h-10 items-center justify-center rounded-lg",
        "bg-brisa-900/50 p-1 text-brisa-300 backdrop-blur-sm",
        "border border-brisa-700/30",
        className,
      )}
      {...props}
    >
      <motion.div
        className="absolute h-8 rounded-md bg-brisa-700/30 backdrop-blur-sm"
        initial={false}
        animate={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        style={{
          top: "0.25rem",
        }}
      />
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement<
            React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
          >(child)
        ) {
          const childValue = child.props.value;
          const childOnClick = child.props.onClick;

          return React.cloneElement<
            React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
          >(child, {
            ...child.props,
            onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
              setActiveTab(childValue);
              childOnClick?.(e);
            },
          });
        }
        return child;
      })}
    </TabsPrimitive.List>
  );
});
AnimatedTabsList.displayName = "AnimatedTabsList";

export { Tabs, TabsList, TabsTrigger, TabsContent, AnimatedTabsList };
