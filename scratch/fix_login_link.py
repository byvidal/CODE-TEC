import io

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
reg_path = base_dir + r"\register.html"
idx_path = base_dir + r"\index.html"

# Fix register.html
with io.open(reg_path, 'r', encoding='utf-8') as f:
    reg_content = f.read()

reg_content = reg_content.replace('href="login.html"', 'href="index.html#login"')

with io.open(reg_path, 'w', encoding='utf-8') as f:
    f.write(reg_content)

# Fix index.html
with io.open(idx_path, 'r', encoding='utf-8') as f:
    idx_content = f.read()

if "window.location.hash === '#login'" not in idx_content:
    js_addition = """
  var loginModal = $('login-modal');
  if (window.location.hash === '#login') {
      loginModal.showModal();
  }
"""
    idx_content = idx_content.replace("var loginModal = $('login-modal');", js_addition)

    with io.open(idx_path, 'w', encoding='utf-8') as f:
        f.write(idx_content)

print("Login link fixed.")
