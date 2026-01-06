"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const core_1 = require("@alephscript/core");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const corsOptions = {
    origin: (origin, callback) => {
        callback(null, true);
    },
    credentials: true
};
app.use((0, cors_1.default)(corsOptions));
const server = (0, node_http_1.createServer)(app);
// Usar la librería AlephScript
const as = new core_1.AlephScriptServer(server);
const PORT = 3010;
server.listen(PORT, () => {
    console.log(`🚀 Socket Gym Demo - Server escuchando en el puerto ${PORT}`);
    console.log("📦 Usando @alephscript/core library");
    // Crear clientes usando la librería
    const asCli = new core_1.AlephScriptClient("SERVER_cRUNTIME", `http://localhost:${PORT}`, "/runtime");
    // THIS IS UI APP ADMIN DASHBOARD, DON'T CONNECT const asCliA = new AlephScriptClient("SERVER_cADMIN", `http://localhost:${PORT}`, "/admin");
    const noPath = new core_1.AlephScriptClient("SERVER_cNOPATH", `http://localhost:${PORT}`, "/");
    // Configurar triggers usando la librería
    asCli.initTriggersDefinition.push(() => {
        asCli.io.on("SET_LIST_OF_THREADS", (...args) => {
            console.log("📥 Receiving list of threads from @alephscript/core...");
        });
        asCli.room("GET_LIST_OF_THREADS");
        asCli.io.on("SET_SERVER_STATE", (...args) => {
            console.log("📊 Receiving server state from @alephscript/core...");
        });
        asCli.room("GET_SERVER_STATE");
    });
    console.log("✅ Demo aplicación configurada correctamente usando @alephscript/core");
    // as.startPing();
    // asCli.io.disconnect();
});
//# sourceMappingURL=index.js.map