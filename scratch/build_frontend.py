import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

styles = """
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; color: #333; }
.navbar { background: #2c3e50; padding: 15px 20px; color: white; display: flex; justify-content: space-between; align-items: center; }
.navbar a { color: white; text-decoration: none; margin-right: 15px; font-weight: bold; }
.container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
.btn { background: #2ecc71; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: bold; }
.btn-secondary { background: #3498db; }
.btn-danger { background: #e74c3c; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
table { width: 100%; border-collapse: collapse; }
th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
"""

write_file("styles.css", styles)

navbar = """
<div class="navbar">
    <div>
        <a href="dashboard.html">🌱 Greenhouse Monitor</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="zone.html">Zonas</a>
        <a href="alerts.html">Alertas</a>
        <a href="history.html">Historial</a>
        <a href="actuators.html">Actuadores</a>
        <a href="automation.html">Automatización</a>
        <a href="settings.html">Configuración</a>
    </div>
    <div>
        <span style="background: #e67e22; padding: 5px 10px; border-radius: 4px; font-size: 12px;">PROTOTIPO HACKATÓN</span>
    </div>
</div>
"""

# Landing
write_file("index.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Greenhouse Monitor - Landing</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .hero {{ text-align: center; padding: 100px 20px; background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; }}
        .hero h1 {{ font-size: 3em; margin-bottom: 10px; }}
        .hero p {{ font-size: 1.2em; margin-bottom: 30px; }}
    </style>
</head>
<body>
    <div class="hero">
        <h1>Greenhouse Monitor</h1>
        <p>Sistema de adquisición de datos, telemetría y teleprocesos para invernaderos inteligentes.</p>
        <a href="register.html" class="btn btn-secondary" style="font-size: 1.2em;">Probar Demo / Registrarse</a>
    </div>
    <div class="container grid" style="margin-top: 40px;">
        <div class="card"><h3>📡 Telemetría en Tiempo Real</h3><p>Recibe datos de sensores IoT de forma remota.</p></div>
        <div class="card"><h3>⚠️ Alertas Inteligentes</h3><p>Notificaciones ante anomalías climáticas.</p></div>
        <div class="card"><h3>⚙️ Teleprocesos</h3><p>Automatiza actuadores como bombas y ventiladores.</p></div>
    </div>
</body>
</html>
""")

# Register / Demo
write_file("register.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Registro - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container" style="max-width: 500px; margin-top: 50px;">
        <div class="card">
            <h2>Crear cuenta demo</h2>
            <p>Comienza a monitorear tu invernadero simulado.</p>
            <form action="setup.html" method="GET">
                <div style="margin-bottom: 15px;">
                    <label>Nombre del productor</label><br>
                    <input type="text" value="Productor Demo" style="width: 100%; padding: 8px;" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label>Email</label><br>
                    <input type="email" value="demo@hackaton.com" style="width: 100%; padding: 8px;" required>
                </div>
                <button type="submit" class="btn" style="width: 100%;">Continuar</button>
            </form>
        </div>
    </div>
</body>
</html>
""")

# Setup
write_file("setup.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Configuración Inicial - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container" style="max-width: 600px; margin-top: 50px;">
        <div class="card">
            <h2>Configura tu Invernadero</h2>
            <form action="dashboard.html" method="GET">
                <div style="margin-bottom: 15px;">
                    <label>Nombre del Invernadero</label><br>
                    <input type="text" value="Invernadero Principal" style="width: 100%; padding: 8px;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label>Tipo de Cultivo</label><br>
                    <input type="text" value="Jitomate" style="width: 100%; padding: 8px;">
                </div>
                <button type="submit" class="btn btn-secondary" style="width: 100%;">Finalizar Configuración y ver Dashboard</button>
            </form>
        </div>
    </div>
</body>
</html>
""")

# Dashboard
write_file("dashboard.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Resumen del Invernadero</h2>
        <div class="grid" id="telemetry-grid">
            <div class="card"><h3>🌡️ Temperatura</h3><div style="font-size: 2em; font-weight: bold;" id="val-temp">-- °C</div></div>
            <div class="card"><h3>💧 Humedad Suelo</h3><div style="font-size: 2em; font-weight: bold;" id="val-soil">-- %</div></div>
            <div class="card"><h3>🌊 Nivel Tanque</h3><div style="font-size: 2em; font-weight: bold;" id="val-water">-- %</div></div>
        </div>
        <div class="card">
            <h3>Dispositivos y Actuadores Rápidos</h3>
            <p>Para controles avanzados ve a <a href="actuators.html">Actuadores</a>.</p>
        </div>
    </div>
    <script src="app.js"></script>
</body>
</html>
""")

# Zone Detail
write_file("zone.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Zonas - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Detalle de Zonas</h2>
        <div class="card">
            <h3>Zona A (Jitomate)</h3>
            <p><strong>Modo:</strong> Automático</p>
            <p><strong>Límites:</strong> Humedad: 35-75% | Temp: 18-30°C</p>
            <button class="btn btn-secondary">Editar Límites</button>
        </div>
    </div>
</body>
</html>
""")

# Alerts
write_file("alerts.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Alertas - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Centro de Alertas</h2>
        <div class="card">
            <table>
                <thead><tr><th>Fecha</th><th>Severidad</th><th>Mensaje</th><th>Acción</th></tr></thead>
                <tbody id="alerts-tbody">
                    <tr><td colspan="4">Cargando alertas...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    <script>
        async function fetchAlerts() {{
            try {{
                const res = await fetch('/api/alerts/active');
                const alerts = await res.json();
                const tbody = document.getElementById('alerts-tbody');
                if (alerts.length === 0) {{
                    tbody.innerHTML = '<tr><td colspan="4">No hay alertas activas.</td></tr>';
                }} else {{
                    tbody.innerHTML = alerts.map(a => `<tr><td>${{new Date(a.createdAt).toLocaleString()}}</td><td>${{a.severity}}</td><td>${{a.message}}</td><td><button class="btn btn-secondary" onclick="resolve('${{a.id}}')">Resolver</button></td></tr>`).join('');
                }}
            }} catch(e) {{}}
        }}
        async function resolve(id) {{
            await fetch('/api/alerts/' + id + '/resolve', {{ method: 'POST' }});
            fetchAlerts();
        }}
        fetchAlerts();
    </script>
</body>
</html>
""")

# History
write_file("history.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Historial - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Telemetría Histórica</h2>
        <div class="card">
            <table>
                <thead><tr><th>Fecha</th><th>Temp (°C)</th><th>Humedad (%)</th><th>H. Suelo (%)</th></tr></thead>
                <tbody id="history-tbody">
                    <tr><td colspan="4">Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    <script>
        async function fetchHistory() {{
            try {{
                const res = await fetch('/api/telemetry/history?limit=15');
                const data = await res.json();
                document.getElementById('history-tbody').innerHTML = data.map(d => `<tr><td>${{new Date(d.timestamp).toLocaleString()}}</td><td>${{d.temperature.toFixed(1)}}</td><td>${{d.humidity.toFixed(1)}}</td><td>${{d.soilMoisture.toFixed(1)}}</td></tr>`).join('');
            }} catch(e) {{}}
        }}
        fetchHistory();
    </script>
</body>
</html>
""")

# Actuators
write_file("actuators.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Actuadores - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Control de Actuadores</h2>
        <div class="grid" id="actuators-grid">
            <div class="card">Cargando...</div>
        </div>
    </div>
    <script>
        async function fetchActuators() {{
            try {{
                const res = await fetch('/api/actuators');
                const data = await res.json();
                document.getElementById('actuators-grid').innerHTML = data.map(a => `
                    <div class="card">
                        <h3>${{a.name}}</h3>
                        <p>Estado: <strong>${{a.state.toUpperCase()}}</strong></p>
                        <button class="btn" onclick="command('${{a.id}}', 'on')">ON</button>
                        <button class="btn btn-danger" onclick="command('${{a.id}}', 'off')">OFF</button>
                    </div>
                `).join('');
            }} catch(e) {{}}
        }}
        async function command(id, state) {{
            const res = await fetch('/api/actuators/' + id + '/command', {{ method: 'POST', headers: {{'Content-Type':'application/json'}}, body: JSON.stringify({{state, source:'manual'}}) }});
            const data = await res.json();
            if (!res.ok) alert(data.error);
            fetchActuators();
        }}
        fetchActuators();
    </script>
</body>
</html>
""")

# Automation
write_file("automation.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Automatización - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Reglas de Automatización (Motor Lógico)</h2>
        <div class="card">
            <h3>Regla: Humedad Baja</h3>
            <p>Si la humedad del sustrato cae por debajo del 35%, activar la bomba de riego (siempre que el tanque > 15%).</p>
            <p><strong style="color:green;">Estado: ACTIVA</strong></p>
        </div>
        <div class="card">
            <h3>Regla: Sobrecalentamiento</h3>
            <p>Si la temperatura supera 30°C, encender ventilador.</p>
            <p><strong style="color:green;">Estado: ACTIVA</strong></p>
        </div>
    </div>
</body>
</html>
""")

# Settings (Plan)
write_file("settings.html", f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Configuración - Greenhouse Monitor</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    {navbar}
    <div class="container">
        <h2>Plan y Configuración</h2>
        <div class="card">
            <h3>Suscripción Actual</h3>
            <p><strong>Plan:</strong> Demo</p>
            <p><strong>Estado:</strong> Activo</p>
            <p>Límites: 1 invernadero, 1 mes de historial.</p>
            <button class="btn btn-secondary">Hacer Upgrade (Mock)</button>
        </div>
        <div class="card">
            <h3>Modo Demo / Reset</h3>
            <p>Resetea la base de datos a los valores iniciales para repetir la presentación.</p>
            <button class="btn btn-danger" onclick="resetDB()">Ejecutar Reset</button>
        </div>
    </div>
    <script>
        async function resetDB() {{
            const res = await fetch('/api/demo/reset', {{ method: 'POST' }});
            alert("Reset ejecutado. (Revisa la consola del backend para ver db:reset)");
        }}
    </script>
</body>
</html>
""")

# update app.js for dashboard
write_file("app.js", """
async function fetchTelemetry() {
    try {
        const res = await fetch('/api/telemetry/latest');
        const data = await res.json();
        if (data) {
            document.getElementById('val-temp').innerText = data.temperature.toFixed(1) + ' °C';
            document.getElementById('val-soil').innerText = data.soilMoisture.toFixed(1) + ' %';
            document.getElementById('val-water').innerText = data.waterLevel.toFixed(1) + ' %';
        }
    } catch(e) {}
}
setInterval(fetchTelemetry, 2000);
fetchTelemetry();
""")

print("Frontend files built.")
