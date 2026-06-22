import nodemailer from 'nodemailer';
import { logger } from '../config/logger';
import type { Chamado, Usuario } from '../types';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function baseTemplate(titulo: string, conteudo: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden">
      <div style="background:#0E2040;padding:20px 24px;border-bottom:3px solid #F5A623">
        <h1 style="margin:0;color:#fff;font-size:18px">HSA Assessoria Sanitária</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px">Sistema de Chamados Internos</p>
      </div>
      <div style="padding:24px;background:#fff">
        <h2 style="color:#0E2040;font-size:16px;margin-top:0">${titulo}</h2>
        ${conteudo}
      </div>
      <div style="background:#F8FAFC;padding:14px 24px;border-top:1px solid #E2E8F0">
        <p style="margin:0;font-size:11px;color:#94A3B8">
          HSA Assessoria Sanitária · Rua Ponta Porã, 229 · CEP 05056-001<br>
          CNPJ 16.746.270/0001-86 · <a href="mailto:chamados@hsa.com.br" style="color:#0E2040">chamados@hsa.com.br</a>
        </p>
      </div>
    </div>
  `;
}

async function enviar(para: string, assunto: string, html: string): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[EMAIL DEV] Para: ${para} | Assunto: ${assunto}`);
    return;
  }
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to: para, subject: assunto, html });
    logger.info(`Email enviado para ${para}: ${assunto}`);
  } catch (err) {
    logger.error(`Falha ao enviar email para ${para}:`, err);
  }
}

export async function emailChamadoAberto(chamado: Chamado, solicitante: Usuario): Promise<void> {
  const html = baseTemplate(
    'Chamado aberto com sucesso',
    `<p>Olá, <strong>${solicitante.nome}</strong>!</p>
     <p>Seu chamado foi registrado. Aqui estão os detalhes:</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px">
       <tr><td style="padding:8px;color:#64748b;width:40%">Protocolo</td><td style="padding:8px;font-weight:700;color:#0E2040">${chamado.protocolo}</td></tr>
       <tr style="background:#F8FAFC"><td style="padding:8px;color:#64748b">Título</td><td style="padding:8px">${chamado.titulo}</td></tr>
       <tr><td style="padding:8px;color:#64748b">Departamento</td><td style="padding:8px">${chamado.departamento}</td></tr>
       <tr style="background:#F8FAFC"><td style="padding:8px;color:#64748b">Categoria</td><td style="padding:8px">${chamado.categoria}</td></tr>
       <tr><td style="padding:8px;color:#64748b">Prioridade</td><td style="padding:8px;font-weight:700;color:#DC2626">${chamado.prioridade.toUpperCase()}</td></tr>
       <tr style="background:#F8FAFC"><td style="padding:8px;color:#64748b">Prazo SLA</td><td style="padding:8px">${new Date(chamado.prazo_sla).toLocaleString('pt-BR')}</td></tr>
     </table>
     <p style="margin-top:16px;color:#64748b;font-size:13px">Você receberá atualizações a cada mudança de status.</p>`
  );
  await enviar(solicitante.email, `[${chamado.protocolo}] Chamado aberto — ${chamado.titulo}`, html);
}

export async function emailStatusAlterado(
  chamado: Chamado,
  solicitante: Usuario,
  statusAnterior: string
): Promise<void> {
  const labels: Record<string, string> = {
    aberto: 'Aberto',
    em_atendimento: 'Em Atendimento',
    aguardando_resposta: 'Aguardando Resposta',
    resolvido: 'Resolvido',
    fechado: 'Fechado',
  };
  const html = baseTemplate(
    'Status do chamado atualizado',
    `<p>Olá, <strong>${solicitante.nome}</strong>!</p>
     <p>O status do seu chamado <strong>${chamado.protocolo}</strong> foi alterado:</p>
     <div style="display:flex;gap:16px;margin:16px 0;align-items:center;font-size:14px">
       <span style="background:#F1F5F9;padding:6px 14px;border-radius:20px;color:#475569">${labels[statusAnterior] ?? statusAnterior}</span>
       <span style="color:#94A3B8">→</span>
       <span style="background:#0E2040;color:#fff;padding:6px 14px;border-radius:20px;font-weight:700">${labels[chamado.status] ?? chamado.status}</span>
     </div>
     <p style="color:#64748b;font-size:13px">Protocolo: <strong>${chamado.protocolo}</strong> · ${chamado.titulo}</p>`
  );
  await enviar(
    solicitante.email,
    `[${chamado.protocolo}] Status alterado para "${labels[chamado.status]}"`,
    html
  );
}

export async function emailAlertaSLA(chamado: Chamado, atendente: Usuario): Promise<void> {
  const html = baseTemplate(
    '⚠️ Alerta de SLA — ação necessária',
    `<p>Olá, <strong>${atendente.nome}</strong>!</p>
     <p>O chamado abaixo está <strong style="color:#DC2626">próximo do vencimento do SLA</strong>:</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px">
       <tr><td style="padding:8px;color:#64748b;width:40%">Protocolo</td><td style="padding:8px;font-weight:700;color:#0E2040">${chamado.protocolo}</td></tr>
       <tr style="background:#F8FAFC"><td style="padding:8px;color:#64748b">Título</td><td style="padding:8px">${chamado.titulo}</td></tr>
       <tr><td style="padding:8px;color:#64748b">Prazo SLA</td><td style="padding:8px;font-weight:700;color:#DC2626">${new Date(chamado.prazo_sla).toLocaleString('pt-BR')}</td></tr>
     </table>
     <p style="margin-top:16px;color:#DC2626;font-weight:700">Resolva ou escalone imediatamente para evitar violação de SLA.</p>`
  );
  await enviar(
    atendente.email,
    `[URGENTE] SLA próximo do vencimento — ${chamado.protocolo}`,
    html
  );
}
