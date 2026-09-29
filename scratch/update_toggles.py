import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
auto_path = os.path.join(base_dir, 'automation.html')

with io.open(auto_path, 'r', encoding='utf-8') as f:
    html = f.read()

# I will replace the HTML inside <div class="wrap-dash"> ... </div> and the script.

new_body = """
    <div class="panel">
        <div class="panel-head" style="margin-bottom: 5px;">
            <strong>Motor de Reglas y Automatización</strong>
            <button class="btn-sm btn-green" onclick="alert('En la versión final, esto abrirá un creador visual de reglas.')">+ Nueva Regla</button>
        </div>
        <p style="color:var(--muted); margin-top:-5px; margin-bottom:25px;">El sistema evalúa estas reglas continuamente. Cada condición cumplida dispara una acción de control o alerta en milisegundos.</p>
        
        <div class="rules-list">
            <!-- Rule 1 -->
            <div class="rule-card" id="rule-1" style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01); transition: all 0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span class="rule-led" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf); transition: background 0.3s;"></span>
                        <h3 class="rule-title" style="margin:0; font-size:1.2rem; color:var(--ink); transition: color 0.3s;">Riego Automático (Humedad Baja)</h3>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked onchange="toggleRule('rule-1', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="rule-box rule-box-cond" style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--water); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">Humedad del sustrato cae por debajo del <span class="val-color" style="color:var(--water);">35%</span></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink); margin-top:5px;">Y el nivel del tanque es mayor al <span class="val-color" style="color:var(--water);">15%</span></div>
                </div>
                
                <div class="rule-box rule-box-act" style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">Activar <span class="val-color2" style="color:var(--leaf-dark);">Bomba de Riego (pump_01)</span></div>
                </div>
            </div>

            <!-- Rule 2 -->
            <div class="rule-card" id="rule-2" style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01); transition: all 0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span class="rule-led" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf); transition: background 0.3s;"></span>
                        <h3 class="rule-title" style="margin:0; font-size:1.2rem; color:var(--ink); transition: color 0.3s;">Protección de Hardware (Tanque Crítico)</h3>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked onchange="toggleRule('rule-2', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="rule-box rule-box-cond" style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--danger); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">Nivel del tanque cae por debajo del <span class="val-color" style="color:var(--danger);">15%</span></div>
                </div>
                
                <div class="rule-box rule-box-act" style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">Forzar apagado de <span class="val-color2" style="color:var(--leaf-dark);">Bomba de Riego (pump_01)</span> y bloquear comandos.</div>
                </div>
            </div>

            <!-- Rule 3 -->
            <div class="rule-card" id="rule-3" style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01); transition: all 0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span class="rule-led" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf); transition: background 0.3s;"></span>
                        <h3 class="rule-title" style="margin:0; font-size:1.2rem; color:var(--ink); transition: color 0.3s;">Ventilación por Sobrecalentamiento</h3>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked onchange="toggleRule('rule-3', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="rule-box rule-box-cond" style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--warn); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">Temperatura ambiental supera los <span class="val-color" style="color:var(--warn);">30°C</span></div>
                </div>
                
                <div class="rule-box rule-box-act" style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">Activar <span class="val-color2" style="color:var(--leaf-dark);">Ventiladores (fan_01)</span> y abrir <span class="val-color2" style="color:var(--leaf-dark);">Ventana Automática (window_01)</span></div>
                </div>
            </div>
        </div>
    </div>
"""

new_js = """
    function toggleRule(ruleId, isChecked) {
        const card = document.getElementById(ruleId);
        if(!card) return;
        
        const led = card.querySelector('.rule-led');
        const title = card.querySelector('.rule-title');
        const boxes = card.querySelectorAll('.rule-box');
        const texts = card.querySelectorAll('.rule-text');
        const valColors = card.querySelectorAll('.val-color, .val-color2');
        
        if (isChecked) {
            // Restore colors
            card.style.opacity = '1';
            led.style.background = 'var(--leaf)';
            title.style.color = 'var(--ink)';
            texts.forEach(t => t.style.color = 'var(--ink)');
            
            // Re-apply left borders based on condition type (hacky but visually works for demo)
            boxes.forEach(b => {
                b.style.borderColor = ''; // reset to stylesheet
                b.style.filter = 'none';
            });
            valColors.forEach(vc => vc.style.filter = 'none');
            
        } else {
            // Dim colors (Inactive state)
            card.style.opacity = '0.65';
            led.style.background = 'var(--line)';
            title.style.color = 'var(--muted)';
            texts.forEach(t => t.style.color = 'var(--muted)');
            
            // Make borders gray
            boxes.forEach(b => {
                b.style.borderColor = 'var(--line)';
                b.style.filter = 'grayscale(100%)';
            });
            valColors.forEach(vc => vc.style.filter = 'grayscale(100%)');
        }
    }
"""

css_injection = """
        /* Toggle Switches */
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--line); border-radius: 24px; transition: .3s; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; border-radius: 50%; transition: .3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        input:checked + .slider { background-color: var(--leaf); }
        input:checked + .slider:before { transform: translateX(20px); }
"""

# Extract the existing head style
start_style = html.find('<style>') + len('<style>')
html = html[:start_style] + css_injection + html[start_style:]

start_body = html.find('<div class="wrap-dash">') + len('<div class="wrap-dash">')
end_body = html.find('</div>\n<script>')

start_script = html.find('<script>') + len('<script>')
end_script = html.find('</script>')

if end_body != -1 and start_script != -1:
    final_html = html[:start_body] + new_body + html[end_body:start_script] + new_js + html[end_script:]
    with io.open(auto_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
    print("Toggle updated.")
else:
    print("Error parsing HTML.")
