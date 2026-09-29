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
