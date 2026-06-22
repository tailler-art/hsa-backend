import type { Chamado, Usuario } from '../types';
export declare function emailChamadoAberto(chamado: Chamado, solicitante: Usuario): Promise<void>;
export declare function emailStatusAlterado(chamado: Chamado, solicitante: Usuario, statusAnterior: string): Promise<void>;
export declare function emailAlertaSLA(chamado: Chamado, atendente: Usuario): Promise<void>;
//# sourceMappingURL=email.service.d.ts.map