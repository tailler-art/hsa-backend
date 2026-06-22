import type { Prioridade } from '../types';
export declare function calcularPrazoSLA(prioridade: Prioridade): Date;
export declare function percentualSLA(prazo: Date, criado_em: Date): number;
export declare function slaVencido(prazo: Date): boolean;
export declare function slaEmAlerta(prazo: Date, criado_em: Date): boolean;
export declare function minutosRestantes(prazo: Date): number;
//# sourceMappingURL=sla.d.ts.map