import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"

def write_file(name, content):
    with io.open(os.path.join(base_dir, name), 'w', encoding='utf-8') as f:
        f.write(content.strip() + "\n")

def generate_html(title, active_nav, body_content, js_content):
    nav_links = ['dashboard.html', 'zone.html', 'alerts.html', 'history.html', 'actuators.html', 'automation.html', 'settings.html']
    nav_names = ['Dashboard', 'Zonas', 'Alertas', 'Historial', 'Actuadores', 'Automatización', 'Configuración']
    
    nav_html = ""
    for link, name in zip(nav_links, nav_names):
        active = ' class="active"' if link == active_nav else ''
        nav_html += f'        <a href="{link}"{active}>{name}</a>\n'

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - EDAFONEX</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        body {{ background-color: var(--bg, #f4f6f8); font-family: var(--body, system-ui, sans-serif); margin: 0; padding: 0; color: var(--ink, #333); }}
        :root {{
            --leaf: #10b981; --leaf-dark: #059669; --water: #3b82f6; --soil: #b45309; --danger: #ef4444; --warn: #f59e0b;
            --panel: #ffffff; --line: #e5e7eb; --muted: #6b7280; --ink: #111827; --bg: #f9fafb; --display: 'Inter', system-ui, sans-serif;
        }}
        header {{ background: #fff; padding: 15px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }}
        .brand {{ font: 800 1.2rem var(--display); text-decoration: none; display: flex; align-items: center; gap: 10px; color: var(--ink); }}
        .brand svg {{ width: 24px; height: 24px; }}
        .nav-links {{ display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }}
        .nav-links a {{ margin-left: 10px; text-decoration: none; color: var(--muted); font-weight: 500; transition: color 0.2s; }}
        .nav-links a:hover, .nav-links a.active {{ color: var(--leaf-dark); }}
        .wrap-dash {{ max-width: 1000px; margin: 30px auto; padding: 0 20px; }}
        .panel {{ background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 25px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 30px; }}
        .panel-head {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--line); padding-bottom: 15px; }}
        .panel-head strong {{ font: 700 1.3rem var(--display); color: var(--ink); }}
        
        /* Tables */
        .table-responsive {{ overflow-x: auto; }}
        table {{ width: 100%; border-collapse: collapse; min-width: 600px; text-align: left; }}
        th {{ font-weight: 600; color: var(--muted); padding: 12px; border-bottom: 2px solid var(--line); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }}
        td {{ padding: 16px 12px; border-bottom: 1px solid var(--line); color: var(--ink); }}
        tr:last-child td {{ border-bottom: none; }}
        tr:hover {{ background: color-mix(in srgb, var(--line) 20%, transparent); }}
        
        /* Badges & Buttons */
        .btn {{ display: inline-block; font: 700 1rem var(--display); text-decoration: none; padding: 12px 24px; border-radius: 10px; background: var(--leaf); color: #fff; cursor: pointer; border: none; transition: background 0.2s; }}
        .btn:hover {{ background: var(--leaf-dark); }}
        .btn-sm {{ padding: 8px 16px; border-radius: 8px; font-size: 0.9rem; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; }}
        .btn-green {{ background: color-mix(in srgb, var(--leaf) 15%, transparent); color: var(--leaf-dark); }}
        .btn-green:hover {{ background: color-mix(in srgb, var(--leaf) 25%, transparent); }}
        .btn-danger {{ background: color-mix(in srgb, var(--danger) 15%, transparent); color: var(--danger); }}
        .badge {{ padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 700; display: inline-block; }}
        .badge-danger {{ background: color-mix(in srgb, var(--danger) 15%, transparent); color: var(--danger); }}
        .badge-warn {{ background: color-mix(in srgb, var(--warn) 15%, transparent); color: var(--warn); }}
        .badge-safe {{ background: color-mix(in srgb, var(--leaf) 15%, transparent); color: var(--leaf-dark); }}
        
        /* Grids */
        .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }}
        @media(max-width: 600px) {{ .grid-2 {{ grid-template-columns: 1fr; }} }}
    </style>
</head>
<body>
<header>
    <a class="brand" href="dashboard.html">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 29V15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M16 17C16 10 11 6 4 6c0 7 4 11 12 11Z" fill="var(--leaf)"/><path d="M16 14c0-6 4-9 11-9 0 6-4 9-11 9Z" fill="var(--water)"/></svg>
        EDAFONEX
    </a>
    <div class="nav-links">
{nav_html}    </div>
</header>
<div class="wrap-dash">
{body_content}
</div>
<script>
{js_content}
</script>
</body>
</html>"""

# 1. zone.html
zone_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Configuración de Zonas</strong>
        </div>
        <div class="grid-2" id="zones-container">
            <p style="color:var(--muted);">Cargando información de zonas...</p>
        </div>
    </div>
"""
zone_js = """
    async function fetchZones() {
        try {
            const container = document.getElementById('zones-container');
            container.innerHTML = `
                <div style="border: 1px solid var(--line); border-radius: 12px; padding: 20px;">
                    <h3 style="margin-top:0; color:var(--leaf-dark);">Zona A (Principal)</h3>
                    <p><strong>Cultivo:</strong> Jitomate</p>
                    <p><strong>Modo:</strong> <span class="badge badge-safe">Automático</span></p>
                    <div style="background: var(--bg); padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <h4 style="margin:0 0 10px 0; color:var(--muted);">Límites Operativos</h4>
                        <p style="margin:5px 0;"><strong>Temperatura:</strong> 18°C - 30°C</p>
                        <p style="margin:5px 0;"><strong>Humedad Suelo:</strong> 35% - 75%</p>
                    </div>
                    <button class="btn-sm btn-green" style="width:100%; margin-top: 15px;">Editar Límites</button>
                </div>
            `;
        } catch(e) {}
    }
    fetchZones();
"""
write_file('zone.html', generate_html('Zonas', 'zone.html', zone_body, zone_js))

# 2. alerts.html
alerts_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Centro de Alertas Activas</strong>
            <button class="btn-sm" style="background:var(--bg); border:1px solid var(--line);" onclick="fetchAlerts()">↻ Actualizar</button>
        </div>
        <div class="table-responsive">
            <table>
                <thead><tr><th>Fecha y Hora</th><th>Severidad</th><th>Mensaje del Motor</th><th>Acción</th></tr></thead>
                <tbody id="alerts-tbody">
                    <tr><td colspan="4" style="text-align:center; color:var(--muted);">Cargando alertas...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
"""
alerts_js = """
    async function fetchAlerts() {
        const tbody = document.getElementById('alerts-tbody');
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--muted);">Cargando alertas...</td></tr>';
        try {
            const res = await fetch('/api/alerts/active');
            const alerts = await res.json();
            if (alerts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--muted); padding: 30px;">✔️ No hay alertas críticas en este momento. El cultivo está seguro.</td></tr>';
            } else {
                tbody.innerHTML = alerts.map(a => {
                    const badgeClass = a.severity === 'critical' ? 'badge-danger' : 'badge-warn';
                    const date = new Date(a.createdAt).toLocaleString('es-MX', {dateStyle: 'medium', timeStyle: 'short'});
                    return `<tr>
                        <td>${date}</td>
                        <td><span class="badge ${badgeClass}">${a.severity.toUpperCase()}</span></td>
                        <td style="font-weight:500;">${a.message}</td>
                        <td><button class="btn-sm btn-green" onclick="resolve('${a.id}')">Resolver</button></td>
                    </tr>`;
                }).join('');
            }
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--danger);">Error al cargar alertas.</td></tr>';
        }
    }
    async function resolve(id) {
        await fetch('/api/alerts/' + id + '/resolve', { method: 'POST' });
        fetchAlerts();
    }
    fetchAlerts();
    setInterval(fetchAlerts, 5000);
"""
write_file('alerts.html', generate_html('Alertas', 'alerts.html', alerts_body, alerts_js))

# 3. history.html
history_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Telemetría Histórica</strong>
        </div>
        <p style="color:var(--muted); margin-top:-10px; margin-bottom:20px;">Últimos registros de los sensores en campo.</p>
        <div class="table-responsive">
            <table>
                <thead><tr><th>Marca de Tiempo</th><th style="text-align:right;">Temp (°C)</th><th style="text-align:right;">H. Suelo (%)</th><th style="text-align:right;">N. Tanque (%)</th></tr></thead>
                <tbody id="history-tbody">
                    <tr><td colspan="4" style="text-align:center; color:var(--muted);">Cargando historial...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
"""
history_js = """
    async function fetchHistory() {
        try {
            const res = await fetch('/api/telemetry/history?limit=15');
            const data = await res.json();
            const tbody = document.getElementById('history-tbody');
            if(data.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay datos registrados aún.</td></tr>';
                 return;
            }
            tbody.innerHTML = data.map(d => {
                const date = new Date(d.timestamp).toLocaleString('es-MX', {dateStyle: 'short', timeStyle: 'medium'});
                return `<tr>
                    <td style="color:var(--muted);">${date}</td>
                    <td style="text-align:right; font-weight:600; color:${d.temperature>30?'var(--danger)':'var(--ink)'}">${d.temperature.toFixed(1)}</td>
                    <td style="text-align:right; font-weight:600; color:${d.soilMoisture<40?'var(--warn)':'var(--water)'}">${d.soilMoisture.toFixed(1)}</td>
                    <td style="text-align:right; font-weight:600; color:${d.waterLevel<25?'var(--danger)':'var(--water)'}">${d.waterLevel.toFixed(1)}</td>
                </tr>`;
            }).join('');
        } catch(e) {}
    }
    fetchHistory();
    setInterval(fetchHistory, 5000);
"""
write_file('history.html', generate_html('Historial', 'history.html', history_body, history_js))

# 4. actuators.html
act_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Control de Actuadores y Motores</strong>
        </div>
        <p style="color:var(--muted); margin-top:-10px; margin-bottom:20px;">Toma el control manual de los sistemas mecánicos del invernadero.</p>
        <div class="grid-2" id="actuators-grid">
            <p style="color:var(--muted);">Buscando actuadores...</p>
        </div>
    </div>
"""
act_js = """
    async function fetchActuators() {
        try {
            const res = await fetch('/api/actuators');
            const data = await res.json();
            document.getElementById('actuators-grid').innerHTML = data.map(a => {
                const isOn = a.state === 'on';
                const bgStyle = isOn ? 'background: color-mix(in srgb, var(--leaf) 8%, transparent); border-color: var(--leaf);' : 'background: #fff; border-color: var(--line);';
                return `
                    <div style="border: 2px solid; border-radius: 12px; padding: 25px; transition: all 0.3s; ${bgStyle}">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
                            <h3 style="margin:0; font-size:1.4rem;">${a.name}</h3>
                            <span class="badge ${isOn ? 'badge-safe' : 'badge-warn'}" style="font-size:1rem;">${isOn ? 'ENCENDIDO' : 'APAGADO'}</span>
                        </div>
                        <div style="display:flex; gap: 10px;">
                            <button class="btn" style="flex:1; background:var(--leaf); ${isOn?'opacity:0.5; cursor:not-allowed':''}" onclick="command('${a.id}', 'on')" ${isOn?'disabled':''}>ENCENDER</button>
                            <button class="btn" style="flex:1; background:var(--danger); ${!isOn?'opacity:0.5; cursor:not-allowed':''}" onclick="command('${a.id}', 'off')" ${!isOn?'disabled':''}>APAGAR</button>
                        </div>
                    </div>
                `;
            }).join('');
        } catch(e) {}
    }
    async function command(id, state) {
        const res = await fetch('/api/actuators/' + id + '/command', { 
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({state, source:'manual'}) 
        });
        const data = await res.json();
        if (!res.ok) alert("Error de seguridad: " + data.error);
        fetchActuators();
    }
    fetchActuators();
    setInterval(fetchActuators, 2000);
"""
write_file('actuators.html', generate_html('Actuadores', 'actuators.html', act_body, act_js))

# 5. automation.html
auto_body = """
    <div class="panel">
        <div class="panel-head">
            <strong>Motor de Reglas y Automatización</strong>
        </div>
        <p style="color:var(--muted); margin-top:-10px; margin-bottom:20px;">El sistema evalúa estas reglas miles de veces por minuto para proteger el cultivo.</p>
        
        <div style="border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin-bottom: 15px; display:flex; align-items:center; justify-content:space-between;">
            <div>
                <h3 style="margin:0 0 5px 0;">💧 Riego Automático (Humedad Baja)</h3>
                <p style="margin:0; color:var(--muted); font-size:0.95rem;">Si la humedad del sustrato cae por debajo del 35%, activar la bomba de riego (Requiere nivel de tanque > 15%).</p>
            </div>
            <div><span class="badge badge-safe">ACTIVA</span></div>
        </div>

        <div style="border: 1px solid var(--line); border-radius: 12px; padding: 20px; margin-bottom: 15px; display:flex; align-items:center; justify-content:space-between;">
            <div>
                <h3 style="margin:0 0 5px 0;">🛡️ Protección de Bomba (Tanque Bajo)</h3>
                <p style="margin:0; color:var(--muted); font-size:0.95rem;">Bloquea encendidos manuales y automáticos de la bomba si el nivel del tinaco cae bajo el 15% para evitar que el motor se queme.</p>
            </div>
            <div><span class="badge badge-safe">ACTIVA</span></div>
        </div>

        <div style="border: 1px solid var(--line); border-radius: 12px; padding: 20px; display:flex; align-items:center; justify-content:space-between;">
            <div>
                <h3 style="margin:0 0 5px 0;">💨 Ventilación por Sobrecalentamiento</h3>
                <p style="margin:0; color:var(--muted); font-size:0.95rem;">Si la temperatura ambiental supera los 30°C, encender los extractores/ventiladores inmediatamente.</p>
            </div>
            <div><span class="badge badge-safe">ACTIVA</span></div>
        </div>
    </div>
"""
write_file('automation.html', generate_html('Automatización', 'automation.html', auto_body, ""))

# 6. settings.html
settings_body = """
    <div class="grid-2">
        <div class="panel">
            <div class="panel-head">
                <strong>Suscripción Actual</strong>
            </div>
            <div style="text-align:center; padding: 20px 0;">
                <span class="badge badge-safe" style="font-size:1.2rem; margin-bottom: 15px;">Plan Profesional</span>
                <h2 style="font-size:2.5rem; margin:0; color:var(--leaf);">$1,299<span style="font-size:1rem; color:var(--muted);">/mes</span></h2>
            </div>
            <ul style="color:var(--muted); line-height:1.8;">
                <li>Sensores Industriales (SHT31, MHZ19)</li>
                <li>Notificaciones vía WhatsApp</li>
                <li>12 meses de historial de telemetría</li>
            </ul>
            <button class="btn" style="width:100%; margin-top:20px; background:var(--water);">Gestionar Suscripción</button>
        </div>

        <div class="panel" style="border-color: var(--danger);">
            <div class="panel-head">
                <strong style="color: var(--danger);">Zona de Peligro</strong>
            </div>
            <p style="color:var(--muted); margin-bottom: 25px;">Si estás presentando el proyecto de nuevo, puedes devolver la base de datos a sus valores de fábrica. Esto borrará la telemetría y alertas actuales.</p>
            
            <button class="btn btn-danger" style="width:100%; padding:15px; font-size:1.1rem;" onclick="resetDB()">⚠️ Restablecer Configuración Inicial</button>
        </div>
    </div>
"""
settings_js = """
    async function resetDB() {
        if(confirm("¿Estás seguro de restablecer la base de datos a los valores de fábrica?")) {
            const res = await fetch('/api/demo/reset', { method: 'POST' });
            alert("Sistema restablecido correctamente. Verifica la terminal del servidor.");
            window.location.href = 'dashboard.html';
        }
    }
"""
write_file('settings.html', generate_html('Configuración', 'settings.html', settings_body, settings_js))

print("All subpages rewritten with EDAFONEX styling.")
