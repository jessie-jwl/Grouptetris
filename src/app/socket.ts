"use client";
import { io, Socket } from "socket.io-client";
import { GameStage, GameStateContext, ClientRoom, GameState } from "./state";
import GameEngine from "@/types/server/game";

interface ServerToClientEvents {
  updateRoom: (room: ClientRoom) => void;
  updateEngine: (engine: GameEngine) => void;
  error: (error: string) => void;
}

interface ClientToServerEvents {
  message: (message: any) => void;
}

async function create_socket(setter: (value: GameState | ((prevState: GameState) => GameState)) => void) {
  await fetch(process.env.NEXT_PUBLIC_BASE_PATH + "/api/socket")

  let socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
    path: process.env.NEXT_PUBLIC_BASE_PATH + "/api/socket_io"
  });
  socket.on("connect", () => {
    const transportAtConnect = socket.io.engine.transport.name; // in most cases, "polling"
    console.log(`Connected ${socket.id} with ${transportAtConnect}`);
  });

  socket.on('updateRoom', (room: ClientRoom) => {
    if (room.isPlaying) {
      setter(prevState => ({
        ...prevState,
        room: room,
        stage: GameStage.Playing
      }))
    } else {
      setter(prevState => ({
        ...prevState,
        room: room,
      }))
    }
  })

  socket.on('updateEngine', (engine: GameEngine) => {
    setter(prevState => ({
      ...prevState,
      engine: engine,
      stage: (prevState.stage === GameStage.Waiting) ? (
        prevState.engine?.progress === engine.progress ? prevState.stage : GameStage.Playing
      ) : prevState.stage
    }))
  });

  socket.on('error', (message) => {
    alert(message)
  })

  return socket;
}

export { create_socket as default };
export type { ServerToClientEvents, ClientToServerEvents };
