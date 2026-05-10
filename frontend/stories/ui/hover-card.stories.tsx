import type { Meta, StoryObj } from "@storybook/react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

const meta: Meta<typeof HoverCard> = {
  title: "UI/HoverCard",
  component: HoverCard,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof HoverCard>;

export const Default: Story = {
  args: {
    children: (
      <>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent><p>Hover card content</p></HoverCardContent>
      </>
    ),
  },
};

