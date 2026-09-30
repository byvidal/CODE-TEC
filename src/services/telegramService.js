const https = require('https');
const dates = require('../utils/dates');

exports.sendAlert = (chatId, message) => {
    return new Promise((resolve) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const targetChat = process.env.TELEGRAM_CHAT_ID || chatId;

        // Graceful fallback si no hay token (simula en terminal)
        if (!token || !targetChat) {
            const timestamp = new Date(dates.now()).toLocaleTimeString('es-MX');
            console.log(`\n=================================================`);
            console.log(`🤖 [TELEGRAM BOT API - SIMULACIÓN] - ${timestamp}`);
            console.log(`=================================================`);
            console.log(`Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en .env`);
            console.log(`Chat Destino: ${targetChat || 'Sin configurar'}`);
            console.log(`Mensaje enviado:`);
            console.log(message);
            console.log(`=================================================\n`);
            return resolve(true); 
        }

        const payload = JSON.stringify({
            chat_id: targetChat,
            text: message,
            parse_mode: 'Markdown'
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ [TELEGRAM] Alerta oficial enviada a ${targetChat}`);
                    resolve(true);
                } else {
                    console.error(`❌ [TELEGRAM] Error de la API: ${res.statusCode} - ${data}`);
                    resolve(false);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`❌ [TELEGRAM] Error de red al contactar Telegram: ${e.message}`);
            resolve(false);
        });

        req.write(payload);
        req.end();
    });
};
