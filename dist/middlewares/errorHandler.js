"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const logger_1 = require("../config/logger");
class AppError extends Error {
    message;
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({ erro: err.message });
        return;
    }
    logger_1.logger.error('Erro não tratado:', err);
    res.status(500).json({
        erro: process.env.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : err.message,
    });
}
//# sourceMappingURL=errorHandler.js.map