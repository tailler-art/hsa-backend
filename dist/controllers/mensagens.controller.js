"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enviarMensagem = enviarMensagem;
exports.listarMensagens = listarMensagens;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middlewares/errorHandler");
async function enviarMensagem(req, res, next) {
    try {
        const { id: chamado_id } = req.params;
        const { conteudo, interna = false } = req.body;
        if (!conteudo?.trim())
            throw new errorHandler_1.AppError('Conteúdo da mensagem não pode ser vazio');
        const podeInterna = ['atendente', 'gestor', 'administrador'].includes(req.usuario.perfil);
        if (interna && !podeInterna)
            throw new errorHandler_1.AppError('Apenas atendentes podem enviar mensagens internas', 403);
        const mensagem = await (0, database_1.queryOne)(`INSERT INTO mensagens (chamado_id, autor_id, conteudo, interna)
       VALUES ($1, $2, $3, $4) RETURNING *`, [chamado_id, req.usuario.id, conteudo.trim(), interna]);
        const mensagemCompleta = await (0, database_1.queryOne)(`SELECT m.*, u.nome AS autor_nome, u.perfil AS autor_perfil
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id
       WHERE m.id = $1`, [mensagem.id]);
        req.app.get('io')?.to(`chamado:${chamado_id}`).emit('nova_mensagem', mensagemCompleta);
        res.status(201).json(mensagemCompleta);
    }
    catch (err) {
        next(err);
    }
}
async function listarMensagens(req, res, next) {
    try {
        const { id: chamado_id } = req.params;
        const podeVerInternas = ['atendente', 'gestor', 'administrador'].includes(req.usuario.perfil);
        const mensagens = await (0, database_1.query)(`SELECT m.*, u.nome AS autor_nome, u.perfil AS autor_perfil
       FROM mensagens m JOIN usuarios u ON u.id = m.autor_id
       WHERE m.chamado_id = $1
         AND ($2 = TRUE OR m.interna = FALSE)
       ORDER BY m.criado_em ASC`, [chamado_id, podeVerInternas]);
        res.json(mensagens);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=mensagens.controller.js.map