import { queryOne } from '../config/database';

export async function gerarProtocolo(): Promise<string> {
  const ano = new Date().getFullYear();
  const resultado = await queryOne<{ total: string }>(
    "SELECT COUNT(*) AS total FROM chamados WHERE protocolo LIKE $1",
    [`HSA-${ano}-%`]
  );
  const sequencial = (Number(resultado?.total ?? 0) + 1).toString().padStart(4, '0');
  return `HSA-${ano}-${sequencial}`;
}
