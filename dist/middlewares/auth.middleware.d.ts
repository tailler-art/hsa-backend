import { Request, Response, NextFunction } from 'express';
import type { JwtPayload, Perfil } from '../types';
export interface AuthRequest extends Request {
    usuario?: JwtPayload;
}
export declare function autenticar(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function autorizar(...perfis: Perfil[]): (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map