"use client";
import './globals.css'
import { useState, useEffect } from "react";
import { Inter } from 'next/font/google'
import create_socket from "./socket.ts";
import GameContext from './context.ts'
import { GameStage, initState } from './state.ts'
import 'bootstrap/dist/css/bootstrap.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [gameState, setGameState] = useState(initState());

  const gameStateContext = {
    getter: gameState, setter: setGameState
  }


  useEffect(() => {
    const socketInitializer = async () => {
      const socket = await create_socket(setGameState);
      setGameState(prevState => ({
        ...prevState,
        stage: GameStage.Intro,
        socket: socket
      }));
    };
    socketInitializer();
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>Game</title>
      </head>
      <body className={inter.className}>
        {
          <GameContext.Provider value={gameStateContext}>
            {children}
          </GameContext.Provider>
        }
      </body>
    </html>
  )
}
