"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.perfil = perfil;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const errorHandler_1 = require("../middlewares/errorHandler");
function gerarTokens(payload) {
    const accessToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });
    const refreshToken = jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
    return { accessToken, refreshToken };
}
async function login(req, res, next) {
    try {
        const { email, senha } = req.body;
        if (!email || !senha)
            throw new errorHandler_1.AppError('Email e senha são obrigatórios');
        const usuario = await (0, database_1.queryOne)('SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE', [email.toLowerCase()]);
        if (!usuario)
            throw new errorHandler_1.AppError('Credenciais inválidas', 401);
        const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senha_hash);
        if (!senhaValida)
            throw new errorHandler_1.AppError('Credenciais inválidas', 401);
        const payload = {
            id: usuario.id,
            email: usuario.email,
            perfil: usuario.perfil,
            departamento: usuario.departamento,
        };
        const { accessToken, refreshToken } = gerarTokens(payload);
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 7);
        await (0, database_1.query)('INSERT INTO refresh_tokens (usuario_id, token, expira_em) VALUES ($1, $2, $3)', [usuario.id, refreshToken, expiraEm]);
        res.json({
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                perfil: usuario.perfil,
                departamento: usuario.departamento,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (err) {
        next(err);
    }
}
async function refreshToken(req, res, next) {
    try {
        const { refreshToken: token } = req.body;
        if (!token)
            throw new errorHandler_1.AppError('Refresh token não fornecido');
        const registro = await (0, database_1.queryOne)('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
        if (!registro || new Date(registro.expira_em) < new Date()) {
            throw new errorHandler_1.AppError('Refresh token inválido ou expirado', 401);
        }
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const { accessToken, refreshToken: novoRefresh } = gerarTokens(payload);
        await (0, database_1.query)('DELETE FROM refresh_tokens WHERE token = $1', [token]);
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 7);
        await (0, database_1.query)('INSERT INTO refresh_tokens (usuario_id, token, expira_em) VALUES ($1, $2, $3)', [registro.usuario_id, novoRefresh, expiraEm]);
        res.json({ accessToken, refreshToken: novoRefresh });
    }
    catch (err) {
        next(err);
    }
}
async function logout(req, res, next) {
    try {
        const { refreshToken: token } = req.body;
        if (token) {
            await (0, database_1.query)('DELETE FROM refresh_tokens WHERE token = $1', [token]);
        }
        res.json({ mensagem: 'Logout realizado com sucesso' });
    }
    catch (err) {
        next(err);
    }
}
async function perfil(req, res, next) {
    try {
        const { id } = req.usuario;
        const usuario = await (0, database_1.queryOne)('SELECT id, nome, email, perfil, departamento, ativo, criado_em FROM usuarios WHERE id = $1', [id]);
        if (!usuario)
            throw new errorHandler_1.AppError('Usuário não encontrado', 404);
        res.json(usuario);
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=auth.controller.js.map