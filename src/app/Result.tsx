"use client";
import { Container, Row, Button } from 'react-bootstrap';
import Card from 'react-bootstrap/Card';
import { useContext } from "react";
import GameContext from './context.ts'
import { GameStage, initState } from "./state";

export default function Result() {
    const gameState = useContext(GameContext);
    return (
        <Container>
            <div className='text-center'>
                <h1>Result</h1>
                <Button variant="primary" onClick={() => {
                    gameState.setter((prevState) => ({
                        ... initState(),
                        playerName: prevState.playerName,
                        socket: prevState.socket,
                        stage: GameStage.Intro,
                    }))
                }}>Home</Button>
            </div>
            <Row>
                <Card>
                    <Card.Header>
                        Difficulty
                    </Card.Header>
                    <Card.Body>
                        {
                            gameState.getter.engine?.sequence[0].map((sequence, j) => (
                                <div key={j}>
                                    {gameState.getter.room?.playerNames[sequence.playerIndex]}
                                    : {sequence.difficulty}
                                </div>
                            ))
                        }
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>
                        Score
                    </Card.Header>
                    <Card.Body>
                        {
                            Array(gameState.getter.engine?.maxRound).fill(0).map((_, i) => (
                                <div key={i}>
                                    <h2>Round {i + 1}</h2>
                                    {
                                        gameState.getter.engine?.sequence[i].map((sequence, j) => (
                                            <div key={j}>
                                                {gameState.getter.room?.playerNames[sequence.playerIndex]} ({sequence.time})
                                                : {gameState.getter.engine?.score[i][j]}
                                            </div>
                                        ))
                                    }
                                    <p>
                                        total score : {gameState.getter.engine?.score[i].reduce((a, b) => a + b, 0)}
                                    </p>
                                </div>
                            ))
                        }
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>
                        Rating
                    </Card.Header>
                    <Card.Body>
                        {
                            gameState.getter.engine?.rating.map((rating, i) =>
                                <div key={i}>
                                    <h2>{gameState.getter.room?.playerNames[i]}</h2>
                                    <ul>
                                        {
                                            rating.map((rate, j) => (
                                                <li key={j}>
                                                    {gameState.getter.room?.playerNames[rate.playerIndex]} : {rate.score}, {rate.reason}
                                                </li>
                                            ))
                                        }
                                    </ul>
                                </div>
                            )
                        }
                    </Card.Body>
                </Card>
                <Card>
                    <Card.Header>
                        Chats
                    </Card.Header>
                    <Card.Body>
                        {
                            gameState.getter.room?.messages.map((message, index) => (
                                <div key={index}>
                                    <strong>{message.sender}: </strong>
                                    {message.message}
                                </div>
                            ))
                        }
                    </Card.Body>
                </Card>
            </Row>
        </Container>
    )
}