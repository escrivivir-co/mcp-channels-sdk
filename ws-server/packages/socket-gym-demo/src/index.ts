import express, { Application } from 'express'
import { createServer } from 'node:http';
import { AlephScriptServer, AlephScriptClient } from '@alephscript/mcp-core-sdk';
import cors from 'cors';

const app: Application = express();
const corsOptions = {
    origin: (origin: any, callback: any) => {
        callback(null, true);
    },
    credentials: true
};
app.use(cors(corsOptions));

const server = createServer(app);

// Usar la librería AlephScript
const as = new AlephScriptServer(server);

const PORT = 3010;
server.listen(PORT, ()=> {

	console.log(`🚀 Socket Gym Demo - Server escuchando en el puerto ${PORT}`);
	console.log("📦 Usando @alephscript/mcp-core-sdk library");

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
