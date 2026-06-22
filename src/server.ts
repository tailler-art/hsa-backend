import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { testarConexao } from './config/database';
import { logger } from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes/index';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from './types';

const app = express();
const httpServer = createServer(app);

const io = new SocketIO(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true },
});

app.set('io', io);

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { erro: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
app.use('/api', limiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { erro: 'Muitas tentativas de login. Aguarde 15 minutos.' },
});
app.use('/api/auth/login', loginLimiter);

app.use('/api', routes);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    sistema: 'HSA Assessoria Sanitária — Sistema de Chamados',
    versao: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use(errorHandler);

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string;
  if (!token) { next(new Error('Token não fornecido')); return; }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    socket.data.usuario = payload;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  logger.info(`Socket conectado: ${socket.data.usuario?.email}`);

  socket.on('entrar_chamado', (chamado_id: string) => {
    socket.join(`chamado:${chamado_id}`);
    logger.debug(`${socket.data.usuario?.email} entrou na sala chamado:${chamado_id}`);
  });

  socket.on('sair_chamado', (chamado_id: string) => {
    socket.leave(`chamado:${chamado_id}`);
  });

  socket.on('digitando', (chamado_id: string) => {
    socket.to(`chamado:${chamado_id}`).emit('usuario_digitando', {
      usuario: socket.data.usuario?.email,
    });
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket desconectado: ${socket.data.usuario?.email}`);
  });
});

const PORT = process.env.PORT || 3000;

async function iniciar(): Promise<void> {
  await testarConexao();
  httpServer.listen(PORT, () => {
    logger.info('');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('  HSA Assessoria Sanitária — Sistema de Chamados');
    logger.info(`  Servidor rodando em http://localhost:${PORT}`);
    logger.info(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

iniciar().catch((err) => {
  logger.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
