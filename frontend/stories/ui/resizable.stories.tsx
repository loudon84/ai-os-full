import type { Meta, StoryObj } from "@storybook/react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const meta: Meta<typeof ResizablePanelGroup> = {
  title: "UI/Resizable",
  component: ResizablePanelGroup,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ResizablePanelGroup>;

export const Default: Story = {
  args: {
    children: (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Panel 1</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Panel 2</ResizablePanel>
      </ResizablePanelGroup>
    ),
  },
};

