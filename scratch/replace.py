import io

with io.open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

modal_html = """
<dialog id="login-modal" class="modal">
  <div class="modal-content">
    <span class="close" id="close-login">&times;</span>
    <h2>Iniciar sesión</h2>
    <form id="login-form">
      <div class="input-group">
        <label for="login-email">Correo electrónico</label>
        <input type="email" id="login-email" required placeholder="demo@hackaton.com">
      </div>
      <div class="input-group">
        <label for="login-password">Contraseña</label>
        <input type="password" id="login-password" required placeholder="••••••••">
      </div>
      <button type="submit" class="btn" style="width:100%; margin-top:10px;">Entrar al panel</button>
      <p id="login-error" style="color:var(--danger); display:none; font-size:0.9em; margin-top:10px;">Credenciales incorrectas.</p>
    </form>
  </div>
</dialog>
<footer>
"""

content = content.replace('<footer>', modal_html)

js_logic = """
  var loginModal = $('login-modal');
  if ($('open-login')) {
    $('open-login').onclick = function(e) { e.preventDefault(); loginModal.showModal(); };
  }
  if ($('close-login')) {
    $('close-login').onclick = function() { loginModal.close(); };
  }
  if ($('login-form')) {
    $('login-form').onsubmit = function(e) {
      e.preventDefault();
      var email = $('login-email').value;
      if (email.includes('@')) {
        window.location.href = 'dashboard.html';
      } else {
        $('login-error').style.display = 'block';
      }
    };
  }
"""

content = content.replace('var $=function(i){return document.getElementById(i)};', 'var $=function(i){return document.getElementById(i)};\n' + js_logic)

with io.open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
