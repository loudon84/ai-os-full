import type { Meta, StoryObj } from "@storybook/react";
import DeleteConfirmationDialog from "@/components/delete-confirmation-dialog";

const meta: Meta<typeof DeleteConfirmationDialog> = {
  title: "Components/DeleteConfirmationDialog",
  component: DeleteConfirmationDialog,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof DeleteConfirmationDialog>;

export const Default: Story = {
  args: {},
};

export const Error: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Error state during deletion.",
      },
    },
  },
};

