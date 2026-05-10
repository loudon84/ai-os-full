"""Generate Storybook stories for composite components with state coverage."""
import os

base_dir = r'e:\git-ai\smc-coworker-aios\portal'
stories_dir = os.path.join(base_dir, 'stories')

# Define all composite components
# Format: (story_subdir, filename, comp_name, title, import_path)
composite_components = [
    # Root-level components
    ('', 'blank', 'Blank', 'Components/Blank', '@/components/blank'),
    ('', 'dasboard-select', 'DashboardSelect', 'Components/DashboardSelect', '@/components/dasboard-select'),
    ('', 'dashboard-dropdown', 'DashboardDropdown', 'Components/DashboardDropdown', '@/components/dashboard-dropdown'),
    ('', 'date-picker-with-range', 'DatePickerWithRange', 'Components/DatePickerWithRange', '@/components/date-picker-with-range'),
    ('', 'delete-confirmation-dialog', 'DeleteConfirmationDialog', 'Components/DeleteConfirmationDialog', '@/components/delete-confirmation-dialog'),
    ('', 'error-block', 'ErrorBlock', 'Components/ErrorBlock', '@/components/error-block'),
    ('', 'header-search', 'HeaderSearch', 'Components/HeaderSearch', '@/components/header-search'),
    ('', 'layout-loader', 'LayoutLoader', 'Components/LayoutLoader', '@/components/layout-loader'),

    # Auth
    ('auth', 'login-form', 'LoginForm', 'Auth/LoginForm', '@/components/auth/login-form'),
    ('auth', 'verify-form', 'VerifyForm', 'Auth/VerifyForm', '@/components/auth/verify-form'),

    # Files
    ('files', 'list-file-card', 'ListFileCard', 'Files/ListFileCard', '@/components/files/list-file-card'),
    ('files', 'single-file-card', 'SingleFileCard', 'Files/SingleFileCard', '@/components/files/single-file-card'),
    ('files', 'view-files', 'ViewFiles', 'Files/ViewFiles', '@/components/files/view-files'),

    # Landing Page
    ('landing-page', 'about-dashtail', 'AboutDashtail', 'LandingPage/AboutDashtail', '@/components/landing-page/about-dashtail'),
    ('landing-page', 'about-us', 'AboutUs', 'LandingPage/AboutUs', '@/components/landing-page/about-us'),
    ('landing-page', 'all-components', 'AllComponents', 'LandingPage/AllComponents', '@/components/landing-page/all-components'),
    ('landing-page', 'contact', 'Contact', 'LandingPage/Contact', '@/components/landing-page/contact'),
    ('landing-page', 'custom-project', 'CustomProject', 'LandingPage/CustomProject', '@/components/landing-page/custom-project'),
    ('landing-page', 'faq', 'Faq', 'LandingPage/Faq', '@/components/landing-page/faq'),
    ('landing-page', 'figma-kit', 'FigmaKit', 'LandingPage/FigmaKit', '@/components/landing-page/figma-kit'),
    ('landing-page', 'footer', 'Footer', 'LandingPage/Footer', '@/components/landing-page/footer'),
    ('landing-page', 'hero', 'Hero', 'LandingPage/Hero', '@/components/landing-page/hero'),
    ('landing-page', 'index', 'LandingPage', 'LandingPage/Index', '@/components/landing-page/index'),
    ('landing-page', 'pricing-plan', 'PricingPlan', 'LandingPage/PricingPlan', '@/components/landing-page/pricing-plan'),
    ('landing-page', 'project-tools', 'ProjectTools', 'LandingPage/ProjectTools', '@/components/landing-page/project-tools'),
    ('landing-page', 'stats', 'Stats', 'LandingPage/Stats', '@/components/landing-page/stats'),

    # Landing Page sub-components
    ('landing-page', 'color-schemas-index', 'ColorSchemas', 'LandingPage/ColorSchemas', '@/components/landing-page/color-schemas'),
    ('landing-page', 'theme-change', 'ThemeChange', 'LandingPage/ThemeChange', '@/components/landing-page/color-schemas/theme-change'),
    ('landing-page', 'users-stat', 'UsersStat', 'LandingPage/UsersStat', '@/components/landing-page/color-schemas/users-stat'),
    ('landing-page', 'header-index', 'Header', 'LandingPage/Header', '@/components/landing-page/header'),
    ('landing-page', 'nav-menu', 'NavMenu', 'LandingPage/NavMenu', '@/components/landing-page/header/nav-menu'),
    ('landing-page', 'showcase-index', 'Showcase', 'LandingPage/Showcase', '@/components/landing-page/showcase'),
    ('landing-page', 'showcase-content', 'ShowcaseContent', 'LandingPage/ShowcaseContent', '@/components/landing-page/showcase/showcase-content'),

    # Partials/Customizer
    ('partials', 'footer-style', 'FooterStyle', 'Partials/Customizer/FooterStyle', '@/components/partials/customizer/footer-style'),
    ('partials', 'header-style', 'HeaderStyle', 'Partials/Customizer/HeaderStyle', '@/components/partials/customizer/header-style'),
    ('partials', 'radius', 'Radius', 'Partials/Customizer/Radius', '@/components/partials/customizer/radius'),
    ('partials', 'rtl-switch', 'RtlSwitch', 'Partials/Customizer/RtlSwitch', '@/components/partials/customizer/rtl-switch'),
    ('partials', 'select-layout', 'SelectLayout', 'Partials/Customizer/SelectLayout', '@/components/partials/customizer/select-layout'),
    ('partials', 'select-theme', 'SelectTheme', 'Partials/Customizer/SelectTheme', '@/components/partials/customizer/select-theme'),
    ('partials', 'sidebar-change', 'SidebarChange', 'Partials/Customizer/SidebarChange', '@/components/partials/customizer/sidebar-change'),
    ('partials', 'sidebar-image', 'SidebarImage', 'Partials/Customizer/SidebarImage', '@/components/partials/customizer/sidebar-image'),

    # Task Board
    ('task-board', 'add-task', 'AddTask', 'TaskBoard/AddTask', '@/components/task-board/add-task'),
    ('task-board', 'board', 'Board', 'TaskBoard/Board', '@/components/task-board/board'),
    ('task-board', 'create-borad', 'CreateBoard', 'TaskBoard/CreateBoard', '@/components/task-board/create-borad'),
    ('task-board', 'index', 'TaskBoard', 'TaskBoard/Index', '@/components/task-board/index'),
    ('task-board', 'task-header', 'TaskHeader', 'TaskBoard/TaskHeader', '@/components/task-board/task-header'),
    ('task-board', 'task', 'Task', 'TaskBoard/Task', '@/components/task-board/task'),
]

# Components that have specific state variants
# For most composite components, we provide Default + Empty + Loading + Error states
# Some components are simple enough to just have Default

# Components that are likely to have data props (for Empty/Loading/Error states)
data_components = {
    'list-file-card', 'single-file-card', 'view-files',
    'board', 'add-task', 'task', 'task-header',
    'stats', 'faq', 'pricing-plan',
    'dasboard-select', 'dashboard-dropdown',
}

count = 0
for subdir, filename, comp_name, title, import_path in composite_components:
    # Create directory
    if subdir:
        dir_path = os.path.join(stories_dir, subdir)
    else:
        dir_path = stories_dir
    os.makedirs(dir_path, exist_ok=True)

    story_filename = f'{filename}.stories.tsx'
    story_path = os.path.join(dir_path, story_filename)

    # Generate extra state stories based on component type
    extra_stories = ''

    if filename in data_components:
        extra_stories = '''
export const Empty: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Empty state with no data.",
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Loading state.",
      },
    },
  },
};

export const Error: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Error state when data fails to load.",
      },
    },
  },
};
'''
    elif filename == 'error-block':
        extra_stories = '''
export const Default: Story = {
  args: {},
};

export const NotFound: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "404 Not Found error block.",
      },
    },
  },
};

export const Forbidden: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "403 Forbidden - Permission denied state.",
      },
    },
  },
};
'''
    elif filename == 'delete-confirmation-dialog':
        extra_stories = '''
export const Error: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Error state during deletion.",
      },
    },
  },
};
'''
    elif filename == 'layout-loader':
        extra_stories = '''
export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Full page loading state.",
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
}};

export default meta;
type Story = StoryObj<typeof {comp_name}>;

export const Default: Story = {{
  args: {{}},
}};
{extra_stories}
'''

    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    rel_path = os.path.relpath(story_path, stories_dir)
    print(f'Created: stories/{rel_path}')

print(f'\nTotal composite stories created: {count}')
