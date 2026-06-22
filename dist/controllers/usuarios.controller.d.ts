import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare function listar(_req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function criar(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function alterarSenha(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function toggleAtivo(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=usuarios.controller.d.ts.map