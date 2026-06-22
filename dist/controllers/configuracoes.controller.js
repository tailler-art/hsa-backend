"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listar = listar;
exports.atualizar = atualizar;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middlewares/errorHandler");
async function listar(_req, res, next) {
    try {
        const rows = await (0, database_1.query)('SELECT chave, valor, descricao, atualizado_em FROM configuracoes ORDER BY chave');
        const obj = {};
        rows.forEach((r) => { obj[r.chave] = r.valor; });
        res.json(obj);
    }
    catch (err) {
        next(err);
    }
}
async function atualizar(req, res, next) {
    try {
        const { chave } = req.params;
        const { valor } = req.body;
        if (valor === undefined || valor === null)
            throw new errorHandler_1.AppError('Campo valor é obrigatório');
        const existe = await (0, database_1.queryOne)('SELECT chave FROM configuracoes WHERE chave = $1', [chave]);
        if (!existe)
            throw new errorHandler_1.AppError('Configuração não encontrada', 404);
        // Validações específicas
        if (['sla_critica', 'sla_alta', 'sla_media', 'sla_baixa'].includes(chave)) {
            const minutos = Number(valor);
            if (isNaN(minutos) || minutos < 1)
                throw new errorHandler_1.AppError('SLA deve ser um número maior que zero');
        }
        if (['departamentos', 'categorias'].includes(chave)) {
            if (!Array.isArray(valor) || valor.length === 0)
                throw new errorHandler_1.AppError('Deve ser uma lista com ao menos um item');
            if (valor.some((v) => typeof v !== 'string' || !v.trim()))
                throw new errorHandler_1.AppError('Todos os itens devem ser textos não vazios');
        }
        const atualizado = await (0, database_1.queryOne)(`UPDATE configuracoes SET valor = $2::jsonb, atualizado_em = NOW()
       WHERE chave = $1 RETURNING chave, valor, atualizado_em`, [chave, JSON.stringify(valor)]);
        res.json(atualizado);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=configuracoes.controller.js.map