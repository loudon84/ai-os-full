import type { Meta, StoryObj } from "@storybook/react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const meta: Meta<typeof Carousel> = {
  title: "UI/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Carousel>;

export const Default: Story = {
  args: {
    children: (
      <CarouselContent>
        <CarouselItem><div className="p-4 bg-default-100 rounded">Item 1</div></CarouselItem>
        <CarouselItem><div className="p-4 bg-default-100 rounded">Item 2</div></CarouselItem>
        <CarouselItem><div className="p-4 bg-default-100 rounded">Item 3</div></CarouselItem>
      </CarouselContent>
    ),
  },
};

export const Empty: Story = {
  args: { children: <CarouselContent /> },
};

