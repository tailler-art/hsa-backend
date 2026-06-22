import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const formato = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
    colorize(),
    formato
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: 'logs/erros.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: 'logs/app.log' }),
  ],
});
