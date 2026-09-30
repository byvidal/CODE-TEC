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

app.use(errorHandler);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Greenhouse Monitor Backend running on http://localhost:${PORT}`);
    });
}

module.exports = app;
