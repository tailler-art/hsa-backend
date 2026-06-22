"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testarConexao = testarConexao;
exports.query = query;
exports.queryOne = queryOne;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.pool = new pg_1.Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'hsa_chamados',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.pool.on('error', (err) => {
    console.error('Erro inesperado no pool do banco de dados:', err);
});
async function testarConexao() {
    const client = await exports.pool.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('✅ Banco de dados conectado com sucesso');
    }
    finally {
        client.release();
    }
}
async function query(sql, params) {
    const result = await exports.pool.query(sql, params);
    return result.rows;
}
async function queryOne(sql, params) {
    const rows = await query(sql, params);
    return rows[0] ?? null;
}
//# sourceMappingURL=database.js.map