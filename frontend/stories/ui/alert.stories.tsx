import type { Meta, StoryObj } from "@storybook/react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const meta: Meta<typeof Alert> = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    children: (
      <>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>This is an alert description.</AlertDescription>
      </>
    ),
  },
};

export const Empty: Story = {
  args: { children: <AlertDescription>No message.</AlertDescription> },
};

export const Loading: Story = {
  args: { children: (<><AlertTitle>Loading</AlertTitle><AlertDescription><span className="animate-pulse">Please wait...</span></AlertDescription></>) },
};

export const Error: Story = {
  args: {
    color: "destructive",
    children: (<><AlertTitle>Error</AlertTitle><AlertDescription>Something went wrong.</AlertDescription></>),
  },
};

export const Success: Story = {
  args: {
    color: "success",
    children: (<><AlertTitle>Success</AlertTitle><AlertDescription>Operation completed.</AlertDescription></>),
  },
};

export const Warning: Story = {
  args: {
    color: "warning",
    children: (<><AlertTitle>Warning</AlertTitle><AlertDescription>Please check your input.</AlertDescription></>),
  },
};

