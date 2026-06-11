import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

# Let's count tags and see if there are any nested div class="dashboard-panel"
# We can do this by scanning the document and keeping track of open/close div tags.
# But an easier way: let's parse using BeautifulSoup if it's available, or a simple regex parser.

# Let's write a simple stack-based parser to find nested elements
# We find all `<div` and `</div` tags, and keep track of their classes.

div_pattern = re.compile(r'<(div|/div)[^>]*>', re.IGNORECASE)

stack = []
nested_panels = []

for match in div_pattern.finditer(content):
    tag = match.group(0)
    is_closing = tag.startswith('</')
    
    if not is_closing:
        # Extract class attribute
        class_match = re.search(r'class=["\']([^"\']*)["\']', tag)
        classes = class_match.group(1).split() if class_match else []
        
        is_panel = 'dashboard-panel' in classes
        panel_id = re.search(r'id=["\']([^"\']*)["\']', tag)
        panel_id_str = panel_id.group(1) if panel_id else 'no-id'
        
        stack.append({'is_panel': is_panel, 'id': panel_id_str, 'tag': tag})
        
        # Check if this panel is nested inside another panel
        if is_panel:
            panels_in_stack = [item for item in stack[:-1] if item['is_panel']]
            if panels_in_stack:
                nested_panels.append({
                    'panel': panel_id_str,
                    'ancestors': [item['id'] for item in panels_in_stack]
                })
    else:
        # Find the matching opening div
        if stack:
            stack.pop()

print("Nested panels found:")
for np in nested_panels:
    print(f"Panel '{np['panel']}' is inside: {np['ancestors']}")
