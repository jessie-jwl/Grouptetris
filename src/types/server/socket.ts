import { Server } from "socket.io";
import { ServerResponse } from "http"
import { Socket as NetSocket } from 'net'
import { Server as HttpServer } from 'http'

interface HttpServerIO extends HttpServer {
    io: Server
}

interface NetSocketIO extends NetSocket {
    server: HttpServerIO
}

interface ServerResponseIO extends ServerResponse {
    socket: NetSocketIO;
}

export default ServerResponseIO;