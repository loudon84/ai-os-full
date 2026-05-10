"""Generate Storybook stories for page components with state-based naming."""
import os

base_dir = r'e:\git-ai\smc-coworker-aios\portal'
stories_pages_dir = os.path.join(base_dir, 'stories', 'pages')

# Page definitions: (subdir, filename, comp_name, title, import_path)
pages = [
    # Dashboard / Home
    ('dashboard/home', 'dashboard', 'DashboardPage', 'Pages/Dashboard/Home', '@/app/[lang]/(dashboard)/(home)/dashboard/page'),
    ('dashboard/home', 'ecommerce', 'EcommercePage', 'Pages/Dashboard/Home/Ecommerce', '@/app/[lang]/(dashboard)/(home)/ecommerce/page'),
    ('dashboard/home', 'project', 'ProjectPage', 'Pages/Dashboard/Home/Project', '@/app/[lang]/(dashboard)/(home)/project/page'),

    # Dashboard / Apps
    ('dashboard/apps', 'calendar', 'CalendarPage', 'Pages/Dashboard/Apps/Calendar', '@/app/[lang]/(dashboard)/(apps)/calendar/page'),
    ('dashboard/apps', 'chat', 'ChatPage', 'Pages/Dashboard/Apps/Chat', '@/app/[lang]/(dashboard)/(apps)/chat/page'),
    ('dashboard/apps', 'project', 'ProjectPage', 'Pages/Dashboard/Apps/Project', '@/app/[lang]/(dashboard)/(apps)/project/page'),
    ('dashboard/apps', 'user-profile', 'UserProfilePage', 'Pages/Dashboard/Apps/UserProfile', '@/app/[lang]/(dashboard)/(apps)/user-profile/page'),

    # Auth
    ('auth', 'login', 'LoginPage', 'Pages/Auth/Login', '@/app/[lang]/auth/(login)/login/page'),
    ('auth', 'register', 'RegisterPage', 'Pages/Auth/Register', '@/app/[lang]/auth/(register)/register/page'),
    ('auth', 'forgot', 'ForgotPage', 'Pages/Auth/Forgot', '@/app/[lang]/auth/(forgot)/forgot/page'),
    ('auth', 'lock', 'LockPage', 'Pages/Auth/Lock', '@/app/[lang]/auth/(lock)/lock/page'),
    ('auth', 'verify', 'VerifyPage', 'Pages/Auth/Verify', '@/app/[lang]/auth/(verify)/verify/page'),

    # Error Pages
    ('error-page', '404', 'Error404Page', 'Pages/Error/404', '@/app/[lang]/error-page/404/page'),
    ('error-page', '500', 'Error500Page', 'Pages/Error/500', '@/app/[lang]/error-page/500/page'),
    ('error-page', '401', 'Error401Page', 'Pages/Error/401', '@/app/[lang]/error-page/401/page'),
    ('error-page', '403', 'Error403Page', 'Pages/Error/403', '@/app/[lang]/error-page/403/page'),

    # Utility
    ('utility', 'coming-soon', 'ComingSoonPage', 'Pages/Utility/ComingSoon', '@/app/[lang]/utility/comming-soon/page'),
    ('utility', 'maintenance', 'MaintenancePage', 'Pages/Utility/Maintenance', '@/app/[lang]/utility/maintinance/page'),
]

# Fullscreen decorator template for pages
DECORATOR = '''
  decorators: [
    (Story) => (
      <div style={{ width: "100%", minHeight: "100vh" }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
'''

count = 0
for subdir, filename, comp_name, title, import_path in pages:
    dir_path = os.path.join(stories_pages_dir, subdir)
    os.makedirs(dir_path, exist_ok=True)

    story_filename = f'{filename}.stories.tsx'
    story_path = os.path.join(dir_path, story_filename)

    # Determine which state stories to generate based on page type
    is_error_page = subdir == 'error-page'
    is_auth_page = subdir == 'auth'
    is_utility_page = subdir == 'utility'

    # Build state stories
    state_stories = ''

    if is_error_page:
        # Error pages have Default + Forbidden variants
        state_stories = '''
export const Default: Story = {
  args: { params: { lang: "en" } },
};

export const Forbidden: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Permission denied / forbidden access state.",
      },
    },
  },
};
'''
    elif is_auth_page:
        # Auth pages have Default + Error + Loading states
        state_stories = '''
export const Default: Story = {
  args: { params: { lang: "en" } },
};

export const Loading: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Loading state during authentication.",
      },
    },
  },
};

export const Error: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Error state - invalid credentials or server error.",
      },
    },
  },
};
'''
    else:
        # Dashboard and other pages have Default + Empty + Loading + Error + Forbidden
        state_stories = '''
export const Default: Story = {
  args: { params: { lang: "en" } },
};

export const Empty: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Empty state with no data loaded.",
      },
    },
  },
};

export const Loading: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Loading state while fetching data.",
      },
    },
  },
};

export const Error: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Error state when data fails to load.",
      },
    },
  },
};

export const Forbidden: Story = {
  args: { params: { lang: "en" } },
  parameters: {
    docs: {
      description: {
        story: "Permission denied - user lacks required access.",
      },
    },
  },
};
'''

    content = f'''import type {{ Meta, StoryObj }} from "@storybook/react";
import {{ {comp_name} }} from "{import_path}";

const meta: Meta<typeof {comp_name}> = {{
  title: "{title}",
  component: {comp_name},
  tags: ["autodocs"],
  argTypes: {{}},
  {DECORATOR}
}};

export default meta;
type Story = StoryObj<typeof {comp_name}>;

{state_stories}
'''

    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    rel_path = os.path.relpath(story_path, stories_pages_dir)
    print(f'Created: stories/pages/{rel_path}')

print(f'\nTotal page stories created: {count}')
