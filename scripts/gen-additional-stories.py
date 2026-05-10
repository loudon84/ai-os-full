"""Generate additional composite component stories for missing components."""
import os

base_dir = r'e:\git-ai\smc-coworker-aios\portal'
stories_dir = os.path.join(base_dir, 'stories')

# Additional components discovered during exploration
additional = [
    # task-board/common/
    ('task-board', 'assign-list', 'AssignList', 'TaskBoard/Common/AssignList', '@/components/task-board/common/assign-list'),
    ('task-board', 'assign-members', 'AssignMembers', 'TaskBoard/Common/AssignMembers', '@/components/task-board/common/assign-members'),
    ('task-board', 'assign-tags', 'AssignTags', 'TaskBoard/Common/AssignTags', '@/components/task-board/common/assign-tags'),
    ('task-board', 'dependency', 'Dependency', 'TaskBoard/Common/Dependency', '@/components/task-board/common/dependency'),
    ('task-board', 'priority', 'Priority', 'TaskBoard/Common/Priority', '@/components/task-board/common/priority'),
    ('task-board', 'story-point', 'StoryPoint', 'TaskBoard/Common/StoryPoint', '@/components/task-board/common/story-point'),
    ('task-board', 'task-date', 'TaskDate', 'TaskBoard/Common/TaskDate', '@/components/task-board/common/task-date'),

    # task-board/task-list/
    ('task-board', 'task-table', 'TaskTable', 'TaskBoard/TaskList/TaskTable', '@/components/task-board/task-list/task-table'),
    ('task-board', 'task-list-index', 'TaskList', 'TaskBoard/TaskList/Index', '@/components/task-board/task-list'),

    # task-board/task-sheet/
    ('task-board', 'task-sheet-index', 'TaskSheet', 'TaskBoard/TaskSheet/Index', '@/components/task-board/task-sheet'),
    ('task-board', 'sheet-actions', 'SheetActions', 'TaskBoard/TaskSheet/SheetActions', '@/components/task-board/task-sheet/sheet-actions'),
    ('task-board', 'sheet-title-desc', 'SheetTitleDesc', 'TaskBoard/TaskSheet/SheetTitleDesc', '@/components/task-board/task-sheet/sheet-title-desc'),
    ('task-board', 'task-sheet-header', 'TaskSheetHeader', 'TaskBoard/TaskSheet/TaskSheetHeader', '@/components/task-board/task-sheet/task-sheet-header'),

    # task-board/task-sheet/comments/
    ('task-board', 'comment-footer', 'CommentFooter', 'TaskBoard/TaskSheet/CommentFooter', '@/components/task-board/task-sheet/comments/comment-footer'),
    ('task-board', 'comments-index', 'Comments', 'TaskBoard/TaskSheet/Comments', '@/components/task-board/task-sheet/comments'),

    # task-board/task-sheet/sub-tasks/
    ('task-board', 'add-sub-task', 'AddSubTask', 'TaskBoard/TaskSheet/AddSubTask', '@/components/task-board/task-sheet/sub-tasks/add-sub-task'),
    ('task-board', 'sub-tasks-index', 'SubTasks', 'TaskBoard/TaskSheet/SubTasks', '@/components/task-board/task-sheet/sub-tasks'),
    ('task-board', 'subtask-details', 'SubtaskDetails', 'TaskBoard/TaskSheet/SubtaskDetails', '@/components/task-board/task-sheet/sub-tasks/subtask-details'),
    ('task-board', 'subtask-header', 'SubtaskHeader', 'TaskBoard/TaskSheet/SubtaskHeader', '@/components/task-board/task-sheet/sub-tasks/subtask-header'),
    ('task-board', 'task-item', 'TaskItem', 'TaskBoard/TaskSheet/TaskItem', '@/components/task-board/task-sheet/sub-tasks/task-item'),

    # task-board/task-sheet/attachments/
    ('task-board', 'attachments-index', 'Attachments', 'TaskBoard/TaskSheet/Attachments', '@/components/task-board/task-sheet/attachments'),

    # partials/header/
    ('partials', 'header-index', 'Header', 'Partials/Header/Index', '@/components/partials/header'),
    ('partials', 'classic-header', 'ClassicHeader', 'Partials/Header/ClassicHeader', '@/components/partials/header/classic-header'),

    # partials/footer/
    ('partials', 'footer-index', 'Footer', 'Partials/Footer/Index', '@/components/partials/footer'),

    # partials/sidebar/
    ('partials', 'sidebar-index', 'Sidebar', 'Partials/Sidebar/Index', '@/components/partials/sidebar'),

    # partials/layout/
    ('partials', 'layout-index', 'Layout', 'Partials/Layout/Index', '@/components/partials/layout'),

    # partials/customizer/ additional
    ('partials', 'customizer-index', 'Customizer', 'Partials/Customizer/Index', '@/components/partials/customizer'),
    ('partials', 'theme-customizer', 'ThemeCustomizer', 'Partials/Customizer/ThemeCustomizer', '@/components/partials/customizer/theme-customizer'),
    ('partials', 'theme-change-customizer', 'ThemeChangeCustomizer', 'Partials/Customizer/ThemeChange', '@/components/partials/customizer/theme-change'),
    ('partials', 'mobile-footer', 'MobileFooter', 'Partials/Customizer/MobileFooter', '@/components/partials/customizer/mobile-footer'),
    ('partials', 'footer-layout', 'FooterLayout', 'Partials/Customizer/FooterLayout', '@/components/partials/customizer/footer-layout'),

    # landing-page/color-schemas/workload
    ('landing-page', 'workload', 'Workload', 'LandingPage/Workload', '@/components/landing-page/color-schemas/workload'),
]

# Data components that get Empty/Loading/Error states
data_comps = {
    'task-table', 'assign-list', 'assign-members', 'assign-tags',
    'board', 'add-task', 'task', 'task-header',
    'comments-index', 'sub-tasks-index', 'attachments-index',
}

count = 0
for subdir, filename, comp_name, title, import_path in additional:
    dir_path = os.path.join(stories_dir, subdir)
    os.makedirs(dir_path, exist_ok=True)

    story_filename = f'{filename}.stories.tsx'
    story_path = os.path.join(dir_path, story_filename)

    extra = ''
    if filename in data_comps:
        extra = '''
export const Empty: Story = {
  args: {},
  parameters: { docs: { description: { story: "Empty state with no data." } } },
};

export const Loading: Story = {
  args: {},
  parameters: { docs: { description: { story: "Loading state." } } },
};

export const Error: Story = {
  args: {},
  parameters: { docs: { description: { story: "Error state." } } },
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
{extra}
'''

    with open(story_path, 'w', encoding='utf-8') as f:
        f.write(content)

    count += 1
    rel_path = os.path.relpath(story_path, stories_dir)
    print(f'Created: stories/{rel_path}')

print(f'\nTotal additional stories created: {count}')
