import type { Meta, StoryObj } from "@storybook/react";
import { ScrollArea } from "@/components/ui/scroll-area";

const meta: Meta<typeof ScrollArea> = {
  title: "UI/ScrollArea",
  component: ScrollArea,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {
  args: {
    className: "h-72 w-48 rounded-md border",
    children: (
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="text-sm">v1.2.{i}</div>
        ))}
      </div>
    ),
  },
};

export const Empty: Story = {
  args: { className: "h-72 w-48 rounded-md border", children: <div className="p-4"><p>No items</p></div> },
};

