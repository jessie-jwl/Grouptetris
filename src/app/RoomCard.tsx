"use client"; 
import { useState, useContext, useEffect } from "react";
import GameContext from './context.ts'

export default function RoomCard() {
    const gameState = useContext(GameContext);
    if(gameState.getter.room === null) return null;
    const remaining = gameState.getter.room.maxPlayers - gameState.getter.room.playerNames.length;
    return (
        <div>
            <h2>Tetris Group Game</h2>
            <p>Room ID: <span>{gameState.getter.room.name}</span></p>
            <p>There {remaining > 1 ? 'are' : 'is'} <span>{remaining}</span> player{remaining > 1 ? 's' : ''} that can join</p>
            <p>Player List</p>
            <ul>
                {
                    gameState.getter.room.playerNames.map((player, index) => {
                        return <li key={index}>{player}</li>
                    })
                }
            </ul>
        </div>
    );
}