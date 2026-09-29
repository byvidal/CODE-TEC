import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
zone_path = os.path.join(base_dir, 'zone.html')

with io.open(zone_path, 'r', encoding='utf-8') as f:
    zone_html = f.read()

new_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Configuración de Zonas</strong>
            <button class="btn-sm btn-green" onclick="document.getElementById('new-zone-modal').showModal()">+ Agregar Zona</button>
        </div>
        <p style="color:var(--muted); margin-top:-10px; margin-bottom:20px;">Organiza tu invernadero por cultivos y asigna parámetros específicos a cada área.</p>
        
        <div class="grid-2" id="zones-container">
            <p style="color:var(--muted);">Cargando información de zonas...</p>
        </div>
    </div>

    <!-- Modal Agregar Zona -->
    <dialog id="new-zone-modal" class="modal" style="border: none; border-radius: 12px; padding: 0; box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 500px; width: 90%; background: var(--bg); color: var(--ink);">
        <div style="padding: 25px;">
            <span class="close" onclick="document.getElementById('new-zone-modal').close()" style="position: absolute; top: 15px; right: 20px; font-size: 1.5rem; cursor: pointer; color: var(--muted);">&times;</span>
            <h2 style="margin-top:0; font-size: 1.5rem;">Crear Nueva Zona</h2>
            <form id="new-zone-form">
                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-weight:500; margin-bottom:5px;">Nombre de la Zona</label>
                    <input type="text" id="z-name" required placeholder="Ej. Zona B - Semilleros" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display:block; font-weight:500; margin-bottom:5px;">Cultivo Objetivo</label>
                    <input type="text" id="z-crop" required placeholder="Ej. Fresa" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; box-sizing:border-box;">
                </div>
                
                <div class="grid-2" style="margin-bottom: 15px;">
                    <div>
                        <label style="display:block; font-weight:500; margin-bottom:5px; font-size:0.9rem;">Temp. Máxima (°C)</label>
                        <input type="number" id="z-tmax" value="30" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; box-sizing:border-box;">
                    </div>
                    <div>
                        <label style="display:block; font-weight:500; margin-bottom:5px; font-size:0.9rem;">Humedad Suelo Mínima (%)</label>
                        <input type="number" id="z-hmin" value="40" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; box-sizing:border-box;">
                    </div>
                </div>

                <div style="margin-bottom: 20px; padding: 15px; background: color-mix(in srgb, var(--water) 10%, transparent); border: 1px dashed var(--water); border-radius: 8px;">
                    <label style="display:block; font-weight:bold; margin-bottom:5px; color: var(--water);">Vincular Dispositivo (Sensor MAC/Token)</label>
                    <input type="text" id="z-sensor" placeholder="Ej. ESP32-A1B2C3D4" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; box-sizing:border-box;">
                    <p style="font-size: 0.8rem; color: var(--muted); margin: 5px 0 0 0;">Ingresa el código del dispositivo físico para enlazar esta zona a la telemetría real.</p>
                </div>

                <button type="submit" class="btn" style="width: 100%;">Guardar y Activar Zona</button>
            </form>
        </div>
    </dialog>
"""

new_js = """
    const GH_ID = 'greenhouse_01'; // Default demo greenhouse

    async function fetchZones() {
        try {
            const res = await fetch(`/api/greenhouses/${GH_ID}/zones`);
            const zones = await res.json();
            const container = document.getElementById('zones-container');
            
            if(zones.length === 0) {
                container.innerHTML = '<p>No hay zonas configuradas.</p>';
                return;
            }

            container.innerHTML = zones.map(z => `
                <div style="border: 1px solid var(--line); border-radius: 12px; padding: 20px; background: #fff;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <h3 style="margin:0 0 5px 0; color:var(--leaf-dark); font-size:1.4rem;">${z.name}</h3>
                        <span class="badge badge-safe">En línea</span>
                    </div>
                    <p style="margin:5px 0 15px 0; font-size:1.1rem;"><strong>Cultivo:</strong> ${z.crop}</p>
                    
                    <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin:0 0 10px 0; color:var(--muted); font-size:0.9rem; text-transform:uppercase;">Parámetros Óptimos</h4>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                            <div><span style="font-size:1.2rem; font-weight:bold;">${z.temperatureMax}°C</span><br><span style="font-size:0.8rem; color:var(--muted);">Temp. Límite</span></div>
                            <div><span style="font-size:1.2rem; font-weight:bold;">${z.soilMoistureMin}%</span><br><span style="font-size:0.8rem; color:var(--muted);">Riego al bajar de</span></div>
                        </div>
                    </div>
                    
                    <div style="display:flex; align-items:center; gap:8px; margin-top:15px; color:var(--water); font-size:0.9rem; font-weight:500;">
                        <span>📡 Dispositivo vinculado</span>
                    </div>
                </div>
            `).join('');
        } catch(e) {
            console.error(e);
        }
    }

    document.getElementById('new-zone-form').onsubmit = async function(e) {
        e.preventDefault();
        const payload = {
            name: document.getElementById('z-name').value,
            crop: document.getElementById('z-crop').value,
            temperatureMax: parseFloat(document.getElementById('z-tmax').value),
            soilMoistureMin: parseFloat(document.getElementById('z-hmin').value)
        };
        
        try {
            const res = await fetch(`/api/greenhouses/${GH_ID}/zones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if(res.ok) {
                document.getElementById('new-zone-modal').close();
                document.getElementById('new-zone-form').reset();
                fetchZones();
            } else {
                alert("Error al guardar la zona.");
            }
        } catch(err) {}
    };

    fetchZones();
"""

# Extract wrapping parts
start_body = zone_html.find('<div class="wrap-dash">') + len('<div class="wrap-dash">')
end_body = zone_html.find('</div>\n<script>')

start_script = zone_html.find('<script>') + len('<script>')
end_script = zone_html.find('</script>')

final_html = zone_html[:start_body] + new_body + zone_html[end_body:start_script] + new_js + zone_html[end_script:]

with io.open(zone_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Zone updated.")
