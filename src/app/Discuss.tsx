"use client";
import { useContext, useState } from "react";
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import GameContext from './context.ts'
import styles from "./discuss.module.css"
import { GameStage } from "./state.ts";
import Fairness from './Fairness.tsx'
import { GAME_DURATION } from "@/types/server/game.ts";

export default function Discuss() {
    const gameState = useContext(GameContext);
    const [newMessage, setNewMessage] = useState('');
    const [showFairness, setShowFairness] = useState(false);
    const [firstSelect, setFirstSelect] = useState(-1);
    if (gameState.getter.room == null || gameState.getter.engine == null)
        return null;

    const messages = gameState.getter.room.messages;
    const socket = gameState.getter.socket;

    const handleSendMessage = () => {
        if (newMessage.trim() !== '') {
            socket?.emit("message", {
                sender: gameState.getter.playerName,
                time: new Date().getTime(),
                message: newMessage
            });
            setNewMessage('');
        }
    };
    function selection(index: number) {
        if (firstSelect === index) {
            setFirstSelect(-1);
        } else if (firstSelect === -1) {
            setFirstSelect(index);
        } else {
            let copy = JSON.parse(JSON.stringify(gameState.getter.engine?.sequence[1]))
            copy[index] = copy[firstSelect];
            copy[firstSelect] = gameState.getter.engine?.sequence[1][index];
            setFirstSelect(-1);
            socket?.emit("sequence", copy);
        }
    }
    function setTime(time: number, index: number) {
        let copy = JSON.parse(JSON.stringify(gameState.getter.engine?.sequence[1]))
        copy[index].time = time;
        socket?.emit("sequence", copy);
    }
    function submit() {
        socket?.emit("agree")
        gameState.setter((prevState) => ({
            ...prevState,
            stage: GameStage.Waiting
        }))
    }
    return (
        <Container>
            <div className="text-center">
                <h1>Workload Distribution</h1>
            </div>
            <Row>
                <Col>
                    <div className={styles.chatbox}>
                        {messages.map((message, index) => (
                            <div key={index}>
                                <strong>{message.sender}: </strong>
                                {message.message}
                            </div>
                        ))}
                    </div>
                    <Form onSubmit={(e) => { e.preventDefault(); }}>
                        <Form.Group controlId="message">
                            <Form.Control
                                type="text"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                        </Form.Group>
                        <Button variant="primary" type="button" onClick={handleSendMessage}>
                            Send
                        </Button>
                    </Form>

                </Col>
            </Row>
            <Row>
                <p>
                    Please discuss with your group members
                    and decide the sequence of and the game playing length
                    for second round game.
                </p>
                {
                    gameState.getter.engine.sequence[1].map((sequence, index) => (
                        <div
                            key={index}
                            className={styles.timeblock + (firstSelect === index ? " " + styles.selected : "")}
                            style={{ width: (sequence.time / (GAME_DURATION * (gameState.getter.room?.maxPlayers || 3)) * 100) + '%' }}>
                            <span onClick={() => selection(index)}>
                                {gameState.getter.room?.playerNames[sequence.playerIndex]}
                            </span>
                            <div>
                                <input type="number"
                                    value={sequence.time}
                                    onChange={(e) => setTime(parseInt(e.target.value), index)} />
                                second(s)
                            </div>
                        </div>
                    ))
                }
                <div className="text-center">
                    <Button className="my-2" variant="secondary" type="button" onClick={() => { setShowFairness(true) }}>
                        Show fairness dashboard
                    </Button>
                    <br />
                    <Button variant="primary" type="button" onClick={submit}>
                        Submit
                    </Button>

                </div>
            </Row>
            <Fairness showFairness={showFairness} setShowFairness={setShowFairness} />
        </Container>
    )
}