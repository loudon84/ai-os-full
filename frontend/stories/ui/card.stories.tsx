import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const meta: Meta<typeof Card> = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent><p>Card content goes here.</p></CardContent>
        <CardFooter><p>Card footer</p></CardFooter>
      </>
    ),
  },
};

export const Empty: Story = {
  args: { children: <CardContent /> },
};

export const Loading: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle><span className="animate-pulse bg-default-200 rounded h-4 w-24 inline-block" /></CardTitle>
          <CardDescription><span className="animate-pulse bg-default-200 rounded h-3 w-32 inline-block" /></CardDescription>
        </CardHeader>
        <CardContent><span className="animate-pulse bg-default-200 rounded h-12 w-full inline-block" /></CardContent>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    children: (
      <>
        <CardHeader><CardTitle className="text-destructive">Error</CardTitle></CardHeader>
        <CardContent><p className="text-destructive">Failed to load content.</p></CardContent>
      </>
    ),
  },
};

export const LongContent: Story = {
  args: {
    children: (
      <>
        <CardHeader><CardTitle>Long Content</CardTitle></CardHeader>
        <CardContent><p>{Array.from({length: 10}, (_, i) => `Paragraph ${i+1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.`).join(" ")}</p></CardContent>
      </>
    ),
  },
};

