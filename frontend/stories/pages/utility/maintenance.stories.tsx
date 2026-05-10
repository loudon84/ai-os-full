import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Pages/Utility/Maintenance",
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "⚠️ WIP: This page depends on Next.js runtime (server-only, route params). Rendered as placeholder until full mock support is added.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border">
        <h2 className="text-xl font-semibold mb-2">MaintenancePage</h2>
        <p className="text-muted-foreground">Page preview (WIP)</p>
        <p className="text-sm text-muted-foreground mt-2">Requires Next.js runtime mock for full rendering</p>
      </div>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border">
        <h2 className="text-xl font-semibold mb-2">MaintenancePage - Empty</h2>
        <p className="text-muted-foreground">No data loaded</p>
      </div>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border">
        <h2 className="text-xl font-semibold mb-2">MaintenancePage - Loading</h2>
        <div className="animate-pulse mt-4 space-y-2">
          <div className="h-4 bg-default-200 rounded w-48 mx-auto" />
          <div className="h-4 bg-default-200 rounded w-32 mx-auto" />
        </div>
      </div>
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border border-destructive">
        <h2 className="text-xl font-semibold mb-2 text-destructive">MaintenancePage - Error</h2>
        <p className="text-destructive">Failed to load page data</p>
      </div>
    </div>
  ),
};

export const Forbidden: Story = {
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border border-warning">
        <h2 className="text-xl font-semibold mb-2 text-warning">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page</p>
      </div>
    </div>
  ),
};
