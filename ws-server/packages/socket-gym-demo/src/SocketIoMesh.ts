/**
 * SocketIoMesh - Mesh Orchestration Layer
 * 
 * Coordina múltiples rooms y servidores MCP, proveyendo:
 * - Discovery automático de rooms/capabilities
 * - API REST para consultar el estado del mesh
 * - Invocación de capabilities entre rooms
 * 
 * @épica MCP-CHANNELS-1.0.0 Story S7
 */

import { Application, Request, Response } from 'express';
import { SocketServer } from '@alephscript/mcp-core-sdk';

export interface MeshRoom {
    id: string;
    masterId: string | null;
    masterName: string | null;
    capabilities: string[];
    socketCount: number;
    createdAt: Date;
    lastActivity: Date;
}

export interface MeshState {
    meshId: string;
    startedAt: Date;
    rooms: MeshRoom[];
    totalSockets: number;
    totalRooms: number;
}

export interface InvokeRequest {
    room: string;
    capability: string;
    payload?: any;
}

export interface InvokeResponse {
    success: boolean;
    room: string;
    capability: string;
    result?: any;
    error?: string;
}

/**
 * SocketIoMesh extends the basic mesh with orchestration capabilities
 */
export class SocketIoMesh {
    private roomCapabilities = new Map<string, string[]>();
    private roomMasterNames = new Map<string, string>();
    private roomCreatedAt = new Map<string, Date>();
    private roomLastActivity = new Map<string, Date>();
    private startedAt: Date;
    private meshId: string;

    constructor(
        private socketServer: SocketServer,
        private app: Application
    ) {
        this.startedAt = new Date();
        this.meshId = `mesh-${Date.now().toString(36)}`;
        
        this.setupMeshAPI();
        this.setupSocketListeners();
        
        console.log(`🕸️  SocketIoMesh initialized: ${this.meshId}`);
    }

    /**
     * Setup REST API endpoints for mesh discovery and invocation
     */
    private setupMeshAPI(): void {
        // GET /mesh - Mesh state summary
        this.app.get('/mesh', (_req: Request, res: Response) => {
            res.json(this.getMeshState());
        });

        // GET /mesh/rooms - List all active rooms
        this.app.get('/mesh/rooms', (_req: Request, res: Response) => {
            res.json({
                rooms: this.getRooms(),
                count: this.socketServer.rooms.size
            });
        });

        // GET /mesh/rooms/:id - Get specific room details
        this.app.get('/mesh/rooms/:id', (req: Request, res: Response) => {
            const roomId = req.params.id;
            const room = this.getRoom(roomId);
            
            if (room) {
                res.json(room);
            } else {
                res.status(404).json({ error: `Room ${roomId} not found` });
            }
        });

        // GET /mesh/capabilities - List all capabilities across mesh
        this.app.get('/mesh/capabilities', (_req: Request, res: Response) => {
            const capabilities: { room: string; capability: string }[] = [];
            
            for (const [room, caps] of this.roomCapabilities) {
                for (const cap of caps) {
                    capabilities.push({ room, capability: cap });
                }
            }
            
            res.json({
                capabilities,
                count: capabilities.length
            });
        });

        // POST /mesh/invoke/:room - Invoke a capability on a room
        this.app.post('/mesh/invoke/:room', async (req: Request, res: Response) => {
            const roomId = req.params.room;
            const { capability, payload } = req.body as { capability: string; payload?: any };
            
            const result = await this.invokeCapability(roomId, capability, payload);
            
            if (result.success) {
                res.json(result);
            } else {
                res.status(400).json(result);
            }
        });

        // GET /mesh/health - Health check
        this.app.get('/mesh/health', (_req: Request, res: Response) => {
            res.json({
                status: 'healthy',
                meshId: this.meshId,
                uptime: Date.now() - this.startedAt.getTime(),
                rooms: this.socketServer.rooms.size,
                sockets: this.socketServer.sockets.size
            });
        });

        console.log('📡 Mesh API endpoints registered: /mesh, /mesh/rooms, /mesh/capabilities, /mesh/invoke');
    }

    /**
     * Setup Socket.IO event listeners for room management
     */
    private setupSocketListeners(): void {
        // Listen to runtime namespace for MAKE_MASTER events
        const runtime = this.socketServer.namespaces.get('runtime');
        
        if (runtime) {
            runtime.on('connection', (socket) => {
                // Listen for MAKE_MASTER to capture capabilities
                socket.on('ROOM_MESSAGE', (data: any) => {
                    if (data.event === 'MAKE_MASTER' && data.room) {
                        this.registerRoomMaster(
                            data.room, 
                            socket.id,
                            data.args?.features || []
                        );
                        
                        // Get master name from registered sockets
                        const userDetails = this.socketServer.sockets.get(socket.id);
                        if (userDetails) {
                            this.roomMasterNames.set(data.room, userDetails.name || socket.id);
                        }
                    }
                    
                    // Update activity timestamp
                    if (data.room) {
                        this.roomLastActivity.set(data.room, new Date());
                    }
                });
            });
        }
    }

    /**
     * Register a room master with its capabilities
     */
    private registerRoomMaster(roomId: string, masterId: string, capabilities: string[]): void {
        this.roomCapabilities.set(roomId, capabilities);
        this.roomLastActivity.set(roomId, new Date());
        
        if (!this.roomCreatedAt.has(roomId)) {
            this.roomCreatedAt.set(roomId, new Date());
        }
        
        console.log(`🎯 Room master registered: ${roomId} with ${capabilities.length} capabilities`);
    }

    /**
     * Get the full mesh state
     */
    getMeshState(): MeshState {
        return {
            meshId: this.meshId,
            startedAt: this.startedAt,
            rooms: this.getRooms(),
            totalSockets: this.socketServer.sockets.size,
            totalRooms: this.socketServer.rooms.size
        };
    }

    /**
     * Get all rooms with their details
     */
    getRooms(): MeshRoom[] {
        const rooms: MeshRoom[] = [];
        
        for (const [roomId, masterId] of this.socketServer.rooms) {
            const masterDetails = this.socketServer.sockets.get(masterId);
            
            rooms.push({
                id: roomId,
                masterId,
                masterName: this.roomMasterNames.get(roomId) || masterDetails?.name || null,
                capabilities: this.roomCapabilities.get(roomId) || [],
                socketCount: this.socketServer.roomsSockets.get(roomId)?.length || 0,
                createdAt: this.roomCreatedAt.get(roomId) || new Date(),
                lastActivity: this.roomLastActivity.get(roomId) || new Date()
            });
        }
        
        return rooms;
    }

    /**
     * Get a specific room by ID
     */
    getRoom(roomId: string): MeshRoom | null {
        const masterId = this.socketServer.rooms.get(roomId);
        
        if (!masterId) {
            return null;
        }
        
        const masterDetails = this.socketServer.sockets.get(masterId);
        
        return {
            id: roomId,
            masterId,
            masterName: this.roomMasterNames.get(roomId) || masterDetails?.name || null,
            capabilities: this.roomCapabilities.get(roomId) || [],
            socketCount: this.socketServer.roomsSockets.get(roomId)?.length || 0,
            createdAt: this.roomCreatedAt.get(roomId) || new Date(),
            lastActivity: this.roomLastActivity.get(roomId) || new Date()
        };
    }

    /**
     * Invoke a capability on a room's master
     */
    async invokeCapability(
        roomId: string, 
        capability: string, 
        payload?: any
    ): Promise<InvokeResponse> {
        const room = this.getRoom(roomId);
        
        if (!room) {
            return {
                success: false,
                room: roomId,
                capability,
                error: `Room ${roomId} not found`
            };
        }
        
        if (!room.capabilities.includes(capability)) {
            return {
                success: false,
                room: roomId,
                capability,
                error: `Capability ${capability} not available in room ${roomId}. Available: ${room.capabilities.join(', ')}`
            };
        }
        
        // Emit GET_{capability} to the room - master should respond with SET_{capability}
        const runtime = this.socketServer.namespaces.get('runtime');
        
        if (!runtime) {
            return {
                success: false,
                room: roomId,
                capability,
                error: 'Runtime namespace not available'
            };
        }
        
        // Emit the GET request to the room
        runtime.to(roomId).emit(`GET_${capability}`, payload);
        
        return {
            success: true,
            room: roomId,
            capability,
            result: { 
                message: `GET_${capability} emitted to room ${roomId}`,
                payload 
            }
        };
    }
}
