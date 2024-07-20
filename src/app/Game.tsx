"use client";
import { useEffect, useContext, useState, useRef } from "react";
import GameContext from './context.ts'
import GameCanvas from './GameCanvas.tsx'
import { GameProgress } from "@/types/server/game.ts";
import { Container, Row, Col } from 'react-bootstrap';

export default function Game() {
    const gameState = useContext(GameContext);
    const socket = gameState.getter.socket;
    const [gameTip, setGameTip] = useState("");

    useEffect(() => {
        if (gameState.getter.engine === null)
            return;
        if (gameState.getter.engine.progress === GameProgress.RoundOver) {
            let score = gameState.getter.engine.score[gameState.getter.engine.round][
                gameState.getter.engine.currentPlayerSequence
            ]
            setGameTip("Score: " + score)
        }
    }, [gameState.getter.engine]);

    useEffect(() => {
        function isPlayer(offset: number) {
            if (gameState.getter.engine === null || gameState.getter.room === null)
                return false;
    
            return gameState.getter.playerName === gameState.getter.room.playerNames[
                gameState.getter.engine.sequence[gameState.getter.engine.round][
                    (offset + gameState.getter.engine.currentPlayerSequence) % gameState.getter.room.playerNames.length
                ].playerIndex
            ];
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (!isPlayer(0))
                return;
            switch (event.key) {
                case "ArrowLeft":
                case "a":
                case "A":
                    socket?.emit("move", "left");
                    event.preventDefault();
                    break;
                case "ArrowRight":
                case "d":
                case "D":
                    event.preventDefault();
                    socket?.emit("move", "right");
                    break;
                case "ArrowDown":
                case "s":
                case "S":
                    socket?.emit("move", "down");
                    event.preventDefault();
                    break;
                case "ArrowUp":
                case "w":
                case "W":
                    socket?.emit("move", "up");
                    event.preventDefault();
                    break;
            }
        }
        window.addEventListener('keydown', handleKeyDown);

        // cleanup this component
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [gameState.getter.engine, gameState.getter.room, gameState.getter.playerName, socket]);

    if (gameState.getter.engine === null || gameState.getter.room === null)
        return null;
    function startGame() {
        setGameTip("Please use direction keyboard to play")
        socket?.emit("startGame");
    }

    function turnNextToken() {
        socket?.emit("nextToken");
    }

    function isPlayer(offset: number) {
        if (gameState.getter.engine === null || gameState.getter.room === null)
            return false;

        return gameState.getter.playerName === gameState.getter.room.playerNames[
            gameState.getter.engine.sequence[gameState.getter.engine.round][
                (offset + gameState.getter.engine.currentPlayerSequence) % gameState.getter.room.playerNames.length
            ].playerIndex
        ];
    }

    if (gameState.getter.engine === null || gameState.getter.room === null)
        return null;

    return (
        <Container>
            <Row className="align-items-center">
                <Col>
                    <div className="text-center">
                        <h1>Tetris Group Game</h1>
                        <span>Room: {gameState.getter.room.name}</span>
                    </div>
                    <p>This is round {gameState.getter.engine.round + 1}</p>
                    <p>Current Player: {
                        gameState.getter.room.playerNames[
                        gameState.getter.engine.sequence[gameState.getter.engine.round][
                            gameState.getter.engine.currentPlayerSequence
                        ].playerIndex
                        ]
                    }</p>
                    {
                        isPlayer(0) && (<span>You are the player now.</span>)
                    }
                    {
                        isPlayer(1) && (
                            (gameState.getter.engine.currentPlayerSequence < 2 && (<span>You will be the next player.</span>))
                            ||
                            <span>You have already played this round.</span>
                        )
                    }
                    {
                        isPlayer(2) && (
                            (gameState.getter.engine.currentPlayerSequence < 1 && (<span>You will be playing after the next player.</span>))
                            ||
                            <span>You have already played this round.</span>
                        )
                    }
                    <div className="my-4">
                        {
                            gameState.getter.room.playerNames.map((playerName, index) => {
                                return (
                                    <p key={playerName}>{playerName}, Sequence: {
                                        (gameState.getter.engine?.sequence[gameState.getter.engine.round].map(sequence => sequence.playerIndex === index).indexOf(true) || 0) + 1
                                    }, Score: {
                                            gameState.getter.engine?.score[gameState.getter.engine.round][
                                            gameState.getter.engine?.sequence[gameState.getter.engine.round].map(sequence => sequence.playerIndex === index).indexOf(true)
                                            ]
                                        }</p>
                                )
                            })
                        }
                    </div>
                </Col>
                <Col className="text-center">
                    <h4 style={{ color: 'red' }}>
                        {gameTip}
                    </h4>
                    <div>
                        <button onClick={startGame} disabled={!isPlayer(0) || gameState.getter.engine.progress != GameProgress.Waiting}>Start the Game</button>
                        <button onClick={turnNextToken} disabled={!isPlayer(0) || gameState.getter.engine.progress != GameProgress.RoundOver}>Send it to the Next Player</button>
                    </div>
                    <GameCanvas />
                </Col>
            </Row>
        </Container>
    )
}