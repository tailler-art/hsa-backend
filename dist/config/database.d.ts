import { Pool } from 'pg';
export declare const pool: Pool;
export declare function testarConexao(): Promise<void>;
export declare function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
export declare function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
//# sourceMappingURL=database.d.ts.map