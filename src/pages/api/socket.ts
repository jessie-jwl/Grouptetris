import { Server, Socket } from "socket.io";
import { ClientRequest } from "http"
import ServerResponseIO from '@/types/server/socket'
import RoomManager, { Registration } from '@/types/server/manager'
import { Message } from "@/types/server/room";
import { Rating, Sequence } from "@/types/server/game";

let manager = new RoomManager()

export default function handler(req: ClientRequest, res: ServerResponseIO) {
  if (res.socket == null) {
    res.writeHead(500);
    return res.end('Error');
  }
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server, {
    path: process.env.NEXT_PUBLIC_BASE_PATH + "/api/socket_io"
  });
  res.socket.server.io = io;

  const onConnection = (socket: Socket) => {
    socket.on('create_room', (registration: Registration) => {
      if(manager.createRoom(socket, registration.roomName))
        manager.joinRoom(io, socket, registration.playerName, socket.id, registration.roomName)
    });
    socket.on('join_room', (registration: Registration) => {
      manager.joinRoom(io, socket, registration.playerName, socket.id, registration.roomName)
    });
    socket.on("startGame", () => {
      manager.startGame(socket)
    });
    socket.on("move", (direction: string) => {
      manager.move(socket, direction)
    });
    socket.on("nextToken", () => {
      manager.nextToken(socket)
    });
    socket.on("message", (message: Message) => {
      manager.appendMessage(io, socket, message)
    });
    socket.on("rating", (rating: Rating[]) => {
      manager.updateRating(io, socket, rating)
    });
    socket.on("sequence", (sequence: Sequence[]) => {
      manager.updateSequence(io, socket, sequence);
    })
    socket.on("agree", () => {
      manager.updateAgreement(io, socket);
    })
    
    socket.on("disconnect", () => {
      manager.disconnect(io, socket)
    });
    
  };

  io.on("connection", onConnection);
  res.end();
}
