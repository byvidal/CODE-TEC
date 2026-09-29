import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
auto_path = os.path.join(base_dir, 'automation.html')

with io.open(auto_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the button onclick
old_btn = """<button class="btn-sm btn-green" onclick="alert('En la versión final, esto abrirá un creador visual de reglas.')">+ Nueva Regla</button>"""
new_btn = """<button class="btn-sm btn-green" onclick="document.getElementById('new-rule-modal').showModal()">+ Nueva Regla</button>"""
html = html.replace(old_btn, new_btn)

# Add the modal HTML right after the <div class="rules-list">...</div>
# I will find the end of rules-list.
new_modal = """
    <!-- Modal Nueva Regla -->
    <dialog id="new-rule-modal" class="modal" style="border: none; border-radius: 12px; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 550px; width: 90%; background: var(--bg); color: var(--ink);">
        <div style="padding: 25px;">
            <span class="close" onclick="document.getElementById('new-rule-modal').close()" style="position: absolute; top: 15px; right: 20px; font-size: 1.5rem; cursor: pointer; color: var(--muted);">&times;</span>
            <h2 style="margin-top:0; font-size: 1.5rem;">Construir Nueva Regla</h2>
            <p style="color:var(--muted); font-size:0.9rem; margin-top:-10px; margin-bottom:20px;">Define la condición ("IF") y la acción resultante ("THEN").</p>
            
            <form id="new-rule-form">
                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-weight:500; margin-bottom:5px;">Nombre de la Regla</label>
                    <input type="text" id="r-name" required placeholder="Ej. Riego de emergencia" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; box-sizing:border-box;">
                </div>
                
                <div style="background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--warn);">
                    <strong style="display:block; color:var(--muted); font-size:0.85rem; margin-bottom:10px;">CONDICIÓN (IF)</strong>
                    <div style="display:flex; gap:10px;">
                        <select id="r-sensor" style="flex:2; padding:8px; border:1px solid var(--line); border-radius:6px;">
                            <option value="Temperatura">Temperatura</option>
                            <option value="Humedad Suelo">Humedad Suelo</option>
                            <option value="Nivel Tanque">Nivel Tanque</option>
                        </select>
                        <select id="r-operator" style="flex:1; padding:8px; border:1px solid var(--line); border-radius:6px;">
                            <option value="mayor a">></option>
                            <option value="menor a"><</option>
                        </select>
                        <input type="number" id="r-value" required placeholder="Ej. 30" style="flex:1; padding:8px; border:1px solid var(--line); border-radius:6px;">
                    </div>
                </div>

                <div style="background:var(--panel); border:1px solid var(--line); border-radius:8px; padding:15px; margin-bottom:25px; border-left: 4px solid var(--leaf);">
                    <strong style="display:block; color:var(--muted); font-size:0.85rem; margin-bottom:10px;">ACCIÓN (THEN)</strong>
                    <select id="r-action" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px;">
                        <option value="Activar Bomba de Riego">Activar Bomba de Riego</option>
                        <option value="Apagar Bomba de Riego">Apagar Bomba de Riego</option>
                        <option value="Activar Ventilador">Activar Ventilador</option>
                        <option value="Abrir Ventana Automática">Abrir Ventana Automática</option>
                        <option value="Enviar Alerta a WhatsApp">Solo Enviar Alerta a WhatsApp</option>
                    </select>
                </div>

                <button type="submit" class="btn" style="width: 100%;">Guardar y Activar Regla</button>
            </form>
        </div>
    </dialog>
"""

# Find where rules-list div ends
end_rules_list = html.find('</div>\n    </div>\n<script>')
if end_rules_list == -1:
    end_rules_list = html.find('</div>\n    </div>\n    <script>')

html = html[:end_rules_list] + "\n" + new_modal + html[end_rules_list:]


# Add JS to handle form submission
js_addition = """
    let ruleCounter = 3;

    document.getElementById('new-rule-form').onsubmit = function(e) {
        e.preventDefault();
        
        ruleCounter++;
        const ruleId = 'rule-' + ruleCounter;
        const name = document.getElementById('r-name').value;
        const sensor = document.getElementById('r-sensor').value;
        const operator = document.getElementById('r-operator').options[document.getElementById('r-operator').selectedIndex].text;
        const val = document.getElementById('r-value').value;
        const action = document.getElementById('r-action').value;
        
        let condColor = 'var(--warn)';
        if(sensor === 'Humedad Suelo') condColor = 'var(--water)';
        if(sensor === 'Nivel Tanque') condColor = 'var(--danger)';

        const newCard = `
            <div class="rule-card" id="${ruleId}" style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01); transition: all 0.3s; animation: fadeIn 0.5s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span class="rule-led" style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf); transition: background 0.3s;"></span>
                        <h3 class="rule-title" style="margin:0; font-size:1.2rem; color:var(--ink); transition: color 0.3s;">${name}</h3>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" checked onchange="toggleRule('${ruleId}', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
                
                <div class="rule-box rule-box-cond" style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid ${condColor}; transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);">${sensor} es ${operator} a <span class="val-color" style="color:${condColor};">${val}</span></div>
                </div>
                
                <div class="rule-box rule-box-act" style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf); transition: all 0.3s;">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div class="rule-text" style="font-weight:500; color:var(--ink);"><span class="val-color2" style="color:var(--leaf-dark);">${action}</span></div>
                </div>
            </div>
        `;
        
        document.querySelector('.rules-list').insertAdjacentHTML('beforeend', newCard);
        
        document.getElementById('new-rule-modal').close();
        document.getElementById('new-rule-form').reset();
    };
"""

# Insert JS before </script>
end_script = html.find('</script>')
html = html[:end_script] + js_addition + html[end_script:]

# Add keyframe animation to CSS
css_anim = """
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
"""
end_style = html.find('</style>')
html = html[:end_style] + css_anim + html[end_style:]

with io.open(auto_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Add Rule functioning.")
