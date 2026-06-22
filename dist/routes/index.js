"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const auth = __importStar(require("../controllers/auth.controller"));
const chamados = __importStar(require("../controllers/chamados.controller"));
const mensagens = __importStar(require("../controllers/mensagens.controller"));
const usuarios = __importStar(require("../controllers/usuarios.controller"));
const configuracoes = __importStar(require("../controllers/configuracoes.controller"));
const router = (0, express_1.Router)();
// ─── Auth ────────────────────────────────────────────────────
router.post('/auth/login', auth.login);
router.post('/auth/refresh', auth.refreshToken);
router.post('/auth/logout', auth_middleware_1.autenticar, auth.logout);
router.get('/auth/perfil', auth_middleware_1.autenticar, auth.perfil);
router.put('/auth/senha', auth_middleware_1.autenticar, auth.perfil);
// ─── Dashboard ───────────────────────────────────────────────
router.get('/dashboard', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('gestor', 'administrador'), chamados.dashboard);
// ─── Chamados ────────────────────────────────────────────────
router.get('/chamados', auth_middleware_1.autenticar, chamados.listar);
router.post('/chamados', auth_middleware_1.autenticar, chamados.criar);
router.get('/chamados/:id', auth_middleware_1.autenticar, chamados.buscarPorId);
router.patch('/chamados/:id/status', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('atendente', 'gestor', 'administrador'), chamados.atualizarStatus);
router.patch('/chamados/:id/atribuir', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('gestor', 'administrador'), chamados.atribuir);
router.patch('/chamados/:id/avaliar', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('solicitante'), chamados.avaliar);
// ─── Mensagens ───────────────────────────────────────────────
router.get('/chamados/:id/mensagens', auth_middleware_1.autenticar, mensagens.listarMensagens);
router.post('/chamados/:id/mensagens', auth_middleware_1.autenticar, mensagens.enviarMensagem);
// ─── Usuários ─────────────────────────────────────────────────
router.get('/usuarios', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('gestor', 'administrador'), usuarios.listar);
router.post('/usuarios', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('administrador'), usuarios.criar);
router.put('/usuarios/senha', auth_middleware_1.autenticar, usuarios.alterarSenha);
router.patch('/usuarios/:id/ativo', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('administrador'), usuarios.toggleAtivo);
// ─── Configurações ───────────────────────────────────────────
router.get('/configuracoes', auth_middleware_1.autenticar, configuracoes.listar);
router.patch('/configuracoes/:chave', auth_middleware_1.autenticar, (0, auth_middleware_1.autorizar)('administrador'), configuracoes.atualizar);
exports.default = router;
//# sourceMappingURL=index.js.map