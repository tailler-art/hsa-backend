import { Router } from 'express';
import { autenticar, autorizar } from '../middlewares/auth.middleware';
import * as auth from '../controllers/auth.controller';
import * as chamados from '../controllers/chamados.controller';
import * as mensagens from '../controllers/mensagens.controller';
import * as usuarios from '../controllers/usuarios.controller';
import * as configuracoes from '../controllers/configuracoes.controller';

const router = Router();

// ─── Auth ────────────────────────────────────────────────────
router.post('/auth/login',         auth.login);
router.post('/auth/refresh',       auth.refreshToken);
router.post('/auth/logout',        autenticar, auth.logout);
router.get ('/auth/perfil',        autenticar, auth.perfil);
router.put ('/auth/senha',         autenticar, auth.perfil);

// ─── Dashboard ───────────────────────────────────────────────
router.get('/dashboard',
  autenticar,
  autorizar('gestor', 'administrador'),
  chamados.dashboard
);

// ─── Chamados ────────────────────────────────────────────────
router.get   ('/chamados',                   autenticar, chamados.listar);
router.post  ('/chamados',                   autenticar, chamados.criar);
router.get   ('/chamados/:id',               autenticar, chamados.buscarPorId);
router.patch ('/chamados/:id/status',        autenticar, autorizar('atendente','gestor','administrador'), chamados.atualizarStatus);
router.patch ('/chamados/:id/atribuir',      autenticar, autorizar('gestor','administrador'), chamados.atribuir);
router.patch ('/chamados/:id/avaliar',       autenticar, autorizar('solicitante'), chamados.avaliar);

// ─── Mensagens ───────────────────────────────────────────────
router.get  ('/chamados/:id/mensagens',  autenticar, mensagens.listarMensagens);
router.post ('/chamados/:id/mensagens',  autenticar, mensagens.enviarMensagem);

// ─── Usuários ─────────────────────────────────────────────────
router.get  ('/usuarios',         autenticar, autorizar('gestor','administrador'), usuarios.listar);
router.post ('/usuarios',         autenticar, autorizar('administrador'), usuarios.criar);
router.put  ('/usuarios/senha',   autenticar, usuarios.alterarSenha);
router.patch('/usuarios/:id/ativo', autenticar, autorizar('administrador'), usuarios.toggleAtivo);

// ─── Configurações ───────────────────────────────────────────
router.get  ('/configuracoes',          autenticar, configuracoes.listar);
router.patch('/configuracoes/:chave',   autenticar, autorizar('administrador'), configuracoes.atualizar);

export default router;
