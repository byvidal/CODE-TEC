import os
import json

base_dir = r"c:\Users\ibrya\Documents\TECNM\HakaReg\CODE-TEC"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# .env.example
write_file(".env.example", """
PORT=3000
NODE_ENV=development
DATABASE_PATH=./data/greenhouse.db
CORS_ORIGIN=http://localhost:3000

TELEMETRY_DEVICE_TOKEN=demo-device-token
TELEMETRY_STALE_AFTER_SECONDS=30
TELEMETRY_MAX_BODY_SIZE=32kb
TELEMETRY_RATE_LIMIT_PER_MINUTE=120

DEMO_MODE=true
DEMO_GREENHOUSE_ID=greenhouse_01

BILLING_MODE=mock
PAYMENT_PROVIDER=mock
PAYMENT_WEBHOOK_SECRET=demo-webhook-secret
""")

# src/server.js
write_file("src/server.js", """
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const healthRoutes = require('./routes/health');
const greenhouseRoutes = require('./routes/greenhouses');
const telemetryRoutes = require('./routes/telemetry');
const deviceRoutes = require('./routes/devices');
const alertRoutes = require('./routes/alerts');
const actuatorRoutes = require('./routes/actuators');
const eventRoutes = require('./routes/events');
const dashboardRoutes = require('./routes/dashboard');
const demoRoutes = require('./routes/demo');
const billingRoutes = require('./routes/billing');

const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: process.env.TELEMETRY_MAX_BODY_SIZE || '32kb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/greenhouses', greenhouseRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/actuators', actuatorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/billing', billingRoutes);

app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Greenhouse Monitor Backend running on http://localhost:${PORT}`);
    });
}

module.exports = app;
""")

# ... Define other necessary backend files ...
write_file("src/repositories/db.js", """
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/greenhouse.db');
if (!fs.existsSync(path.dirname(dbPath))) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
const db = new sqlite3.Database(dbPath);

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

module.exports = { query, run, db };
""")

# src/utils/errors.js
write_file("src/utils/errors.js", """
class AppError extends Error {
    constructor(message, code, status) {
        super(message);
        this.code = code;
        this.status = status;
    }
}
module.exports = AppError;
""")

# src/middleware/errorHandler.js
write_file("src/middleware/errorHandler.js", """
const AppError = require('../utils/errors');
const ids = require('../utils/ids');

module.exports = (err, req, res, next) => {
    console.error(`[Error] ${err.message}`);
    const status = err.status || 500;
    const code = err.code || 'INTERNAL_ERROR';
    const requestId = ids.generateId('req');
    
    res.status(status).json({
        error: err.message || 'Error interno del servidor',
        code: code,
        status: status,
        requestId: requestId
    });
};
""")

print("Initial structure started.")
