const http = require('http');

const args = process.argv.slice(2);
let scenario = 'normal';
args.forEach(a => { if (a.startsWith('--scenario=')) scenario = a.split('=')[1]; });

let soilMoisture = 60;
let temperature = 25;
let waterLevel = 80;
let humidity = 50;

if (scenario === 'soil-dry') { soilMoisture = 30; }
if (scenario === 'heat') { temperature = 35; }
if (scenario === 'low-water') { waterLevel = 10; }

console.log(`Starting simulator in ${scenario} mode...`);

const sendReading = () => {
    if (scenario === 'disconnect') return; // Do not send data

    const data = {
        greenhouseId: "greenhouse_01",
        zoneId: "zone_a",
        deviceId: "device_esp32_01",
        readings: { temperature, humidity, soilMoisture, light: 800, waterLevel }
    };
    
    const req = http.request('http://localhost:3000/api/telemetry/readings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer demo-device-token' }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('Res:', res.statusCode, body));
    });
    
    req.on('error', e => console.error(e.message));
    req.write(JSON.stringify(data));
    req.end();
};

setInterval(sendReading, parseInt(process.env.SIMULATOR_INTERVAL_MS) || 3000);
sendReading();
