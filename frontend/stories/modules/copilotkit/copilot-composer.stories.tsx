import type { Meta, StoryObj } from "@storybook/react";
import { CopilotComposer } from "@/modules/copilotkit/components/CopilotComposer";

const meta: Meta<typeof CopilotComposer> = {
  title: "AI/CopilotComposer",
  component: CopilotComposer,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CopilotComposer>;

export const Default: Story = {
  args: {
    onSend: async (content: string) => {
      console.log("send:", content);
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onSend: async () => {},
  },
};
