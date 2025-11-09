import { useEffect, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { LeadCaptureForm } from "./lead-capture-form";

type LeadCaptureStoryProps = ComponentProps<typeof LeadCaptureForm>;

function LeadCaptureFormPreview(props: LeadCaptureStoryProps) {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      if (typeof input === "string" && input.includes("/api/leads")) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return originalFetch(input, init);
    };

    const url = new URL(window.location.href);
    url.searchParams.set("plan", "turnover");
    url.searchParams.set("inventory", encodeURIComponent("6-15 unidades"));
    window.history.replaceState({}, "", url.toString());

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return <LeadCaptureForm {...props} />;
}

const meta = {
  title: "Landing/Lead Capture Form",
  component: LeadCaptureForm,
  args: {
    origin: "storybook",
  },
} satisfies Meta<typeof LeadCaptureForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Español: Story = {
  render: (args) => <LeadCaptureFormPreview {...args} />,
};

export const Inglés: Story = {
  args: {
    locale: "en",
    origin: "storybook-en",
  },
  render: (args) => <LeadCaptureFormPreview {...args} />,
};
