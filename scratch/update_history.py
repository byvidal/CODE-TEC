import io
import os

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC\public"
hist_path = os.path.join(base_dir, 'history.html')

with io.open(hist_path, 'r', encoding='utf-8') as f:
    hist_html = f.read()

new_body = """
    <div class="panel">
        <div class="panel-head" style="margin-bottom: 5px;">
            <strong>Telemetría Histórica</strong>
            <button class="btn-sm btn-green" onclick="exportData()">⬇ Exportar CSV</button>
        </div>
        <p style="color:var(--muted); margin-top:-5px; margin-bottom:20px;">Consulta y filtra los registros guardados de tus sensores.</p>
        
        <div style="background: var(--bg); padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--line);">
            <form id="filter-form" style="display:flex; flex-wrap:wrap; gap:15px; align-items:flex-end;">
                <div style="flex: 1; min-width: 150px;">
                    <label style="display:block; font-size:0.85rem; font-weight:600; color:var(--muted); margin-bottom:5px;">Fecha Inicio</label>
                    <input type="date" id="start-date" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; font-family:inherit;">
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label style="display:block; font-size:0.85rem; font-weight:600; color:var(--muted); margin-bottom:5px;">Fecha Fin</label>
                    <input type="date" id="end-date" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; font-family:inherit;">
                </div>
                <div style="flex: 1; min-width: 150px;">
                    <label style="display:block; font-size:0.85rem; font-weight:600; color:var(--muted); margin-bottom:5px;">Límite de registros</label>
                    <select id="limit" style="width:100%; padding:10px; border:1px solid var(--line); border-radius:6px; font-family:inherit;">
                        <option value="15">Últimos 15</option>
                        <option value="50">Últimos 50</option>
                        <option value="100">Últimos 100</option>
                        <option value="500">Últimos 500</option>
                    </select>
                </div>
                <div style="flex: 0 0 auto;">
                    <button type="submit" class="btn" style="padding:10px 20px; margin:0;">🔍 Buscar</button>
                </div>
            </form>
        </div>

        <div class="table-responsive">
            <table>
                <thead>
                    <tr>
                        <th>Marca de Tiempo</th>
                        <th style="text-align:right;">Temp (°C)</th>
                        <th style="text-align:right;">Hum. Aire (%)</th>
                        <th style="text-align:right;">H. Suelo (%)</th>
                        <th style="text-align:right;">N. Tanque (%)</th>
                    </tr>
                </thead>
                <tbody id="history-tbody">
                    <tr><td colspan="5" style="text-align:center; color:var(--muted);">Cargando historial...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
"""

new_js = """
    let pollingInterval = null;

    async function fetchHistory(isAutoRefresh = false) {
        try {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            const limit = document.getElementById('limit').value;
            
            let url = `/api/telemetry/history?limit=${limit}`;
            if(startDate) url += `&startDate=${startDate}`;
            if(endDate) url += `&endDate=${endDate}`;

            const res = await fetch(url);
            const data = await res.json();
            const tbody = document.getElementById('history-tbody');
            
            if(data.length === 0) {
                 tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--muted);">No hay registros para este filtro.</td></tr>';
                 return;
            }
            
            tbody.innerHTML = data.map(d => {
                const date = new Date(d.timestamp).toLocaleString('es-MX', {dateStyle: 'medium', timeStyle: 'medium'});
                return `<tr>
                    <td style="color:var(--muted); font-size:0.9rem;">${date}</td>
                    <td style="text-align:right; font-weight:600; color:${d.temperature>30?'var(--danger)':'var(--ink)'}">${d.temperature.toFixed(1)}</td>
                    <td style="text-align:right; font-weight:600;">${d.humidity.toFixed(1)}</td>
                    <td style="text-align:right; font-weight:600; color:${d.soilMoisture<40?'var(--warn)':'var(--water)'}">${d.soilMoisture.toFixed(1)}</td>
                    <td style="text-align:right; font-weight:600; color:${d.waterLevel<25?'var(--danger)':'var(--water)'}">${d.waterLevel.toFixed(1)}</td>
                </tr>`;
            }).join('');
        } catch(e) {}
    }

    document.getElementById('filter-form').onsubmit = function(e) {
        e.preventDefault();
        // Stop auto refresh if a specific date filter is applied to prevent jumping
        const sd = document.getElementById('start-date').value;
        const ed = document.getElementById('end-date').value;
        if(sd || ed) {
            if(pollingInterval) clearInterval(pollingInterval);
        } else {
            // Restart polling if filters are cleared
            if(pollingInterval) clearInterval(pollingInterval);
            pollingInterval = setInterval(() => fetchHistory(true), 5000);
        }
        fetchHistory();
    };
    
    function exportData() {
        alert("En el sistema en producción, esto descargará un archivo CSV compatible con Excel para su contador o ingeniero agrónomo.");
    }

    // Set today as max date for date pickers
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').max = today;
    document.getElementById('end-date').max = today;

    fetchHistory();
    pollingInterval = setInterval(() => fetchHistory(true), 5000);
"""

start_body = hist_html.find('<div class="wrap-dash">') + len('<div class="wrap-dash">')
end_body = hist_html.find('</div>\n<script>')

start_script = hist_html.find('<script>') + len('<script>')
end_script = hist_html.find('</script>')

final_html = hist_html[:start_body] + new_body + hist_html[end_body:start_script] + new_js + hist_html[end_script:]

with io.open(hist_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

print("History updated.")
