"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autenticar = autenticar;
exports.autorizar = autorizar;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ erro: 'Token de autenticação não fornecido' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.usuario = payload;
        next();
    }
    catch {
        res.status(401).json({ erro: 'Token inválido ou expirado' });
    }
}
function autorizar(...perfis) {
    return (req, res, next) => {
        if (!req.usuario) {
            res.status(401).json({ erro: 'Não autenticado' });
            return;
        }
        if (!perfis.includes(req.usuario.perfil)) {
            res.status(403).json({ erro: 'Acesso negado para este perfil' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=auth.middleware.js.map