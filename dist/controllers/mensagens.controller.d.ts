import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
export declare function enviarMensagem(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function listarMensagens(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=mensagens.controller.d.ts.map