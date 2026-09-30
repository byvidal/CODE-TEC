const https = require('https');
const dates = require('../utils/dates');

exports.sendAlert = (phoneNumber, message) => {
    return new Promise((resolve) => {
        const apiKey = process.env.CALLMEBOT_API_KEY;
        const targetPhone = process.env.WHATSAPP_PHONE_NUMBER || phoneNumber;

        // Graceful fallback si no hay token (simula en terminal)
        if (!apiKey || !targetPhone) {
            const timestamp = new Date(dates.now()).toLocaleTimeString('es-MX');
            console.log(`\n=================================================`);
            console.log(`📱 [WHATSAPP CALLMEBOT - SIMULACIÓN] - ${timestamp}`);
            console.log(`=================================================`);
            console.log(`Falta CALLMEBOT_API_KEY o WHATSAPP_PHONE_NUMBER en .env`);
            console.log(`Destinatario: ${targetPhone || 'Sin configurar'}`);
            console.log(`Mensaje enviado:`);
            console.log(message);
            console.log(`=================================================\n`);
            return resolve(true); 
        }

        const encodedMessage = encodeURIComponent(message);
        
        const options = {
            hostname: 'api.callmebot.com',
            port: 443,
            path: `/whatsapp.php?phone=${targetPhone}&text=${encodedMessage}&apikey=${apiKey}`,
            method: 'GET'
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                // CallMeBot devuelve 200 en éxito
                if (res.statusCode === 200) {
                    console.log(`✅ [WHATSAPP] Alerta enviada a ${targetPhone}`);
                    resolve(true);
                } else {
                    console.error(`❌ [WHATSAPP] Error de la API: ${res.statusCode} - ${data}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ [WHATSAPP] Error de red al contactar CallMeBot: ${e.message}`);
            resolve(false);
        });

        req.end();
    });
};
