import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
auto_path = os.path.join(base_dir, 'automation.html')

with io.open(auto_path, 'r', encoding='utf-8') as f:
    html = f.read()

new_body = """
    <div class="panel">
        <div class="panel-head" style="margin-bottom: 5px;">
            <strong>Motor de Reglas y Automatización</strong>
            <button class="btn-sm btn-green">+ Nueva Regla</button>
        </div>
        <p style="color:var(--muted); margin-top:-5px; margin-bottom:25px;">El sistema evalúa estas reglas continuamente. Cada condición cumplida dispara una acción de control o alerta en milisegundos.</p>
        
        <div class="rules-list">
            <!-- Rule 1 -->
            <div style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf);"></span>
                        <h3 style="margin:0; font-size:1.2rem; color:var(--ink);">Riego Automático (Humedad Baja)</h3>
                    </div>
                    <label style="position:relative; display:inline-block; width:50px; height:24px;">
                        <input type="checkbox" checked style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--leaf); border-radius:24px; transition:.4s;"></span>
                        <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; border-radius:50%; transition:.4s; transform:translateX(26px);"></span>
                    </label>
                </div>
                
                <div style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--water);">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div style="font-weight:500; color:var(--ink);">Humedad del sustrato cae por debajo del <span style="color:var(--water);">35%</span></div>
                    <div style="font-weight:500; color:var(--ink); margin-top:5px;">Y el nivel del tanque es mayor al <span style="color:var(--water);">15%</span></div>
                </div>
                
                <div style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf);">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div style="font-weight:500; color:var(--ink);">Activar <span style="color:var(--leaf-dark);">Bomba de Riego (pump_01)</span></div>
                </div>
            </div>

            <!-- Rule 2 -->
            <div style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; margin-bottom: 20px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf);"></span>
                        <h3 style="margin:0; font-size:1.2rem; color:var(--ink);">Protección de Hardware (Tanque Crítico)</h3>
                    </div>
                    <label style="position:relative; display:inline-block; width:50px; height:24px;">
                        <input type="checkbox" checked style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--leaf); border-radius:24px; transition:.4s;"></span>
                        <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; border-radius:50%; transition:.4s; transform:translateX(26px);"></span>
                    </label>
                </div>
                
                <div style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--danger);">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div style="font-weight:500; color:var(--ink);">Nivel del tanque cae por debajo del <span style="color:var(--danger);">15%</span></div>
                </div>
                
                <div style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf);">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div style="font-weight:500; color:var(--ink);">Forzar apagado de <span style="color:var(--leaf-dark);">Bomba de Riego (pump_01)</span> y bloquear comandos manuales.</div>
                </div>
            </div>

            <!-- Rule 3 -->
            <div style="border: 1px solid var(--line); border-radius: 12px; padding: 25px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.01);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
                    <div style="display:flex; align-items:center; gap: 10px;">
                        <span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--leaf);"></span>
                        <h3 style="margin:0; font-size:1.2rem; color:var(--ink);">Ventilación por Sobrecalentamiento</h3>
                    </div>
                    <label style="position:relative; display:inline-block; width:50px; height:24px;">
                        <input type="checkbox" checked style="opacity:0; width:0; height:0;">
                        <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--leaf); border-radius:24px; transition:.4s;"></span>
                        <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; border-radius:50%; transition:.4s; transform:translateX(26px);"></span>
                    </label>
                </div>
                
                <div style="background:var(--bg); border-radius:8px; padding:15px; margin-bottom:15px; border-left: 4px solid var(--warn);">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">SI LA CONDICIÓN ES:</strong></div>
                    <div style="font-weight:500; color:var(--ink);">Temperatura ambiental supera los <span style="color:var(--warn);">30°C</span></div>
                </div>
                
                <div style="background:var(--bg); border-radius:8px; padding:15px; border-left: 4px solid var(--leaf);">
                    <div style="margin-bottom:8px;"><strong style="color:var(--muted); font-size:0.85rem; text-transform:uppercase;">ENTONCES EJECUTAR:</strong></div>
                    <div style="font-weight:500; color:var(--ink);">Activar <span style="color:var(--leaf-dark);">Ventiladores (fan_01)</span> y abrir <span style="color:var(--leaf-dark);">Ventana Automática (window_01)</span></div>
                </div>
            </div>
        </div>
    </div>
"""

start_body = html.find('<div class="wrap-dash">') + len('<div class="wrap-dash">')
end_body = html.find('</div>\n<script>')

final_html = html[:start_body] + new_body + html[end_body:]

with io.open(auto_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Automation updated.")
