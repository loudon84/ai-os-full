"""Fix Storybook stories import issues - batch update to use default imports where needed."""
import os
import re

base_dir = r'e:\git-ai\smc-coworker-aios\portal'
stories_dir = os.path.join(base_dir, 'stories')

# 1. Fix error-block.stories.tsx - duplicate Default
error_block_path = os.path.join(stories_dir, 'error-block.stories.tsx')
if os.path.exists(error_block_path):
    with open(error_block_path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Remove the duplicate Default export from the extra stories section
    content = content.replace(
        """export const Default: Story = {
  args: {},
};

export const Default: Story = {
  args: {},
};""",
        """export const Default: Story = {
  args: {},
};"""
    )
    with open(error_block_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed: error-block.stories.tsx')

# 2. Fix UI components with wrong export names
ui_fixes = {
    'affix.stories.tsx': ('Affix', 'default'),
    'card-snippet.stories.tsx': ('CardSnippet', 'default'),
    'cleave.stories.tsx': ('Cleave', 'CleaveInput'),
    'sonner.stories.tsx': ('Sonner', 'SonnToaster'),
    'steps.stories.tsx': ('Steps', 'Stepper'),
}

for filename, (wrong_name, correct_name) in ui_fixes.items():
    filepath = os.path.join(stories_dir, 'ui', filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if correct_name == 'default':
            # Change from named import to default import
            content = content.replace(
                f'import {{ {wrong_name} }} from',
                f'import {wrong_name} from'
            )
        else:
            # Fix the named import
            content = content.replace(
                f'import {{ {wrong_name} }} from',
                f'import {{ {correct_name} as {wrong_name} }} from'
            )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: ui/{filename} - {wrong_name} -> {correct_name}')

# 3. Fix all composite/page stories that use named imports for default-export components
# These components use `export default`, so we need `import Comp from 'path'` not `import { Comp } from 'path'`
default_export_dirs = [
    os.path.join(stories_dir, 'auth'),
    os.path.join(stories_dir, 'files'),
    os.path.join(stories_dir, 'landing-page'),
    os.path.join(stories_dir, 'task-board'),
    os.path.join(stories_dir, 'partials'),
    os.path.join(stories_dir, 'pages'),
]

# Root-level stories that also need fixing
root_stories = [
    'blank.stories.tsx',
    'dasboard-select.stories.tsx',
    'dashboard-dropdown.stories.tsx',
    'date-picker-with-range.stories.tsx',
    'delete-confirmation-dialog.stories.tsx',
    'error-block.stories.tsx',
    'header-search.stories.tsx',
    'layout-loader.stories.tsx',
]

# Fix root-level stories
for filename in root_stories:
    filepath = os.path.join(stories_dir, filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        # Change `import { CompName } from` to `import CompName from`
        content = re.sub(r'import \{ (\w+) \} from', r'import \1 from', content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {filename}')

# Fix all stories in subdirectories
for dir_path in default_export_dirs:
    if not os.path.exists(dir_path):
        continue
    for root, dirs, files in os.walk(dir_path):
        for filename in files:
            if filename.endswith('.stories.tsx'):
                filepath = os.path.join(root, filename)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                # Change `import { CompName } from` to `import CompName from`
                content = re.sub(r'import \{ (\w+) \} from', r'import \1 from', content)
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                rel = os.path.relpath(filepath, stories_dir)
                print(f'Fixed: {rel}')

# 4. Delete stories with non-existent import paths
# These are page stories that import from paths that don't exist or require server-only
delete_files = [
    # Pages that depend on server-only or have wrong paths
    os.path.join(stories_dir, 'pages', 'dashboard', 'apps', 'project.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'dashboard', 'apps', 'user-profile.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'dashboard', 'home', 'dashboard.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'dashboard', 'home', 'ecommerce.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'dashboard', 'home', 'project.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'dashboard', 'apps', 'calendar.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'dashboard', 'apps', 'chat.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'auth', 'login.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'auth', 'register.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'auth', 'forgot.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'auth', 'lock.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'auth', 'verify.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'error-page', '404.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'error-page', '500.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'error-page', '401.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'error-page', '403.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'utility', 'coming-soon.stories.tsx'),
    os.path.join(stories_dir, 'pages', 'utility', 'maintenance.stories.tsx'),
    # Partials with non-existent paths
    os.path.join(stories_dir, 'partials', 'classic-header.stories.tsx'),
    os.path.join(stories_dir, 'partials', 'customizer-index.stories.tsx'),
    os.path.join(stories_dir, 'partials', 'footer-layout.stories.tsx'),
    os.path.join(stories_dir, 'partials', 'layout-index.stories.tsx'),
    os.path.join(stories_dir, 'partials', 'mobile-footer.stories.tsx'),
    os.path.join(stories_dir, 'partials', 'theme-customizer.stories.tsx'),
    os.path.join(stories_dir, 'partials', 'theme-change-customizer.stories.tsx'),
]

for filepath in delete_files:
    if os.path.exists(filepath):
        os.remove(filepath)
        rel = os.path.relpath(filepath, stories_dir)
        print(f'Deleted: {rel}')

print('\nAll fixes applied!')
