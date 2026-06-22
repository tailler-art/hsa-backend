"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const logger_1 = require("./config/logger");
const errorHandler_1 = require("./middlewares/errorHandler");
const index_1 = __importDefault(require("./routes/index"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
});
app.set('io', io);
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, morgan_1.default)(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api', limiter);
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
app.use('/api/auth/login', loginLimiter);
app.use('/api', index_1.default);
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        sistema: 'HSA Assessoria Sanitária — Sistema de Chamados',
        versao: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
app.use(errorHandler_1.errorHandler);
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        next(new Error('Token não fornecido'));
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        socket.data.usuario = payload;
        next();
    }
    catch {
        next(new Error('Token inválido'));
    }
});
io.on('connection', (socket) => {
    logger_1.logger.info(`Socket conectado: ${socket.data.usuario?.email}`);
    socket.on('entrar_chamado', (chamado_id) => {
        socket.join(`chamado:${chamado_id}`);
        logger_1.logger.debug(`${socket.data.usuario?.email} entrou na sala chamado:${chamado_id}`);
    });
    socket.on('sair_chamado', (chamado_id) => {
        socket.leave(`chamado:${chamado_id}`);
    });
    socket.on('digitando', (chamado_id) => {
        socket.to(`chamado:${chamado_id}`).emit('usuario_digitando', {
            usuario: socket.data.usuario?.email,
        });
    });
    socket.on('disconnect', () => {
        logger_1.logger.debug(`Socket desconectado: ${socket.data.usuario?.email}`);
    });
});
const PORT = process.env.PORT || 3000;
async function iniciar() {
    await (0, database_1.testarConexao)();
    httpServer.listen(PORT, () => {
        logger_1.logger.info('');
        logger_1.logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        logger_1.logger.info('  HSA Assessoria Sanitária — Sistema de Chamados');
        logger_1.logger.info(`  Servidor rodando em http://localhost:${PORT}`);
        logger_1.logger.info(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
        logger_1.logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
}
iniciar().catch((err) => {
    logger_1.logger.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map