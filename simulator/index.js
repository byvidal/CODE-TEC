const http = require('http');
const SERVER_URL = 'http://localhost:3000/api/telemetry/readings';

let soilMoisture = 60;
let temp = 25;
let water = 80;

const sendReading = () => {
    // Random variations
    soilMoisture -= Math.random() * 2; // slowly dries
    if (soilMoisture < 20) soilMoisture = 20; // stay low to trigger alert
    
    const data = {
        greenhouseId: "greenhouse_01",
        zoneId: "zone_a",
        deviceId: "device_esp32_01",
        timestamp: new Date().toISOString(),
        readings: {
            temperature: temp + (Math.random() * 2 - 1),
            humidity: 50 + (Math.random() * 10 - 5),
            soilMoisture: soilMoisture,
            light: 800 + (Math.random() * 100 - 50),
            waterLevel: water
        }
    };
    
    const req = http.request(SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => console.log('Sent:', data.readings.soilMoisture.toFixed(2), 'Res:', body));
    });
    
    req.on('error', e => console.error(e.message));
    req.write(JSON.stringify(data));
    req.end();
};

console.log("Starting simulator...");
setInterval(sendReading, 5000);
