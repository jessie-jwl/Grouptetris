import { Server, Socket } from "socket.io";
import { Message, Room } from './room';
import GameEngine, { ClientGameEngine, Rating, Sequence } from './game';

type RoomMap = Map<string, Room>;
type GameMap = Map<string, GameEngine>;
type PlayerNameRoomIdMap = Map<string, string>;
type SocketIdPlayerNameMap = Map<string, string>;
interface Registration {
    roomName: string;
    playerName: string;
}

class RoomManager {
    roomMap: RoomMap;
    gameMap: GameMap;
    playerNameRoomNameMap: PlayerNameRoomIdMap;
    socketIdPlayerNameMap: SocketIdPlayerNameMap;
    constructor() {
        this.roomMap = new Map();
        this.gameMap = new Map();
        this.playerNameRoomNameMap = new Map();
        this.socketIdPlayerNameMap = new Map();
    }

    createRoom(socket: Socket, roomName: string): boolean {
        if (this.roomMap.has(roomName)) {
            socket.emit('error', `Room ${roomName} already exists`);
            return false;
        }
        if (roomName.length === 0) {
            socket.emit('error', 'Room cannot be empty');
        }
        const room = new Room(roomName);
        this.roomMap.set(roomName, room);
        return true;
    }
    joinRoom(io: Server, socket: Socket, playerName: string, socketId: string, roomName: string): void {
        const room = this.roomMap.get(roomName);
        if (!room) {
            socket.emit('error', `Room ${roomName} doesn't exist`);
            return;
        }
        if(!room.addPlayer(socket, {
            name: playerName,
            socketId: socketId,
            online: true
        }))
            return;
        socket.join(roomName);
        this.playerNameRoomNameMap.set(playerName, roomName);
        this.socketIdPlayerNameMap.set(socketId, playerName);
        this.updateRoom(io, roomName);
    }
    disconnect(io: Server, socket: Socket): void {
        const socketId = socket.id;
        const playerName = this.socketIdPlayerNameMap.get(socketId);
        if (!playerName)
            return;
        const roomName = this.playerNameRoomNameMap.get(playerName);
        if (!roomName)
            return;
        const room = this.roomMap.get(roomName);
        if (!room)
            return;
        socket.leave(roomName);
        this.playerNameRoomNameMap.delete(playerName);
        this.socketIdPlayerNameMap.delete(socketId);
        room.setOnline(playerName, false);
        this.updateRoom(io, roomName);
    }
    updateRoom(io: Server, roomName: string): void {
        const room = this.roomMap.get(roomName);
        if (!room) {
            return;
        }
        let roomInfo = JSON.parse(JSON.stringify(room))
        delete roomInfo.playerNamePlayerMap;
        roomInfo.playerNames = room.getPlayerList().map(playerName => {
            if (room.playerNamePlayerMap.get(playerName)?.online)
                return playerName;
            else
                return playerName + " (Offline)";
        })
        if (!this.gameMap.has(roomName))
            this.gameMap.set(roomName, new GameEngine(io, room, this));
        io.to(roomName).emit('updateRoom', roomInfo);
        this.updateEngine(io, roomName);
    }
    updateEngine(io: Server, roomName: string): void {
        const engine = this.gameMap.get(roomName);
        if (!engine) {
            return;
        }
        const enginInfo: ClientGameEngine = {
            round: engine.round,
            maxRound: engine.maxRound,
            currentPlayerSequence: engine.currentPlayerSequence,
            sequence: engine.sequence,
            progress: engine.progress,
            grid: engine.grid,
            width: engine.width,
            height: engine.height,
            blockSize: engine.blockSize,
            score: engine.score,
            countDown: engine.countDown,
            rating: engine.rating
        };
        io.to(roomName).emit('updateEngine', enginInfo);
    }
    getCurrentRoomName(socket: Socket): string | undefined {
        const socketId = socket.id;
        const playerName = this.socketIdPlayerNameMap.get(socketId);
        if (!playerName)
            return undefined;
        const roomName = this.playerNameRoomNameMap.get(playerName);
        return roomName;
    }
    getCurrentEngine(socket: Socket): GameEngine | undefined {
        const roomName = this.getCurrentRoomName(socket);
        if (!roomName)
            return undefined;
        const engine = this.gameMap.get(roomName);
        return engine;
    }
    startGame(socket: Socket): void {
        let engine = this.getCurrentEngine(socket);
        if (!engine)
            return;
        engine.start();
    }
    nextToken(socket: Socket): void {
        let engine = this.getCurrentEngine(socket);
        if (!engine)
            return;
        engine.nextToken();
    }
    move(socket: Socket, direction: string): void {
        let engine = this.getCurrentEngine(socket);
        if (!engine)
            return;
        engine.move(direction);
    }
    appendMessage(io: Server, socket: Socket, message: Message): void {
        const roomName = this.getCurrentRoomName(socket);
        if (!roomName)
            return;
        const room = this.roomMap.get(roomName);
        if (!room)
            return;
        room.appendMessage(message);
        
        this.updateRoom(io, roomName);
    }
    updateRating(io: Server, socket: Socket, rating: Rating[]): void {
        const engin = this.getCurrentEngine(socket);
        if(engin == null)
            return;
        const sockerId = socket.id;
        const playerName = this.socketIdPlayerNameMap.get(sockerId);
        const room = this.roomMap.get(engin.room.name);
        if(room == null || playerName == null)
            return;
        const playerIndex = room.getPlayerList().indexOf(playerName);
        engin.updateRating(playerIndex, rating);
        this.updateEngine(io, engin.room.name)
    }
    updateSequence(io: Server, socket: Socket, sequence: Sequence[]): void {
        const engin = this.getCurrentEngine(socket);
        if(engin == null)
            return;
        engin.updateSequence(sequence);
        this.updateEngine(io, engin.room.name)
    }
    updateAgreement(io: Server, socket: Socket): void {
        const engin = this.getCurrentEngine(socket);
        if(engin == null)
            return;
        engin.updateAgreement();
        this.updateEngine(io, engin.room.name)
    }
}

export { RoomManager as default };
export type { Registration };
