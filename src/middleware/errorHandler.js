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
