"""Generate WIP page stories that don't directly import page components."""
import os

base_dir = r'e:\git-ai\smc-coworker-aios\portal'
stories_pages_dir = os.path.join(base_dir, 'stories', 'pages')

# Page definitions with WIP markers
pages = [
    ('dashboard/home', 'dashboard', 'DashboardPage', 'Pages/Dashboard/Home/Default'),
    ('dashboard/home', 'ecommerce', 'EcommercePage', 'Pages/Dashboard/Home/Ecommerce'),
    ('dashboard/home', 'project', 'ProjectPage', 'Pages/Dashboard/Home/Project'),
    ('dashboard/apps', 'calendar', 'CalendarPage', 'Pages/Dashboard/Apps/Calendar'),
    ('dashboard/apps', 'chat', 'ChatPage', 'Pages/Dashboard/Apps/Chat'),
    ('auth', 'login', 'LoginPage', 'Pages/Auth/Login'),
    ('auth', 'register', 'RegisterPage', 'Pages/Auth/Register'),
    ('auth', 'forgot', 'ForgotPage', 'Pages/Auth/Forgot'),
    ('error-page', '404', 'Error404Page', 'Pages/Error/404'),
    ('error-page', '500', 'Error500Page', 'Pages/Error/500'),
    ('error-page', '401', 'Error401Page', 'Pages/Error/401'),
    ('error-page', '403', 'Error403Page', 'Pages/Error/403'),
    ('utility', 'coming-soon', 'ComingSoonPage', 'Pages/Utility/ComingSoon'),
    ('utility', 'maintenance', 'MaintenancePage', 'Pages/Utility/Maintenance'),
]

WIP_TEMPLATE = '''import type {{ Meta, StoryObj }} from "@storybook/react";

const meta: Meta = {{
  title: "{title}",
  tags: ["autodocs"],
  parameters: {{
    layout: "fullscreen",
    docs: {{
      description: {{
        component: "⚠️ WIP: This page depends on Next.js runtime (server-only, route params). Rendered as placeholder until full mock support is added.",
      }},
    }},
  }},
}};

export default meta;
type Story = StoryObj;

export const Default: Story = {{
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border">
        <h2 className="text-xl font-semibold mb-2">{comp_name}</h2>
        <p className="text-muted-foreground">Page preview (WIP)</p>
        <p className="text-sm text-muted-foreground mt-2">Requires Next.js runtime mock for full rendering</p>
      </div>
    </div>
  ),
}};

export const Empty: Story = {{
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border">
        <h2 className="text-xl font-semibold mb-2">{comp_name} - Empty</h2>
        <p className="text-muted-foreground">No data loaded</p>
      </div>
    </div>
  ),
}};

export const Loading: Story = {{
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border">
        <h2 className="text-xl font-semibold mb-2">{comp_name} - Loading</h2>
        <div className="animate-pulse mt-4 space-y-2">
          <div className="h-4 bg-default-200 rounded w-48 mx-auto" />
          <div className="h-4 bg-default-200 rounded w-32 mx-auto" />
        </div>
      </div>
    </div>
  ),
}};

export const Error: Story = {{
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border border-destructive">
        <h2 className="text-xl font-semibold mb-2 text-destructive">{comp_name} - Error</h2>
        <p className="text-destructive">Failed to load page data</p>
      </div>
    </div>
  ),
}};

export const Forbidden: Story = {{
  render: () => (
    <div className="flex items-center justify-center h-screen bg-default-50">
      <div className="text-center p-8 bg-background rounded-lg shadow-lg border border-warning">
        <h2 className="text-xl font-semibold mb-2 text-warning">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to view this page</p>
      </div>
    </div>
  ),
}};
'''

count = 0
for subdir, filename, comp_name, title in pages:
    dir_path = os.path.join(stories_pages_dir, subdir)
    os.makedirs(dir_path, exist_ok=True)

    story_filename = f'{filename}.stories.tsx'
    story_path = os.path.join(dir_path, story_filename)

    content = WIP_TEMPLATE.format(title=title, comp_name=comp_name)

    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    rel_path = os.path.relpath(story_path, stories_pages_dir)
    print(f'Created: stories/pages/{rel_path}')

print(f'\nTotal WIP page stories created: {count}')
