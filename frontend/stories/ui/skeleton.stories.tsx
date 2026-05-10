import type { Meta, StoryObj } from "@storybook/react";
import { Skeleton } from "@/components/ui/skeleton";

const meta: Meta<typeof Skeleton> = {
  title: "UI/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Default: Story = {
  args: {
    className: "h-12 w-12 rounded-full",
  },
};

export const Rectangle: Story = { args: { className: "h-12 w-full" } };
export const CardSkeleton: Story = {
  args: {
    className: "h-40 w-full rounded-lg",
  },
  render: () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};

