import express, { Application } from 'express'
import { createServer } from 'node:http';
import { AlephScriptServer, AlephScriptClient, SocketServer } from '@alephscript/mcp-core-sdk';
import cors from 'cors';
import { SocketIoMesh } from './SocketIoMesh';

const app: Application = express();
const corsOptions = {
    origin: (origin: any, callback: any) => {
        callback(null, true);
    },
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json()); // For POST body parsing

const server = createServer(app);

// Usar la librería AlephScript
const as = new AlephScriptServer(server);

// Create mesh orchestration layer
const mesh = new SocketIoMesh(as as unknown as SocketServer, app);

const PORT = 3010;
server.listen(PORT, ()=> {

	console.log(`🚀 Socket Gym Demo - Server escuchando en el puerto ${PORT}`);
	console.log("📦 Usando @alephscript/mcp-core-sdk library");
	console.log(`🕸️  Mesh API disponible en http://localhost:${PORT}/mesh`);

	// Crear clientes usando la librería
	const asCli = new AlephScriptClient("SERVER_cRUNTIME", `http://localhost:${PORT}`, "/runtime");
	// THIS IS UI APP ADMIN DASHBOARD, DON'T CONNECT const asCliA = new AlephScriptClient("SERVER_cADMIN", `http://localhost:${PORT}`, "/admin");
	const noPath = new AlephScriptClient("SERVER_cNOPATH", `http://localhost:${PORT}`, "/");

	// Configurar triggers usando la librería
	asCli.initTriggersDefinition.push(() => {

		asCli.io.on("SET_LIST_OF_THREADS", (...args: any[]) => {
			console.log("📥 Receiving list of threads...")
		})
		asCli.room("GET_LIST_OF_THREADS");

		asCli.io.on("SET_SERVER_STATE", (...args: any[]) => {
			console.log("📊 Receiving server state...")
		})
		asCli.room("GET_SERVER_STATE");
	})

	console.log("✅ Demo configurada correctamente");
	// as.startPing();
	// asCli.io.disconnect();
})
