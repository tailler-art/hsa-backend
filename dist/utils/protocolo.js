"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarProtocolo = gerarProtocolo;
const database_1 = require("../config/database");
async function gerarProtocolo() {
    const ano = new Date().getFullYear();
    const resultado = await (0, database_1.queryOne)("SELECT COUNT(*) AS total FROM chamados WHERE protocolo LIKE $1", [`HSA-${ano}-%`]);
    const sequencial = (Number(resultado?.total ?? 0) + 1).toString().padStart(4, '0');
    return `HSA-${ano}-${sequencial}`;
}
//# sourceMappingURL=protocolo.js.map