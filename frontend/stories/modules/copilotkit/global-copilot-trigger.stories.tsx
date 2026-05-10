import type { Meta, StoryObj } from "@storybook/react";
import { GlobalCopilotTrigger } from "@/modules/copilotkit/components/GlobalCopilotTrigger";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";

const meta: Meta<typeof GlobalCopilotTrigger> = {
  title: "AI/GlobalCopilotTrigger",
  component: GlobalCopilotTrigger,
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      useGlobalCopilotStore.setState({ open: false, sessionId: undefined });
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof GlobalCopilotTrigger>;

export const Default: Story = {};
