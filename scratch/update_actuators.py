import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
act_path = os.path.join(base_dir, 'actuators.html')

with io.open(act_path, 'r', encoding='utf-8') as f:
    html = f.read()

new_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Control de Actuadores y Motores</strong>
        </div>
        <p style="color:var(--muted); margin-top:-10px; margin-bottom:20px;">Toma el control manual de los sistemas mecánicos del invernadero. El cambio se refleja instantáneamente.</p>
        <div class="grid-2" id="actuators-grid">
            <p style="color:var(--muted);">Buscando actuadores...</p>
        </div>
    </div>
"""

new_js = """
    let actuatorsData = [];

    async function fetchActuators() {
        try {
            const res = await fetch('/api/actuators');
            actuatorsData = await res.json();
            renderActuators();
        } catch(e) {}
    }

    function renderActuators() {
        const grid = document.getElementById('actuators-grid');
        grid.innerHTML = actuatorsData.map(a => {
            const isOn = (a.state === 'on' || a.state === 'open');
            const bgStyle = isOn ? 'background: color-mix(in srgb, var(--leaf) 8%, transparent); border-color: var(--leaf);' : 'background: #fff; border-color: var(--line);';
            const statusLabel = isOn ? 'ENCENDIDO' : 'APAGADO';
            const icon = a.type === 'pump' ? '💧' : (a.type === 'fan' ? '💨' : '🪟');
            
            return `
                <div style="border: 2px solid; border-radius: 12px; padding: 25px; transition: all 0.2s ease; ${bgStyle}">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                        <h3 style="margin:0; font-size:1.4rem;">${icon} ${a.name}</h3>
                        <span class="badge ${isOn ? 'badge-safe' : 'badge-warn'}" style="font-size:1rem; transition: background 0.3s;">${statusLabel}</span>
                    </div>
                    <div style="display:flex; gap: 10px;">
                        <button class="btn" style="flex:1; background:var(--leaf); transition: opacity 0.2s; ${isOn?'opacity:0.4; cursor:not-allowed':''}" onclick="command('${a.id}', 'on')" ${isOn?'disabled':''}>ENCENDER</button>
                        <button class="btn" style="flex:1; background:var(--danger); transition: opacity 0.2s; ${!isOn?'opacity:0.4; cursor:not-allowed':''}" onclick="command('${a.id}', 'off')" ${!isOn?'disabled':''}>APAGAR</button>
                    </div>
                    <div style="margin-top: 15px; font-size: 0.85rem; color: var(--muted); text-align: center;">
                        Control: <strong>Manual/Remoto</strong>
                    </div>
                </div>
            `;
        }).join('');
    }

    async function command(id, state) {
        // Optimistic UI Update (instant feedback)
        const actuator = actuatorsData.find(a => a.id === id);
        if(actuator) {
            actuator.state = state;
            renderActuators(); // Re-render instantly
        }

        try {
            const res = await fetch('/api/actuators/' + id + '/command', { 
                method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({state, source:'manual'}) 
            });
            const data = await res.json();
            if (!res.ok) {
                alert("Bloqueo de seguridad: " + data.error);
                // Revert optimistic update on failure
                fetchActuators();
            }
        } catch(e) {
            // Revert optimistic update on failure
            fetchActuators();
        }
    }

    fetchActuators();
    // Poll to keep in sync if rules change them automatically
    setInterval(fetchActuators, 2000);
"""

start_body = html.find('<div class="wrap-dash">') + len('<div class="wrap-dash">')
end_body = html.find('</div>\n<script>')

start_script = html.find('<script>') + len('<script>')
end_script = html.find('</script>')

final_html = html[:start_body] + new_body + html[end_body:start_script] + new_js + html[end_script:]

with io.open(act_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Actuators updated.")
