import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
dash_path = os.path.join(base_dir, 'dashboard.html')

with io.open(dash_path, 'r', encoding='utf-8') as f:
    html = f.read()

new_panel = """
        <div class="panel" aria-label="Lecturas de Sensores">
            <div class="panel-head">
                <strong>Sensores en Tiempo Real</strong>
                <span class="live"><span class="dot"></span>Conectado</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <!-- Col 1 -->
                <div>
                    <div class="reading" style="border:none; padding:5px 0;">
                        <span class="name">Temperatura</span>
                        <span class="val" id="vt" style="font-size:1.6rem;">-- °C</span>
                        <div class="bar" style="margin-top:2px;"><i id="bt"></i></div>
                    </div>
                    <div class="reading" style="border:none; padding:5px 0;">
                        <span class="name">Hum. Sustrato</span>
                        <span class="val" id="vh" style="font-size:1.6rem;">-- %</span>
                        <div class="bar" style="margin-top:2px;"><i id="bh"></i></div>
                    </div>
                    <div class="reading" style="border:none; padding:5px 0;">
                        <span class="name">Nivel Tanque</span>
                        <span class="val" id="vw" style="font-size:1.6rem;">-- %</span>
                        <div class="bar" style="margin-top:2px;"><i id="bw"></i></div>
                    </div>
                </div>
                <!-- Col 2 -->
                <div>
                    <div class="reading" style="border:none; padding:5px 0;">
                        <span class="name">Hum. Ambiente</span>
                        <span class="val" id="vha" style="font-size:1.6rem;">-- %</span>
                        <div class="bar" style="margin-top:2px;"><i id="bha"></i></div>
                    </div>
                    <div class="reading" style="border:none; padding:5px 0;">
                        <span class="name">Nivel CO2</span>
                        <span class="val" id="vco2" style="font-size:1.6rem;">-- ppm</span>
                        <div class="bar" style="margin-top:2px;"><i id="bco2"></i></div>
                    </div>
                    <div class="reading" style="border:none; padding:5px 0;">
                        <span class="name">pH del Agua</span>
                        <span class="val" id="vph" style="font-size:1.6rem;">--</span>
                        <div class="bar" style="margin-top:2px;"><i id="bph"></i></div>
                    </div>
                </div>
            </div>

            <div class="reading" style="border-top: 1px solid var(--line); padding-top:15px; margin-bottom: 20px;">
                <span class="name">Luz Ambiental</span>
                <span class="val" id="vlux" style="font-size:1.6rem;">-- Lux</span>
                <div class="bar" style="margin-top:2px;"><i id="blux"></i></div>
            </div>

            <div class="alert" id="status-alert">
                <span>🛡️</span> <span id="status-text">Cultivo Protegido. Todo en rango.</span>
            </div>
        </div>
"""

# Extract wrapping parts
start_panel = html.find('<div class="panel" aria-label="Lecturas de Sensores">')
end_panel = html.find('</div>\n    </div>\n\n    <!-- Columna Derecha')

if end_panel == -1: # fallback
    end_panel = html.find('</div>\n    </div>\n\n    <!-- Columna Derecha')

# Actually, finding the end of the panel is easier with a string slice
start_col_right = html.find('<!-- Columna Derecha')
html_before = html[:start_panel]
html_after = html[start_col_right - 14:] # backup a bit to include closing divs

html = html_before + new_panel + html_after

# Now update the JS fetch function
js_update = """
    async function fetchTelemetry() {
        try {
            const res = await fetch('/api/telemetry/latest');
            const data = await res.json();
            if (data) {
                const t = data.temperature || 0;
                const h = data.soilMoisture || 0;
                const w = data.waterLevel || 0;
                const ha = data.humidity || 0;
                const co2 = data.co2 || 400;
                const ph = data.ph || 7.0;
                const lux = data.light || 0;
                
                document.getElementById('vt').innerText = t.toFixed(1) + ' °C';
                document.getElementById('vh').innerText = h.toFixed(1) + ' %';
                document.getElementById('vw').innerText = w.toFixed(1) + ' %';
                document.getElementById('vha').innerText = ha.toFixed(1) + ' %';
                document.getElementById('vco2').innerText = co2.toFixed(0) + ' ppm';
                document.getElementById('vph').innerText = ph.toFixed(1);
                document.getElementById('vlux').innerText = lux.toFixed(0) + ' Lux';
                
                // Actualizar barras
                document.getElementById('bt').style.width = Math.min(Math.max((t - 10) / 35 * 100, 0), 100) + '%';
                document.getElementById('bt').style.background = t > 30 ? 'var(--danger)' : 'var(--leaf)';
                
                document.getElementById('bh').style.width = h + '%';
                document.getElementById('bh').style.background = h < 40 ? 'var(--warn)' : 'var(--water)';
                
                document.getElementById('bw').style.width = w + '%';
                document.getElementById('bw').style.background = w < 25 ? 'var(--danger)' : 'var(--water)';

                document.getElementById('bha').style.width = ha + '%';
                document.getElementById('bha').style.background = (ha < 30 || ha > 80) ? 'var(--warn)' : 'var(--water)';

                document.getElementById('bco2').style.width = Math.min((co2 / 1000) * 100, 100) + '%';
                document.getElementById('bco2').style.background = (co2 > 800 || co2 < 300) ? 'var(--danger)' : 'var(--leaf)';

                document.getElementById('bph').style.width = (ph / 14) * 100 + '%';
                document.getElementById('bph').style.background = (ph < 5.5 || ph > 7.5) ? 'var(--danger)' : 'var(--water)';

                document.getElementById('blux').style.width = Math.min((lux / 2000) * 100, 100) + '%';
                document.getElementById('blux').style.background = 'var(--warn)';
                
                // Actualizar Estado General
                const alertBox = document.getElementById('status-alert');
                const alertTxt = document.getElementById('status-text');
                
                if (t > 30 || h < 40 || w < 25 || ph < 5.5 || co2 > 800) {
                    alertBox.className = 'alert hot';
                    let issues = [];
                    if(t>30) issues.push('Temp Alta');
                    if(h<40) issues.push('Sustrato Seco');
                    if(w<25) issues.push('Tanque Bajo');
                    if(ph<5.5) issues.push('pH Ácido');
                    if(co2>800) issues.push('CO2 Alto');
                    alertTxt.innerHTML = '⚠️ <strong>Peligro:</strong> ' + issues.join(', ') + '.';
                } else {
                    alertBox.className = 'alert';
                    alertTxt.innerHTML = '🛡️ <strong>Cultivo Protegido.</strong> Condiciones óptimas.';
                }
            }
        } catch(e) {}
    }
"""

# Replace the old fetchTelemetry
start_fn = html.find('async function fetchTelemetry() {')
end_fn = html.find('async function fetchActuators() {')

html = html[:start_fn] + js_update + html[end_fn:]

with io.open(dash_path, 'w', encoding='utf-8') as f:
    f.write(html)

print("Dashboard full sensors updated.")
