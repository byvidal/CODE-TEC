import io
import re

with io.open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the double class issue: class="something" ... class="open-register"
# Since I replaced `href="register.html"` with `href="#" class="open-register"`
# The previous line looked like: `<a class="nav-link" href="register.html">`
# After replacement: `<a class="nav-link" href="#" class="open-register">`
# This is invalid HTML.

# Revert my bad replacement
content = content.replace('class="nav-link" href="#" class="open-register"', 'class="nav-link open-register" href="#"')
content = content.replace('class="btn" href="#" class="open-register"', 'class="btn open-register" href="#"')
content = content.replace('class="btn btn-ghost" href="#" class="open-register"', 'class="btn btn-ghost open-register" href="#"') # just in case

with io.open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed HTML class attributes.")
