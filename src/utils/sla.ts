import type { Prioridade } from '../types';

const SLA_MINUTOS: Record<Prioridade, number> = {
  critica: Number(process.env.SLA_CRITICA) || 120,
  alta:    Number(process.env.SLA_ALTA)    || 480,
  media:   Number(process.env.SLA_MEDIA)   || 1440,
  baixa:   Number(process.env.SLA_BAIXA)   || 4320,
};

export function calcularPrazoSLA(prioridade: Prioridade): Date {
  const minutos = SLA_MINUTOS[prioridade];
  const prazo = new Date();
  prazo.setMinutes(prazo.getMinutes() + minutos);
  return prazo;
}

export function percentualSLA(prazo: Date, criado_em: Date): number {
  const total = prazo.getTime() - criado_em.getTime();
  const decorrido = Date.now() - criado_em.getTime();
  return Math.min(100, Math.round((decorrido / total) * 100));
}

export function slaVencido(prazo: Date): boolean {
  return Date.now() > prazo.getTime();
}

export function slaEmAlerta(prazo: Date, criado_em: Date): boolean {
  const pct = percentualSLA(prazo, criado_em);
  return pct >= 70 && pct < 100;
}

export function minutosRestantes(prazo: Date): number {
  return Math.max(0, Math.round((prazo.getTime() - Date.now()) / 60000));
}
