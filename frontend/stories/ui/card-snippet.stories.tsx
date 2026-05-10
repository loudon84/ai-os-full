import type { Meta, StoryObj } from "@storybook/react";
import CardSnippet from "@/components/ui/card-snippet";

const meta: Meta<typeof CardSnippet> = {
  title: "UI/CardSnippet",
  component: CardSnippet,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CardSnippet>;

export const Default: Story = {
  args: {
    title: "Snippet Title", children: <p>Snippet content</p>,
  },
};

export const Empty: Story = { args: { title: "", children: <p /> } };
export const Loading: Story = { args: { title: "Loading...", children: <span className="animate-pulse">Loading content...</span> } };

