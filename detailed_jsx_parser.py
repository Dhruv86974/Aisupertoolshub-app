import sys

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's write a parser that scans the content character by character
# and tracks:
# - whether we are in a single-line comment (//)
# - whether we are in a multi-line comment (/*)
# - whether we are in a single-quoted string ('')
# - whether we are in a double-quoted string ("")
# - whether we are in a template literal (``)
# - brace stack for {}
# - paren stack for ()
# - tag stack for JSX tags (only when in JSX context, i.e., braces are balanced or we are inside a tag)

# Let's find exactly where the activeTool block starts (approx line 3190)
# and keep track of braces and parens.
# In fact, we can print the state of stacks for every line!

lines = content.split('\n')
brace_stack = []  # stores line numbers where { was opened
paren_stack = []  # stores line numbers where ( was opened

in_single_comment = False
in_multi_comment = False
in_single_str = False
in_double_str = False
in_template_str = False

for idx, line in enumerate(lines):
    line_num = idx + 1
    
    # We only care about lines 3190 to 4280 for now
    if line_num < 3190 or line_num > 4280:
        continue
        
    i = 0
    n = len(line)
    while i < n:
        # Check for comments / strings escape
        if in_single_comment:
            break # rest of line is comment
            
        if in_multi_comment:
            if i + 1 < n and line[i] == '*' and line[i+1] == '/':
                in_multi_comment = False
                i += 2
            else:
                i += 1
            continue
            
        if in_single_str:
            if line[i] == '\\':
                i += 2
            elif line[i] == "'":
                in_single_str = False
                i += 1
            else:
                i += 1
            continue
            
        if in_double_str:
            if line[i] == '\\':
                i += 2
            elif line[i] == '"':
                in_double_str = False
                i += 1
            else:
                i += 1
            continue
            
        if in_template_str:
            if line[i] == '\\':
                i += 2
            elif line[i] == '`':
                in_template_str = False
                i += 1
            else:
                i += 1
            continue
            
        # Check for starting comments
        if i + 1 < n and line[i] == '/' and line[i+1] == '/':
            in_single_comment = True
            break
            
        if i + 1 < n and line[i] == '/' and line[i+1] == '*':
            in_multi_comment = True
            i += 2
            continue
            
        # Check for starting strings
        if line[i] == "'":
            in_single_str = True
            i += 1
            continue
        if line[i] == '"':
            in_double_str = True
            i += 1
            continue
        if line[i] == '`':
            in_template_str = True
            i += 1
            continue
            
        # Track braces and parens
        if line[i] == '{':
            brace_stack.append(line_num)
        elif line[i] == '}':
            if brace_stack:
                brace_stack.pop()
            else:
                print(f"Excess }} at line {line_num}")
                
        elif line[i] == '(':
            paren_stack.append(line_num)
        elif line[i] == ')':
            if paren_stack:
                paren_stack.pop()
            else:
                print(f"Excess ) at line {line_num}")
                
        i += 1
        
    in_single_comment = False # reset at end of line
    
    # Print state at interesting lines
    if line_num in [3191, 3194, 3554, 3631, 3915, 4243, 4274, 4275, 4276]:
        print(f"Line {line_num}: brace_stack size={len(brace_stack)} {brace_stack[-3:]}, paren_stack size={len(paren_stack)} {paren_stack[-3:]}")
