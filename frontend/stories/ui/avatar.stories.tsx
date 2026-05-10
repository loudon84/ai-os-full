import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    children: (
      <>
        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
        <AvatarFallback>CN</AvatarFallback>
      </>
    ),
  },
};

export const Empty: Story = {
  args: { children: <AvatarFallback>?</AvatarFallback> },
};

export const Loading: Story = {
  args: { className: "animate-pulse", children: <AvatarFallback>...</AvatarFallback> },
};

export const Error: Story = {
  args: { children: <AvatarFallback>ERR</AvatarFallback> },
};

