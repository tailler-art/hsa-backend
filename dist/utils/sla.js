"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularPrazoSLA = calcularPrazoSLA;
exports.percentualSLA = percentualSLA;
exports.slaVencido = slaVencido;
exports.slaEmAlerta = slaEmAlerta;
exports.minutosRestantes = minutosRestantes;
const SLA_MINUTOS = {
    critica: Number(process.env.SLA_CRITICA) || 120,
    alta: Number(process.env.SLA_ALTA) || 480,
    media: Number(process.env.SLA_MEDIA) || 1440,
    baixa: Number(process.env.SLA_BAIXA) || 4320,
};
function calcularPrazoSLA(prioridade) {
    const minutos = SLA_MINUTOS[prioridade];
    const prazo = new Date();
    prazo.setMinutes(prazo.getMinutes() + minutos);
    return prazo;
}
function percentualSLA(prazo, criado_em) {
    const total = prazo.getTime() - criado_em.getTime();
    const decorrido = Date.now() - criado_em.getTime();
    return Math.min(100, Math.round((decorrido / total) * 100));
}
function slaVencido(prazo) {
    return Date.now() > prazo.getTime();
}
function slaEmAlerta(prazo, criado_em) {
    const pct = percentualSLA(prazo, criado_em);
    return pct >= 70 && pct < 100;
}
function minutosRestantes(prazo) {
    return Math.max(0, Math.round((prazo.getTime() - Date.now()) / 60000));
}
//# sourceMappingURL=sla.js.map