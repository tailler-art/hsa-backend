"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listar = listar;
exports.criar = criar;
exports.alterarSenha = alterarSenha;
exports.toggleAtivo = toggleAtivo;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middlewares/errorHandler");
async function listar(_req, res, next) {
    try {
        const usuarios = await (0, database_1.query)('SELECT id, nome, email, perfil, departamento, ativo, criado_em FROM usuarios ORDER BY nome');
        res.json(usuarios);
    }
    catch (err) {
        next(err);
    }
}
async function criar(req, res, next) {
    try {
        const { nome, email, senha, perfil, departamento } = req.body;
        if (!nome || !email || !senha || !perfil || !departamento) {
            throw new errorHandler_1.AppError('Todos os campos são obrigatórios');
        }
        const existente = await (0, database_1.queryOne)('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        if (existente)
            throw new errorHandler_1.AppError('Email já cadastrado');
        const senha_hash = await bcryptjs_1.default.hash(senha, 12);
        const usuario = await (0, database_1.queryOne)(`INSERT INTO usuarios (nome, email, senha_hash, perfil, departamento)
       VALUES ($1, $2, $3, $4::perfil_enum, $5::departamento_enum)
       RETURNING id, nome, email, perfil, departamento, ativo, criado_em`, [nome, email.toLowerCase(), senha_hash, perfil, departamento]);
        res.status(201).json(usuario);
    }
    catch (err) {
        next(err);
    }
}
async function alterarSenha(req, res, next) {
    try {
        const { senhaAtual, novaSenha } = req.body;
        const usuario = await (0, database_1.queryOne)('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
        if (!usuario)
            throw new errorHandler_1.AppError('Usuário não encontrado', 404);
        const senhaValida = await bcryptjs_1.default.compare(senhaAtual, usuario.senha_hash);
        if (!senhaValida)
            throw new errorHandler_1.AppError('Senha atual incorreta', 401);
        if (novaSenha.length < 8)
            throw new errorHandler_1.AppError('Nova senha deve ter pelo menos 8 caracteres');
        const novaSenhaHash = await bcryptjs_1.default.hash(novaSenha, 12);
        await (0, database_1.query)('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [novaSenhaHash, req.usuario.id]);
        res.json({ mensagem: 'Senha alterada com sucesso' });
    }
    catch (err) {
        next(err);
    }
}
async function toggleAtivo(req, res, next) {
    try {
        const { id } = req.params;
        if (id === req.usuario.id)
            throw new errorHandler_1.AppError('Não é possível desativar a própria conta');
        const usuario = await (0, database_1.queryOne)(`UPDATE usuarios SET ativo = NOT ativo
       WHERE id = $1 RETURNING id, nome, email, perfil, departamento, ativo`, [id]);
        if (!usuario)
            throw new errorHandler_1.AppError('Usuário não encontrado', 404);
        res.json(usuario);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=usuarios.controller.js.map