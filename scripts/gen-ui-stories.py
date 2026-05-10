"""Generate Storybook stories for UI base components with state coverage."""
import os

base_dir = r'e:\git-ai\smc-coworker-aios\portal'
stories_dir = os.path.join(base_dir, 'stories', 'ui')
os.makedirs(stories_dir, exist_ok=True)

# Template for each component story file
# Format: (filename, component_name, title, import_path, extra_imports, default_args, extra_stories_code)
# extra_stories_code should include Empty, Loading, Error variants where applicable

components = {
    'accordion': {
        'comp': 'Accordion',
        'title': 'UI/Accordion',
        'imports': '''import { Accordion } from "@/components/ui/accordion";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";''',
        'default_args': '''type: "single", collapsible: true,
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
    ),''',
        'extra': '''
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
''',
    },

    'alert': {
        'comp': 'Alert',
        'title': 'UI/Alert',
        'imports': '''import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";''',
        'default_args': '''children: (
      <>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>This is an alert description.</AlertDescription>
      </>
    ),''',
        'extra': '''
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
''',
    },

    'alert-dialog': {
        'comp': 'AlertDialog',
        'title': 'UI/AlertDialog',
        'imports': '''import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";''',
        'default_args': '''children: (
      <>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </>
    ),''',
        'extra': '''
export const Error: Story = {
  args: {
    children: (
      <>
        <AlertDialogTrigger>Delete</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the item.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </>
    ),
  },
};
''',
    },

    'avatar': {
        'comp': 'Avatar',
        'title': 'UI/Avatar',
        'imports': '''import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";''',
        'default_args': '''children: (
      <>
        <AvatarImage src="https://github.com/shadcn.png" alt="User" />
        <AvatarFallback>CN</AvatarFallback>
      </>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: { children: <AvatarFallback>?</AvatarFallback> },
};

export const Loading: Story = {
  args: { className: "animate-pulse", children: <AvatarFallback>...</AvatarFallback> },
};

export const Error: Story = {
  args: { children: <AvatarFallback>ERR</AvatarFallback> },
};
''',
    },

    'badge': {
        'comp': 'Badge',
        'title': 'UI/Badge',
        'imports': '''import { Badge } from "@/components/ui/badge";''',
        'default_args': 'children: "Badge",',
        'extra': '''
export const Empty: Story = { args: { children: "" } };

export const Secondary: Story = { args: { color: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { color: "destructive", children: "Destructive" } };
export const Success: Story = { args: { color: "success", children: "Success" } };
export const Info: Story = { args: { color: "info", children: "Info" } };
export const Warning: Story = { args: { color: "warning", children: "Warning" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Soft: Story = { args: { variant: "soft", children: "Soft" } };
export const LongContent: Story = { args: { children: "Very Long Badge Text That Overflows" } };
''',
    },

    'button': {
        'comp': 'Button',
        'title': 'UI/Button',
        'imports': '''import { Button } from "@/components/ui/button";''',
        'default_args': 'children: "Button",',
        'extra': '''
export const Empty: Story = { args: { children: "" } };

export const Loading: Story = {
  args: { disabled: true, children: (<><span className="animate-spin mr-2">⏳</span>Loading...</>) },
};

export const Error: Story = { args: { color: "destructive", children: "Error" } };

export const Primary: Story = { args: { color: "primary", children: "Primary" } };
export const Secondary: Story = { args: { color: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { color: "destructive", children: "Destructive" } };
export const Success: Story = { args: { color: "success", children: "Success" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Soft: Story = { args: { variant: "soft", children: "Soft" } };
export const Small: Story = { args: { size: "sm", children: "Small" } };
export const Large: Story = { args: { size: "lg", children: "Large" } };
export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };
export const LongContent: Story = { args: { children: "Very Long Button Text Content" } };
''',
    },

    'calendar': {
        'comp': 'Calendar',
        'title': 'UI/Calendar',
        'imports': '''import { Calendar } from "@/components/ui/calendar";''',
        'default_args': '',
        'extra': '''
export const Loading: Story = {
  args: { className: "animate-pulse" },
};
''',
    },

    'card': {
        'comp': 'Card',
        'title': 'UI/Card',
        'imports': '''import { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "@/components/ui/card";''',
        'default_args': '''children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent><p>Card content goes here.</p></CardContent>
        <CardFooter><p>Card footer</p></CardFooter>
      </>
    ),''',
        'extra': '''
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
''',
    },

    'card-snippet': {
        'comp': 'CardSnippet',
        'title': 'UI/CardSnippet',
        'imports': '''import { CardSnippet } from "@/components/ui/card-snippet";''',
        'default_args': 'title: "Snippet Title", children: <p>Snippet content</p>,',
        'extra': '''
export const Empty: Story = { args: { title: "", children: <p /> } };
export const Loading: Story = { args: { title: "Loading...", children: <span className="animate-pulse">Loading content...</span> } };
''',
    },

    'checkbox': {
        'comp': 'Checkbox',
        'title': 'UI/Checkbox',
        'imports': '''import { Checkbox } from "@/components/ui/checkbox";''',
        'default_args': '',
        'extra': '''
export const Empty: Story = { args: {} };
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };
''',
    },

    'collapsible': {
        'comp': 'Collapsible',
        'title': 'UI/Collapsible',
        'imports': '''import { Collapsible } from "@/components/ui/collapsible";''',
        'default_args': '',
        'extra': '''
export const Loading: Story = { args: {} };
''',
    },

    'dialog': {
        'comp': 'Dialog',
        'title': 'UI/Dialog',
        'imports': '''import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";''',
        'default_args': '''children: (
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
    ),''',
        'extra': '''
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
''',
    },

    'drawer': {
        'comp': 'Drawer',
        'title': 'UI/Drawer',
        'imports': '''import { Drawer } from "@/components/ui/drawer";''',
        'default_args': '',
        'extra': '',
    },

    'dropdown-menu': {
        'comp': 'DropdownMenu',
        'title': 'UI/DropdownMenu',
        'imports': '''import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";''',
        'default_args': '''children: (
      <>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
          <DropdownMenuItem>Item 3</DropdownMenuItem>
        </DropdownMenuContent>
      </>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: {
    children: (
      <>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent />
      </>
    ),
  },
};
''',
    },

    'form': {
        'comp': 'Form',
        'title': 'UI/Form',
        'imports': '''import { Form } from "@/components/ui/form";''',
        'default_args': '',
        'extra': '',
    },

    'hover-card': {
        'comp': 'HoverCard',
        'title': 'UI/HoverCard',
        'imports': '''import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";''',
        'default_args': '''children: (
      <>
        <HoverCardTrigger>Hover me</HoverCardTrigger>
        <HoverCardContent><p>Hover card content</p></HoverCardContent>
      </>
    ),''',
        'extra': '',
    },

    'input': {
        'comp': 'Input',
        'title': 'UI/Input',
        'imports': '''import { Input } from "@/components/ui/input";''',
        'default_args': 'placeholder: "Type here...",',
        'extra': '''
export const Empty: Story = { args: { placeholder: "Empty", value: "" } };
export const Loading: Story = { args: { placeholder: "Loading...", disabled: true, value: "Loading..." } };
export const Error: Story = { args: { placeholder: "Error state", className: "border-destructive" } };
export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } };
export const LongContent: Story = { args: { defaultValue: "This is a very long input value that extends beyond the visible area of the input field" } };
''',
    },

    'input-group': {
        'comp': 'InputGroup',
        'title': 'UI/InputGroup',
        'imports': '''import { InputGroup } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";''',
        'default_args': 'children: <Input placeholder="Search..." />,',
        'extra': '''
export const Empty: Story = { args: { children: <Input placeholder="Empty" value="" /> } };
export const Loading: Story = { args: { children: <Input placeholder="Loading..." disabled /> } };
''',
    },

    'kbd': {
        'comp': 'Kbd',
        'title': 'UI/Kbd',
        'imports': '''import { Kbd } from "@/components/ui/kbd";''',
        'default_args': 'children: "Ctrl",',
        'extra': '''
export const Empty: Story = { args: { children: "" } };
export const LongContent: Story = { args: { children: "Ctrl+Shift+Alt+Delete" } };
''',
    },

    'label': {
        'comp': 'Label',
        'title': 'UI/Label',
        'imports': '''import { Label } from "@/components/ui/label";''',
        'default_args': 'children: "Label",',
        'extra': '''
export const Empty: Story = { args: { children: "" } };
export const LongContent: Story = { args: { children: "Very Long Label Text That Might Overflow" } };
''',
    },

    'menubar': {
        'comp': 'Menubar',
        'title': 'UI/Menubar',
        'imports': '''import { Menubar } from "@/components/ui/menubar";''',
        'default_args': '',
        'extra': '',
    },

    'navigation-menu': {
        'comp': 'NavigationMenu',
        'title': 'UI/NavigationMenu',
        'imports': '''import { NavigationMenu } from "@/components/ui/navigation-menu";''',
        'default_args': '',
        'extra': '',
    },

    'pagination': {
        'comp': 'Pagination',
        'title': 'UI/Pagination',
        'imports': '''import { Pagination } from "@/components/ui/pagination";''',
        'default_args': '',
        'extra': '',
    },

    'popover': {
        'comp': 'Popover',
        'title': 'UI/Popover',
        'imports': '''import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";''',
        'default_args': '''children: (
      <>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent><p>Popover content</p></PopoverContent>
      </>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: {
    children: (<><PopoverTrigger>Open</PopoverTrigger><PopoverContent /></>),
  },
};
''',
    },

    'progress': {
        'comp': 'Progress',
        'title': 'UI/Progress',
        'imports': '''import { Progress } from "@/components/ui/progress";''',
        'default_args': 'value: 60,',
        'extra': '''
export const Empty: Story = { args: { value: 0 } };
export const Loading: Story = { args: { value: 0, isAnimate: true } };
export const Low: Story = { args: { value: 20 } };
export const High: Story = { args: { value: 90 } };
export const Complete: Story = { args: { value: 100 } };
''',
    },

    'radio-group': {
        'comp': 'RadioGroup',
        'title': 'UI/RadioGroup',
        'imports': '''import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";''',
        'default_args': '''children: (
      <>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="r1" />
          <Label htmlFor="r1">Option 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="r2" />
          <Label htmlFor="r2">Option 2</Label>
        </div>
      </>
    ),''',
        'extra': '''
export const Empty: Story = { args: { children: <></> } };
''',
    },

    'rating': {
        'comp': 'Rating',
        'title': 'UI/Rating',
        'imports': '''import { Rating } from "@/components/ui/rating";''',
        'default_args': 'value: 3, total: 5,',
        'extra': '''
export const Empty: Story = { args: { value: 0, total: 5 } };
export const Full: Story = { args: { value: 5, total: 5 } };
''',
    },

    'resizable': {
        'comp': 'Resizable',
        'title': 'UI/Resizable',
        'imports': '''import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";''',
        'default_args': '''children: (
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel>Panel 1</ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>Panel 2</ResizablePanel>
      </ResizablePanelGroup>
    ),''',
        'extra': '',
        'comp_for_meta': 'ResizablePanelGroup',
    },

    'scroll-area': {
        'comp': 'ScrollArea',
        'title': 'UI/ScrollArea',
        'imports': '''import { ScrollArea } from "@/components/ui/scroll-area";''',
        'default_args': '''className: "h-72 w-48 rounded-md border",
    children: (
      <div className="p-4">
        <h4 className="mb-4 text-sm font-medium leading-none">Tags</h4>
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="text-sm">v1.2.{i}</div>
        ))}
      </div>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: { className: "h-72 w-48 rounded-md border", children: <div className="p-4"><p>No items</p></div> },
};
''',
    },

    'select': {
        'comp': 'Select',
        'title': 'UI/Select',
        'imports': '''import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";''',
        'default_args': '''children: (
      <>
        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: {
    children: (<><SelectTrigger><SelectValue placeholder="No options" /></SelectTrigger><SelectContent /></>),
  },
};
''',
    },

    'separator': {
        'comp': 'Separator',
        'title': 'UI/Separator',
        'imports': '''import { Separator } from "@/components/ui/separator";''',
        'default_args': '',
        'extra': '''
export const Vertical: Story = { args: { orientation: "vertical", className: "h-5" } };
''',
    },

    'sheet': {
        'comp': 'Sheet',
        'title': 'UI/Sheet',
        'imports': '''import { Sheet } from "@/components/ui/sheet";''',
        'default_args': '',
        'extra': '',
    },

    'skeleton': {
        'comp': 'Skeleton',
        'title': 'UI/Skeleton',
        'imports': '''import { Skeleton } from "@/components/ui/skeleton";''',
        'default_args': 'className: "h-12 w-12 rounded-full",',
        'extra': '''
export const Rectangle: Story = { args: { className: "h-12 w-full" } };
export const CardSkeleton: Story = {
  args: {
    className: "h-40 w-full rounded-lg",
  },
  render: () => (
    <div className="flex flex-col space-y-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[250px]" />
        <Skeleton className="h-4 w-[200px]" />
      </div>
    </div>
  ),
};
''',
    },

    'slider': {
        'comp': 'Slider',
        'title': 'UI/Slider',
        'imports': '''import { Slider } from "@/components/ui/slider";''',
        'default_args': 'defaultValue: [50], max: 100, step: 1,',
        'extra': '''
export const Empty: Story = { args: { defaultValue: [0], max: 100 } };
export const Full: Story = { args: { defaultValue: [100], max: 100 } };
export const WithTooltip: Story = { args: { defaultValue: [30], max: 100, showTooltip: true } };
''',
    },

    'sonner': {
        'comp': 'Sonner',
        'title': 'UI/Sonner',
        'imports': '''import { Sonner } from "@/components/ui/sonner";''',
        'default_args': '',
        'extra': '',
    },

    'steps': {
        'comp': 'Steps',
        'title': 'UI/Steps',
        'imports': '''import { Steps } from "@/components/ui/steps";''',
        'default_args': '',
        'extra': '',
    },

    'switch': {
        'comp': 'Switch',
        'title': 'UI/Switch',
        'imports': '''import { Switch } from "@/components/ui/switch";''',
        'default_args': '',
        'extra': '''
export const Empty: Story = { args: {} };
export const Checked: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledChecked: Story = { args: { disabled: true, defaultChecked: true } };
''',
    },

    'table': {
        'comp': 'Table',
        'title': 'UI/Table',
        'imports': '''import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";''',
        'default_args': '''children: (
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
    ),''',
        'extra': '''
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
''',
    },

    'tabs': {
        'comp': 'Tabs',
        'title': 'UI/Tabs',
        'imports': '''import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";''',
        'default_args': '''defaultValue: "tab1",
    children: (
      <>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: {
    defaultValue: "tab1",
    children: (<><TabsList><TabsTrigger value="tab1">Tab 1</TabsTrigger></TabsList><TabsContent value="tab1" /></>),
  },
};
''',
    },

    'textarea': {
        'comp': 'Textarea',
        'title': 'UI/Textarea',
        'imports': '''import { Textarea } from "@/components/ui/textarea";''',
        'default_args': 'placeholder: "Type your message here...",',
        'extra': '''
export const Empty: Story = { args: { placeholder: "Empty", value: "" } };
export const Loading: Story = { args: { placeholder: "Loading...", disabled: true } };
export const Error: Story = { args: { placeholder: "Error state", className: "border-destructive" } };
export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } };
export const LongContent: Story = { args: { defaultValue: "This is a very long textarea value.\\n".repeat(10) } };
''',
    },

    'timeline': {
        'comp': 'Timeline',
        'title': 'UI/Timeline',
        'imports': '''import { Timeline } from "@/components/ui/timeline";''',
        'default_args': '',
        'extra': '',
    },

    'toast': {
        'comp': 'Toast',
        'title': 'UI/Toast',
        'imports': '''import { Toast } from "@/components/ui/toast";''',
        'default_args': '',
        'extra': '',
    },

    'toaster': {
        'comp': 'Toaster',
        'title': 'UI/Toaster',
        'imports': '''import { Toaster } from "@/components/ui/toaster";''',
        'default_args': '',
        'extra': '',
    },

    'toggle': {
        'comp': 'Toggle',
        'title': 'UI/Toggle',
        'imports': '''import { Toggle } from "@/components/ui/toggle";''',
        'default_args': 'children: "Toggle",',
        'extra': '''
export const Empty: Story = { args: { children: "" } };
export const Pressed: Story = { args: { defaultPressed: true, children: "Pressed" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };
''',
    },

    'tooltip': {
        'comp': 'Tooltip',
        'title': 'UI/Tooltip',
        'imports': '''import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";''',
        'default_args': '''children: (
      <TooltipProvider>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent><p>Tooltip content</p></TooltipContent>
      </TooltipProvider>
    ),''',
        'extra': '''
export const Error: Story = {
  args: {
    children: (
      <TooltipProvider>
        <TooltipTrigger>Error</TooltipTrigger>
        <TooltipContent><p className="text-destructive">Error message</p></TooltipContent>
      </TooltipProvider>
    ),
  },
};
''',
    },

    'tree': {
        'comp': 'Tree',
        'title': 'UI/Tree',
        'imports': '''import { Tree } from "@/components/ui/tree";''',
        'default_args': '',
        'extra': '',
    },

    'watermark': {
        'comp': 'Watermark',
        'title': 'UI/Watermark',
        'imports': '''import { Watermark } from "@/components/ui/watermark";''',
        'default_args': '''content: "Watermark",
    children: <div className="h-48 w-full bg-default-100 rounded-lg" />,''',
        'extra': '''
export const Empty: Story = {
  args: { content: "", children: <div className="h-48 w-full bg-default-100 rounded-lg" /> },
};
export const Multiline: Story = {
  args: { content: ["Line 1", "Line 2"], children: <div className="h-48 w-full bg-default-100 rounded-lg" /> },
};
''',
    },

    'affix': {
        'comp': 'Affix',
        'title': 'UI/Affix',
        'imports': '''import { Affix } from "@/components/ui/affix";''',
        'default_args': '''children: <div className="bg-primary text-primary-foreground p-2 rounded">Affixed</div>,''',
        'extra': '',
    },

    'aspect-ratio': {
        'comp': 'AspectRatio',
        'title': 'UI/AspectRatio',
        'imports': '''import { AspectRatio } from "@/components/ui/aspect-ratio";''',
        'default_args': '''ratio: 16/9,
    children: <div className="bg-default-200 h-full w-full rounded" />,''',
        'extra': '',
    },

    'breadcrumbs': {
        'comp': 'Breadcrumbs',
        'title': 'UI/Breadcrumbs',
        'imports': '''import { Breadcrumbs } from "@/components/ui/breadcrumbs";''',
        'default_args': '',
        'extra': '',
    },

    'carousel': {
        'comp': 'Carousel',
        'title': 'UI/Carousel',
        'imports': '''import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";''',
        'default_args': '''children: (
      <CarouselContent>
        <CarouselItem><div className="p-4 bg-default-100 rounded">Item 1</div></CarouselItem>
        <CarouselItem><div className="p-4 bg-default-100 rounded">Item 2</div></CarouselItem>
        <CarouselItem><div className="p-4 bg-default-100 rounded">Item 3</div></CarouselItem>
      </CarouselContent>
    ),''',
        'extra': '''
export const Empty: Story = {
  args: { children: <CarouselContent /> },
};
''',
        'comp_for_meta': 'Carousel',
    },

    'cleave': {
        'comp': 'Cleave',
        'title': 'UI/Cleave',
        'imports': '''import { Cleave } from "@/components/ui/cleave";''',
        'default_args': 'placeholder: "Enter number...",',
        'extra': '',
    },

    'command': {
        'comp': 'Command',
        'title': 'UI/Command',
        'imports': '''import { Command, CommandInput, CommandList, CommandItem, CommandGroup } from "@/components/ui/command";''',
        'default_args': '''children: (
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
    ),''',
        'extra': '''
export const Empty: Story = {
  args: {
    children: (<><CommandInput placeholder="No results..." /><CommandList /></>),
  },
};
''',
    },
}

# Generate story files
count = 0
for filename, comp_data in components.items():
    comp_name = comp_data['comp']
    comp_for_meta = comp_data.get('comp_for_meta', comp_name)
    title = comp_data['title']
    imports = comp_data['imports']
    default_args = comp_data['default_args']
    extra = comp_data['extra']

    story_filename = f'{filename}.stories.tsx'
    story_path = os.path.join(stories_dir, story_filename)

    content = f'''import type {{ Meta, StoryObj }} from "@storybook/react";
{imports}

const meta: Meta<typeof {comp_for_meta}> = {{
  title: "{title}",
  component: {comp_for_meta},
  tags: ["autodocs"],
  argTypes: {{}},
}};

export default meta;
type Story = StoryObj<typeof {comp_for_meta}>;

export const Default: Story = {{
  args: {{
    {default_args}
  }},
}};
{extra}
'''

    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    print(f'Created: {story_filename}')

print(f'\nTotal stories created: {count}')
