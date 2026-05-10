import type { Meta, StoryObj } from "@storybook/react";
import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";

const meta: Meta<typeof Command> = {
  title: "UI/Command",
  component: Command,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
        </CommandList>
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    children: (<><CommandInput placeholder="No results..." /><CommandList /></>),
  },
};

