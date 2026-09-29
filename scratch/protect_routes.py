import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"

protected_pages = [
    'dashboard.html',
    'zone.html',
    'alerts.html',
    'history.html',
    'actuators.html',
    'automation.html',
    'settings.html',
    'setup.html'
]

auth_script = """<script>
    // Security Auth Check
    if (localStorage.getItem('edafonex_auth') !== 'true') {
        window.location.replace('index.html#login');
    }
</script>
"""

# Protect the pages
for page in protected_pages:
    path = os.path.join(base_dir, page)
    if os.path.exists(path):
        with io.open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Inject just after <head>
        if "edafonex_auth" not in content and "<head>" in content:
            content = content.replace("<head>", "<head>\n    " + auth_script)
            with io.open(path, 'w', encoding='utf-8') as f:
                f.write(content)

# Update index.html login
idx_path = os.path.join(base_dir, 'index.html')
if os.path.exists(idx_path):
    with io.open(idx_path, 'r', encoding='utf-8') as f:
        idx_content = f.read()
    
    if "localStorage.setItem('edafonex_auth'" not in idx_content:
        idx_content = idx_content.replace(
            "if (email.includes('@')) {",
            "if (email.includes('@')) {\n          localStorage.setItem('edafonex_auth', 'true');"
        )
        with io.open(idx_path, 'w', encoding='utf-8') as f:
            f.write(idx_content)

# Update register.html registration
reg_path = os.path.join(base_dir, 'register.html')
if os.path.exists(reg_path):
    with io.open(reg_path, 'r', encoding='utf-8') as f:
        reg_content = f.read()
    
    if "localStorage.setItem('edafonex_auth'" not in reg_content:
        reg_content = reg_content.replace(
            "window.location.href='setup.html?'+q.toString();",
            "localStorage.setItem('edafonex_auth', 'true');\n    window.location.href='setup.html?'+q.toString();"
        )
        # Handle the alternative register.html structure if I rewrote it
        reg_content = reg_content.replace(
            "window.location.href = 'setup.html';",
            "localStorage.setItem('edafonex_auth', 'true');\n      window.location.href = 'setup.html';"
        )
        with io.open(reg_path, 'w', encoding='utf-8') as f:
            f.write(reg_content)

# Add logout button to settings.html
set_path = os.path.join(base_dir, 'settings.html')
if os.path.exists(set_path):
    with io.open(set_path, 'r', encoding='utf-8') as f:
        set_content = f.read()
    
    logout_html = """
        <div class="panel" style="border-color: #6b7280; margin-top: 20px;">
            <div class="panel-head">
                <strong style="color: #6b7280;">Cuenta</strong>
            </div>
            <button class="btn" style="width:100%; background: #6b7280; color: white; padding:15px; font-size:1.1rem;" onclick="logout()">🚪 Cerrar Sesión</button>
        </div>
        
        <script>
            function logout() {
                localStorage.removeItem('edafonex_auth');
                window.location.replace('index.html');
            }
        </script>
"""
    # Just append it before the ending tags if it doesn't exist
    if "function logout()" not in set_content:
        end_body = set_content.find('</div>\n</div>\n<script>')
        if end_body != -1:
            set_content = set_content[:end_body] + logout_html + set_content[end_body:]
            with io.open(set_path, 'w', encoding='utf-8') as f:
                f.write(set_content)

print("Auth protection applied to frontend.")
