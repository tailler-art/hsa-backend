import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare function listar(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function buscarPorId(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function criar(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function atualizarStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function atribuir(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function avaliar(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function dashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=chamados.controller.d.ts.map