import { Socket } from "socket.io";

interface Player {
    socketId: string;
    name: string;
    online: boolean;
}

interface Message {
    sender: string;
    time: number;
    message: string;
}


export class Room {
    name: string;
    playerNamePlayerMap: Map<string, Player>;
    maxPlayers: number;
    isPlaying: boolean;
    messages: Message[];
    constructor(name: string, maxPlayers: number = 3) {
        this.name = name;
        this.maxPlayers = maxPlayers;
        this.playerNamePlayerMap = new Map();
        this.isPlaying = false;
        this.messages = [];
    }
    addPlayer(socket: Socket, player: Player): boolean {
        if(this.playerNamePlayerMap.size >= this.maxPlayers) {
            if(!this.playerNamePlayerMap.has(player.name)) {
                socket.emit("error", "Room is full");
                return false;
            }
        }
        if(player.name.length === 0) {
            socket.emit("error", "Player name is empty");
            return false;
        }
        this.playerNamePlayerMap.set(player.name, player);
        if(this.playerNamePlayerMap.size >= this.maxPlayers)
            this.isPlaying = true;
        return true;
    }
    
    removePlayer(playerName: string): void {
        this.playerNamePlayerMap.delete(playerName);
    }

    setOnline(playerName: string, online: boolean): void {
        let player = this.playerNamePlayerMap.get(playerName);
        if(player)
            player.online = online;
    }
    isFull(): boolean {
        return this.playerNamePlayerMap.size >= this.maxPlayers;
    }
    getPlayerList(): Array<string> {
        return Array.from(this.playerNamePlayerMap.keys());
    }
    appendMessage(message: Message): void {
        this.messages.push(message);
    }
}

export { Room as default };
export type { Message };
