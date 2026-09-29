import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"

dashboard_html = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - EDAFONEX</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        body { background-color: var(--bg, #f4f6f8); font-family: var(--body, system-ui, sans-serif); margin: 0; padding: 0; color: var(--ink, #333); }
        :root {
            --leaf: #10b981; --leaf-dark: #059669; --water: #3b82f6; --soil: #b45309; --danger: #ef4444; --warn: #f59e0b;
            --panel: #ffffff; --line: #e5e7eb; --muted: #6b7280; --ink: #111827; --bg: #f9fafb; --display: 'Inter', system-ui, sans-serif;
        }
        
        /* Navbar */
        header { background: #fff; padding: 15px 20px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
        .brand { font: 800 1.2rem var(--display); text-decoration: none; display: flex; align-items: center; gap: 10px; color: var(--ink); }
        .brand svg { width: 24px; height: 24px; }
        .nav-links a { margin-left: 20px; text-decoration: none; color: var(--muted); font-weight: 500; transition: color 0.2s; }
        .nav-links a:hover, .nav-links a.active { color: var(--leaf-dark); }
        
        /* Dashboard Layout */
        .wrap-dash { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
        @media (max-width: 860px) { .wrap-dash { grid-template-columns: 1fr; } }
        
        /* Panels */
        .panel { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; padding: 22px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 30px; }
        .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--line); padding-bottom: 10px; }
        .panel-head strong { font: 700 1.2rem var(--display); color: var(--ink); }
        .live { display: flex; align-items: center; gap: 8px; font-size: .85rem; color: var(--muted); }
        .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--leaf); animation: pulse 1.8s infinite; }
        @keyframes pulse { 50% { opacity: .25 } }
        
        /* Telemetry Readings */
        .reading { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 4px 12px; padding: 14px 0; border-top: 1px solid var(--line); }
        .reading:first-of-type { border-top: 0; }
        .reading .name { color: var(--muted); font-size: 1rem; }
        .reading .val { font: 700 2rem var(--display); font-variant-numeric: tabular-nums; color: var(--ink); }
        .bar { grid-column: 1 / -1; height: 8px; background: var(--line); border-radius: 4px; overflow: hidden; margin-top: 5px; }
        .bar i { display: block; height: 100%; width: 0%; background: var(--leaf); border-radius: 4px; transition: width 0.8s, background 0.4s; }
        
        /* Alerts & Status */
        .alert { margin: 20px 0; padding: 15px; border-radius: 10px; font-size: 1rem; font-weight: 500; background: color-mix(in srgb, var(--leaf) 12%, transparent); border: 1px solid color-mix(in srgb, var(--leaf) 35%, transparent); color: var(--leaf-dark); display: flex; align-items: center; gap: 10px; }
        .alert.hot { background: color-mix(in srgb, var(--danger) 13%, transparent); border-color: color-mix(in srgb, var(--danger) 45%, transparent); color: var(--danger); }
        
        /* Controls */
        .controls { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .ctl { font: 500 1rem var(--body); color: var(--ink); background: transparent; border: 2px solid var(--line); border-radius: 12px; padding: 15px; cursor: pointer; text-align: left; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s; }
        .ctl:hover { border-color: #ccc; }
        .ctl[aria-pressed="true"] { border-color: var(--leaf); background: color-mix(in srgb, var(--leaf) 8%, transparent); }
        .ctl b { font-weight: 700; font-size: 1.2rem; }
        .ctl span { color: var(--muted); font-size: 0.9rem; }
        
        /* Efficiency Card */
        .eff-stat { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px dashed var(--line); }
        .eff-stat:last-child { border-bottom: none; }
        .eff-stat span { color: var(--muted); }
        .eff-stat strong { font-size: 1.1rem; color: var(--ink); }
        .tag-green { background: color-mix(in srgb, var(--leaf) 15%, transparent); color: var(--leaf-dark); padding: 4px 8px; border-radius: 6px; font-size: 0.85rem; font-weight: bold; }
    </style>
</head>
<body>

<header>
    <a class="brand" href="dashboard.html">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 29V15" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M16 17C16 10 11 6 4 6c0 7 4 11 12 11Z" fill="var(--leaf)"/><path d="M16 14c0-6 4-9 11-9 0 6-4 9-11 9Z" fill="var(--water)"/></svg>
        EDAFONEX
    </a>
    <div class="nav-links">
        <a href="dashboard.html" class="active">Dashboard</a>
        <a href="alerts.html">Alertas</a>
        <a href="history.html">Historial</a>
        <a href="settings.html">Configuración</a>
    </div>
</header>

<div class="wrap-dash">
    <!-- Columna Izquierda: Monitoreo en Vivo -->
    <div>
        <div class="panel" aria-label="Lecturas de Sensores">
            <div class="panel-head">
                <strong>Sensores en Tiempo Real</strong>
                <span class="live"><span class="dot"></span>Conectado</span>
            </div>
            
            <div class="reading">
                <span class="name">Temperatura Ambiente</span>
                <span class="val" id="vt">-- °C</span>
                <div class="bar"><i id="bt"></i></div>
            </div>
            <div class="reading">
                <span class="name">Humedad del Sustrato</span>
                <span class="val" id="vh">-- %</span>
                <div class="bar"><i id="bh"></i></div>
            </div>
            <div class="reading">
                <span class="name">Nivel de Tanque de Agua</span>
                <span class="val" id="vw">-- %</span>
                <div class="bar"><i id="bw"></i></div>
            </div>

            <div class="alert" id="status-alert">
                <span>🛡️</span> <span id="status-text">Cultivo Protegido. Todo en rango.</span>
            </div>
        </div>
    </div>

    <!-- Columna Derecha: Controles y Eficiencia -->
    <div>
        <div class="panel">
            <div class="panel-head">
                <strong>Teleprocesos y Control</strong>
            </div>
            <div class="controls">
                <button class="ctl" id="btn-pump" aria-pressed="false" onclick="toggleActuator('pump_01', 'btn-pump')">
                    <span>Bomba de Riego</span>
                    <b id="lbl-pump">Apagada</b>
                </button>
                <button class="ctl" id="btn-fan" aria-pressed="false" onclick="toggleActuator('fan_01', 'btn-fan')">
                    <span>Ventilación</span>
                    <b id="lbl-fan">Apagado</b>
                </button>
            </div>
            <div style="margin-top: 15px;">
                <button class="ctl" style="width: 100%; text-align: center; flex-direction: row; justify-content: center;" aria-pressed="true" onclick="alert('El control inteligente está activo. Los actuadores reaccionarán a las reglas climáticas automáticamente.')">
                    <span>Modo de Control:</span> <b>🤖 Inteligente (Auto)</b>
                </button>
            </div>
        </div>

        <div class="panel">
            <div class="panel-head">
                <strong>Eficiencia y Ahorros</strong>
            </div>
            <div class="eff-stat">
                <span>Estado de Riego</span>
                <strong class="tag-green">Óptimo - Sin desperdicio</strong>
            </div>
            <div class="eff-stat">
                <span>Última activación de bomba</span>
                <strong id="last-pump">Ayer, 18:30 hrs</strong>
            </div>
            <div class="eff-stat">
                <span>Alertas enviadas hoy (WhatsApp)</span>
                <strong>0</strong>
            </div>
            <p style="font-size: 0.9rem; color: var(--muted); margin-top: 20px; line-height: 1.5;">
                EDAFONEX está monitoreando el sustrato de forma constante. La bomba solo se encenderá cuando la planta realmente requiera agua, ahorrando electricidad y evitando el exceso de humedad.
            </p>
        </div>
    </div>
</div>

<script>
    // Conexión real al backend
    async function fetchTelemetry() {
        try {
            const res = await fetch('/api/telemetry/latest');
            const data = await res.json();
            if (data) {
                const t = data.temperature;
                const h = data.soilMoisture;
                const w = data.waterLevel;
                
                document.getElementById('vt').innerText = t.toFixed(1) + ' °C';
                document.getElementById('vh').innerText = h.toFixed(1) + ' %';
                document.getElementById('vw').innerText = w.toFixed(1) + ' %';
                
                // Actualizar barras
                const bt = document.getElementById('bt');
                bt.style.width = Math.min(Math.max((t - 10) / 35 * 100, 0), 100) + '%';
                bt.style.background = t > 30 ? 'var(--danger)' : 'var(--leaf)';
                
                const bh = document.getElementById('bh');
                bh.style.width = h + '%';
                bh.style.background = h < 40 ? 'var(--warn)' : 'var(--water)';
                
                const bw = document.getElementById('bw');
                bw.style.width = w + '%';
                bw.style.background = w < 25 ? 'var(--danger)' : 'var(--water)';
                
                // Actualizar Estado General
                const alertBox = document.getElementById('status-alert');
                const alertTxt = document.getElementById('status-text');
                
                if (t > 30 || h < 40 || w < 25) {
                    alertBox.className = 'alert hot';
                    let issues = [];
                    if(t>30) issues.push('Temp Alta');
                    if(h<40) issues.push('Sustrato Seco');
                    if(w<25) issues.push('Nivel Tanque Crítico');
                    alertTxt.innerHTML = '⚠️ <strong>Peligro detectado:</strong> ' + issues.join(', ') + '. Notificando al WhatsApp...';
                } else {
                    alertBox.className = 'alert';
                    alertTxt.innerHTML = '🛡️ <strong>Cultivo Protegido.</strong> Condiciones óptimas.';
                }
            }
        } catch(e) {}
    }

    async function fetchActuators() {
        try {
            const res = await fetch('/api/actuators');
            const data = await res.json();
            
            const pump = data.find(a => a.type === 'pump');
            const fan = data.find(a => a.type === 'fan');
            
            if(pump) {
                const btn = document.getElementById('btn-pump');
                const lbl = document.getElementById('lbl-pump');
                const isOn = pump.state === 'on';
                btn.setAttribute('aria-pressed', isOn);
                lbl.innerText = isOn ? 'Encendida' : 'Apagada';
            }
            if(fan) {
                const btn = document.getElementById('btn-fan');
                const lbl = document.getElementById('lbl-fan');
                const isOn = fan.state === 'on';
                btn.setAttribute('aria-pressed', isOn);
                lbl.innerText = isOn ? 'Encendido' : 'Apagado';
            }
        } catch(e) {}
    }

    async function toggleActuator(id, btnId) {
        const btn = document.getElementById(btnId);
        const currentState = btn.getAttribute('aria-pressed') === 'true';
        const newState = currentState ? 'off' : 'on';
        
        try {
            const res = await fetch('/api/actuators/' + id + '/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ state: newState, source: 'manual' })
            });
            const data = await res.json();
            if(!res.ok) {
                alert("Error de seguridad: " + data.error);
            } else {
                fetchActuators();
            }
        } catch(e) {}
    }

    setInterval(fetchTelemetry, 2000);
    setInterval(fetchActuators, 2000);
    fetchTelemetry();
    fetchActuators();
</script>

</body>
</html>
"""

with io.open(os.path.join(base_dir, 'dashboard.html'), 'w', encoding='utf-8') as f:
    f.write(dashboard_html.strip())

print("Dashboard rewritten.")
