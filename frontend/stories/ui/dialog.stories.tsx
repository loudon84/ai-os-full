import type { Meta, StoryObj } from "@storybook/react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const meta: Meta<typeof Dialog> = {
  title: "UI/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
  args: {
    children: (
      <>
        <DialogTrigger>Open Dialog</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dialog Title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogHeader>
          <DialogFooter><button>Close</button></DialogFooter>
        </DialogContent>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    children: (
      <>
        <DialogTrigger>Show Error</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Error</DialogTitle>
            <DialogDescription>Something went wrong.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </>
    ),
  },
};

