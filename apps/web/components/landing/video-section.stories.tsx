import type { Meta, StoryObj } from "@storybook/react";
import { VideoSection } from "./video-section";

const meta = {
  title: "Landing/Video Section",
  component: VideoSection,
  args: {
    title: "Operación nocturna en vivo",
    description: "Supervisora Carla documenta el setup para check-in 7:00 AM.",
    aspectRatio: "16/9",
  },
} satisfies Meta<typeof VideoSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const VideoDirecto: Story = {
  args: {
    videoUrl: "https://storage.googleapis.com/coverr-main/mp4/Mt_Baker.mp4",
    thumbnailUrl: "/branding/hero-mobile-vertical.webp",
    type: "direct",
    controls: true,
    autoplay: false,
    loop: false,
  },
};

export const YoutubeModal: Story = {
  args: {
    videoUrl: "https://www.youtube.com/watch?v=Z1p1mS8hk2s",
    thumbnailUrl: "/branding/dashboard-analytics-1.webp",
    type: "youtube",
    description: "Abre modal y reproduce el overview del portal cliente.",
  },
};
