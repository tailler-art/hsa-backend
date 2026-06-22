import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly message: string;
    readonly statusCode: number;
    constructor(message: string, statusCode?: number);
}
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map