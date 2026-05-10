import type { Meta, StoryObj } from "@storybook/react";
import { Accordion } from "@/components/ui/accordion";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {
    type: "single", collapsible: true,
    children: (
      <>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    type: "single",
    collapsible: true,
    children: <AccordionItem value="empty"><AccordionTrigger>No Content</AccordionTrigger><AccordionContent /></AccordionItem>,
  },
};

export const Loading: Story = {
  args: {
    type: "single",
    collapsible: true,
    children: (
      <>
        <AccordionItem value="loading-1"><AccordionTrigger>Loading...</AccordionTrigger><AccordionContent><span className="animate-pulse">Loading content...</span></AccordionContent></AccordionItem>
      </>
    ),
  },
};

