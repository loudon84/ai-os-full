import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

const meta: Meta<typeof Table> = {
  title: "UI/Table",
  component: Table,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Table>;

export const Default: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Item 1</TableCell>
            <TableCell>100</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Item 2</TableCell>
            <TableCell>200</TableCell>
          </TableRow>
        </TableBody>
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody />
      </>
    ),
  },
};

export const Loading: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2} className="text-center animate-pulse">Loading...</TableCell>
          </TableRow>
        </TableBody>
      </>
    ),
  },
};

export const Error: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={2} className="text-center text-destructive">Failed to load data</TableCell>
          </TableRow>
        </TableBody>
      </>
    ),
  },
};

export const LongContent: Story = {
  args: {
    children: (
      <>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 20 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>{i + 1}</TableCell>
              <TableCell>Item {i + 1}</TableCell>
              <TableCell>{(i + 1) * 100}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </>
    ),
  },
};

