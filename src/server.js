require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const healthRoutes = require('./routes/health');
const greenhouseRoutes = require('./routes/greenhouses');
const telemetryRoutes = require('./routes/telemetry');
const alertRoutes = require('./routes/alerts');
const actuatorRoutes = require('./routes/actuators');
const billingRoutes = require('./routes/billing');
const demoRoutes = require('./routes/demo');
const eventRoutes = require('./routes/events');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/greenhouses', greenhouseRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/actuators', actuatorRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/events', eventRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Greenhouse Monitor API running on http://localhost:${PORT}`);
});
