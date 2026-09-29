const AppError = require('../utils/errors');
const deviceRepo = require('../repositories/deviceRepository');

exports.authenticateDevice = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers['x-device-token'];
        if (!authHeader) throw new AppError("Falta token de dispositivo", "UNAUTHORIZED_DEVICE", 401);
        
        const token = authHeader.replace('Bearer ', '');
        const { deviceId } = req.body;
        
        if (!deviceId) throw new AppError("Falta deviceId", "VALIDATION_ERROR", 400);
        
        const device = await deviceRepo.getById(deviceId);
        if (!device) throw new AppError("Dispositivo no encontrado", "UNAUTHORIZED_DEVICE", 401);
        
        if (device.deviceToken !== token && process.env.TELEMETRY_DEVICE_TOKEN !== token) {
            throw new AppError("Token inválido", "UNAUTHORIZED_DEVICE", 401);
        }
        
        req.device = device;
        next();
    } catch (err) {
        next(err);
    }
};
