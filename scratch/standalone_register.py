import io
import re
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"

def write_file(name, content):
    with io.open(os.path.join(base_dir, name), 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")

# 1. Generate new register.html
register_html = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crear Cuenta - EDAFONEX</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        body { background-color: #f4f6f8; }
        .header-simple { background: var(--leaf); padding: 20px; text-align: center; color: white; }
        .header-simple a { color: white; text-decoration: none; font-size: 1.5em; font-weight: bold; }
        .container-lg { max-width: 1000px; margin: 40px auto; padding: 0 20px; }
        
        .form-section { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 30px; }
        .form-section h2 { margin-top: 0; color: var(--ink); border-bottom: 2px solid var(--line); padding-bottom: 10px; margin-bottom: 20px; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .input-group { margin-bottom: 15px; }
        .input-group label { display: block; font-weight: 500; margin-bottom: 5px; color: var(--ink); }
        .input-group input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 1em; box-sizing: border-box; }
        .input-group input:focus { border-color: var(--leaf); outline: none; }
        
        /* Plans */
        .plans-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
        .plan-card { border: 2px solid var(--line); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; background: #fff; position: relative; }
        .plan-card:hover { border-color: var(--leaf); transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.1); }
        .plan-card.selected { border-color: var(--leaf); background: color-mix(in srgb, var(--leaf) 5%, transparent); box-shadow: 0 0 0 2px var(--leaf); }
        .plan-card h3 { margin: 0 0 10px 0; font-size: 1.4em; }
        .plan-price { font-size: 2em; font-weight: bold; color: var(--leaf); margin-bottom: 15px; }
        .plan-price span { font-size: 0.4em; color: var(--muted); font-weight: normal; }
        .plan-features { list-style: none; padding: 0; margin: 0 0 20px 0; font-size: 0.95em; color: var(--ink); }
        .plan-features li { margin-bottom: 10px; padding-left: 24px; position: relative; }
        .plan-features li::before { content: '✓'; color: var(--leaf); position: absolute; left: 0; font-weight: bold; }
        .plan-features li.exclusive { font-weight: bold; color: var(--water); }
        .plan-features li.exclusive::before { content: '⭐'; color: inherit; }
        
        input[type="radio"] { display: none; }
        
        @media (max-width: 768px) {
            .grid-2 { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header-simple">
        <a href="index.html">🌱 EDAFONEX</a>
    </div>

    <div class="container-lg">
        <form action="setup.html" method="GET" id="registration-form">
            
            <div class="form-section">
                <h2>1. Selecciona tu Plan de Hardware y Suscripción</h2>
                <div class="plans-grid">
                    <!-- Plan Básico -->
                    <label class="plan-card selected" id="card-basic">
                        <input type="radio" name="plan" value="basic" checked onchange="updateSelection()">
                        <h3>Básico</h3>
                        <div class="plan-price">$299<span>/mes</span></div>
                        <ul class="plan-features">
                            <li>Sensor de Temp. y Humedad (DHT11)</li>
                            <li>Sensor de Luz Ambiental (LDR)</li>
                            <li>Humedad del Suelo (Capacitivo)</li>
                            <li>Notificaciones por Correo</li>
                            <li>Dashboard en Tiempo Real</li>
                        </ul>
                    </label>

                    <!-- Plan Avanzado -->
                    <label class="plan-card" id="card-advanced">
                        <input type="radio" name="plan" value="advanced" onchange="updateSelection()">
                        <h3>Avanzado</h3>
                        <div class="plan-price">$599<span>/mes</span></div>
                        <ul class="plan-features">
                            <li class="exclusive">Notificaciones vía WhatsApp</li>
                            <li>Temp. y Humedad de precisión (DHT22)</li>
                            <li>Temperatura Sumergible (DS18B20)</li>
                            <li>Luz Ambiental (LDR)</li>
                            <li>Humedad del Suelo (Capacitivo)</li>
                        </ul>
                    </label>

                    <!-- Plan Profesional -->
                    <label class="plan-card" id="card-pro">
                        <input type="radio" name="plan" value="pro" onchange="updateSelection()">
                        <h3>Profesional</h3>
                        <div class="plan-price">$1,299<span>/mes</span></div>
                        <ul class="plan-features">
                            <li class="exclusive">Sensor de CO2 (MHZ19)</li>
                            <li class="exclusive">Sensor de pH del agua</li>
                            <li class="exclusive">Temp. e Humedad Alta Precisión (SHT31)</li>
                            <li class="exclusive">Sensor de Luz Avanzado (BH1759)</li>
                            <li>Temperatura Sumergible (DS18B20)</li>
                            <li>Notificaciones vía WhatsApp Prioritarias</li>
                        </ul>
                    </label>
                </div>
            </div>

            <div class="form-section">
                <h2>2. Tus Datos</h2>
                <div class="grid-2">
                    <div class="input-group">
                        <label>Nombre del productor</label>
                        <input type="text" required placeholder="Ej. Juan Pérez">
                    </div>
                    <div class="input-group">
                        <label>Correo electrónico</label>
                        <input type="email" required placeholder="contacto@empresa.com">
                    </div>
                    <div class="input-group">
                        <label>Número de WhatsApp (Para Alertas)</label>
                        <input type="tel" required placeholder="+52 55 1234 5678" pattern="[+0-9\\s-]{10,20}">
                    </div>
                    <div class="input-group">
                        <label>Contraseña</label>
                        <input type="password" required placeholder="••••••••">
                    </div>
                </div>
            </div>

            <div style="text-align: right;">
                <button type="submit" class="btn" style="font-size: 1.2em; padding: 15px 40px; border-radius: 30px;">Completar Registro y Pagar</button>
            </div>
        </form>
    </div>

    <script>
        function updateSelection() {
            document.querySelectorAll('.plan-card').forEach(card => card.classList.remove('selected'));
            const selectedPlan = document.querySelector('input[name="plan"]:checked').value;
            if(selectedPlan === 'basic') document.getElementById('card-basic').classList.add('selected');
            if(selectedPlan === 'advanced') document.getElementById('card-advanced').classList.add('selected');
            if(selectedPlan === 'pro') document.getElementById('card-pro').classList.add('selected');
        }
    </script>
</body>
</html>
"""

write_file('register.html', register_html)

# 2. Modify index.html to remove the register modal and fix links
with io.open(os.path.join(base_dir, 'index.html'), 'r', encoding='utf-8') as f:
    idx_content = f.read()

# Change links back to register.html
idx_content = idx_content.replace('href="#" class="open-register"', 'href="register.html"')
idx_content = idx_content.replace('class="nav-link open-register" href="#"', 'class="nav-link" href="register.html"')
idx_content = idx_content.replace('class="btn open-register" href="#"', 'class="btn" href="register.html"')

# Remove the register modal HTML block. I will use regex or string split to excise it safely.
modal_start = '<dialog id="register-modal"'
modal_end = '</dialog>'

if modal_start in idx_content:
    s_idx = idx_content.find(modal_start)
    e_idx = idx_content.find(modal_end, s_idx) + len(modal_end)
    idx_content = idx_content[:s_idx] + idx_content[e_idx:]

# Remove register modal JS block
js_start = "var registerModal = $('register-modal');"
js_end = "window.location.href = 'setup.html';\n    };\n  }"
if js_start in idx_content:
    s_idx = idx_content.find(js_start)
    e_idx = idx_content.find(js_end, s_idx) + len(js_end)
    idx_content = idx_content[:s_idx] + idx_content[e_idx:]

with io.open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(idx_content)

print("Register page generated and index updated.")
