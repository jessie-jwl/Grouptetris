"use client";
import { Socket } from "socket.io-client";
import Room from "@/types/server/room";
import GameEngine, { ClientGameEngine } from "@/types/server/game";

const GameStage = {
    Intro: 'Intro',
    Playing: 'Playing',
    Loading: 'Loading',
    Waiting: 'Waiting',
}

interface ClientRoom extends Room {
    playerNames: string[];
}

interface GameState {
    stage: string;
    roomName: string;
    playerName: string;
    room: ClientRoom | null;
    socket: Socket | null;
    engine: ClientGameEngine | null;
}

interface GameStateContext {
    getter: GameState,
    setter: 
    (
        update: GameState | ((prevState: GameState) => GameState)
    ) => void
}

function initState(): GameState {
    return {
        stage: GameStage.Loading,
        // roomName: Math.floor(Math.random() * 100000000).toString(),
        // playerName: "Player" + Math.floor(Math.random() * 100000000),
        roomName: '',
        playerName: '',
        room: null,
        engine: null,
        socket: null
    }
}

export { GameStage, initState };
export type { GameState, GameStateContext, ClientRoom };