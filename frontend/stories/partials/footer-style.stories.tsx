import type { Meta, StoryObj } from "@storybook/react";
import FooterStyle from "@/components/partials/customizer/footer-style";

const meta: Meta<typeof FooterStyle> = {
  title: "Partials/Customizer/FooterStyle",
  component: FooterStyle,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof FooterStyle>;

export const Default: Story = {
  args: {},
};

