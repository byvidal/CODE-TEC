const dates = require('../utils/dates');

exports.sendAlert = async (phoneNumber, message) => {
    // En un entorno de producción, esto haría un POST a Twilio, Meta Cloud API o CallMeBot.
    // Ejemplo CallMeBot: fetch(`https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(message)}&apikey=YOUR_API_KEY`)
    
    return new Promise((resolve) => {
        setTimeout(() => {
            const timestamp = new Date(dates.now()).toLocaleTimeString('es-MX');
            console.log(`\n=================================================`);
            console.log(`📱 [WHATSAPP API - SIMULACIÓN] - ${timestamp}`);
            console.log(`=================================================`);
            console.log(`Destinatario: ${phoneNumber || '+52 55 XXXX XXXX'}`);
            console.log(`Mensaje enviado:`);
            console.log(message);
            console.log(`=================================================\n`);
            resolve(true);
        }, 500); // Simular latencia de red
    });
};
