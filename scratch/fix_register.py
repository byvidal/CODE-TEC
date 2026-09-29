import io

with io.open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all register.html links
content = content.replace('href="register.html"', 'href="#" class="open-register"')

# Inject the register modal just before the login modal
register_modal_html = """
<dialog id="register-modal" class="modal">
  <div class="modal-content">
    <span class="close" id="close-register">&times;</span>
    <h2>Crear cuenta</h2>
    <form id="register-form">
      <div class="input-group">
        <label for="reg-name">Nombre del productor</label>
        <input type="text" id="reg-name" required placeholder="Tu nombre">
      </div>
      <div class="input-group">
        <label for="reg-email">Correo electrónico</label>
        <input type="email" id="reg-email" required placeholder="contacto@empresa.com">
      </div>
      <div class="input-group">
        <label for="reg-password">Contraseña</label>
        <input type="password" id="reg-password" required placeholder="••••••••">
      </div>
      <button type="submit" class="btn" style="width:100%; margin-top:10px;">Comenzar a monitorear</button>
    </form>
  </div>
</dialog>
"""

if '<dialog id="login-modal"' in content and '<dialog id="register-modal"' not in content:
    content = content.replace('<dialog id="login-modal"', register_modal_html + '\n<dialog id="login-modal"')

# Inject the JS logic for the register modal
js_logic = """
  var registerModal = $('register-modal');
  var openRegBtns = document.querySelectorAll('.open-register');
  for (var i=0; i<openRegBtns.length; i++) {
    openRegBtns[i].onclick = function(e) { e.preventDefault(); registerModal.showModal(); };
  }
  if ($('close-register')) {
    $('close-register').onclick = function() { registerModal.close(); };
  }
  if ($('register-form')) {
    $('register-form').onsubmit = function(e) {
      e.preventDefault();
      window.location.href = 'setup.html';
    };
  }
"""

if 'var registerModal' not in content:
    content = content.replace("var loginModal = $('login-modal');", js_logic + "\n  var loginModal = $('login-modal');")

with io.open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Modification done.")
