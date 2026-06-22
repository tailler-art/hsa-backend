export type Perfil = 'solicitante' | 'atendente' | 'gestor' | 'administrador';
export type Departamento = 'Técnico' | 'Comercial' | 'Administrativo' | 'Sistema';
export type Categoria = 'Reclamação' | 'Solicitação' | 'Dúvidas' | 'Elogios' | 'Melhorias';
export type Prioridade = 'critica' | 'alta' | 'media' | 'baixa';
export type StatusChamado = 'aberto' | 'em_atendimento' | 'aguardando_resposta' | 'resolvido' | 'fechado';
export interface Usuario {
    id: string;
    nome: string;
    email: string;
    senha_hash?: string;
    perfil: Perfil;
    departamento: Departamento;
    ativo: boolean;
    criado_em: Date;
    atualizado_em: Date;
}
export interface Chamado {
    id: string;
    protocolo: string;
    titulo: string;
    descricao: string;
    status: StatusChamado;
    prioridade: Prioridade;
    categoria: Categoria;
    departamento: Departamento;
    solicitante_id: string;
    atendente_id: string | null;
    prazo_sla: Date;
    resolvido_em: Date | null;
    fechado_em: Date | null;
    nota_avaliacao: number | null;
    criado_em: Date;
    atualizado_em: Date;
}
export interface Mensagem {
    id: string;
    chamado_id: string;
    autor_id: string;
    conteudo: string;
    interna: boolean;
    criado_em: Date;
}
export interface Anexo {
    id: string;
    chamado_id: string;
    nome_original: string;
    nome_arquivo: string;
    mime_type: string;
    tamanho_bytes: number;
    enviado_por: string;
    criado_em: Date;
}
export interface HistoricoChamado {
    id: string;
    chamado_id: string;
    campo_alterado: string;
    valor_anterior: string | null;
    valor_novo: string;
    alterado_por: string;
    criado_em: Date;
}
export interface JwtPayload {
    id: string;
    email: string;
    perfil: Perfil;
    departamento: Departamento;
}
export interface PaginacaoQuery {
    pagina?: number;
    limite?: number;
    status?: StatusChamado;
    prioridade?: Prioridade;
    categoria?: Categoria;
    departamento?: Departamento;
    atendente_id?: string;
    busca?: string;
}
//# sourceMappingURL=index.d.ts.map