"use client";
import { useContext } from "react";
import GameContext from './context.ts'
import RoomCard from './RoomCard.tsx'
import { GameState } from './state';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

export default function Intro() {
    const gameState = useContext(GameContext);
    const socket = gameState.getter.socket;
    function create_room() {
        if (socket === null) {
            alert("You must be connected to the server to create a room");
            return;
        }
        socket.emit("create_room", {
            roomName: gameState.getter.roomName,
            playerName: gameState.getter.playerName
        });
    }
    function join_room() {
        if (socket === null) {
            alert("You must be connected to the server to join a room");
            return;
        }
        socket.emit("join_room", {
            roomName: gameState.getter.roomName,
            playerName: gameState.getter.playerName
        });
    }
    return (
        <Container className="h-100">
            <Row className="h-100 align-items-center">
                <Col>
                    <div>
                        <p>This is a project that aims to study group collaboration. You are going to play a new designed Tetris game in a group of
                            3. While you are playing the game, please imagine playing the game as you are a completing a group task. Your behavior
                            and game result will affect the group score and other group member’s gaming interface. That is, the group score is the
                            average of group members’ score, and the second player will continue what the first player has left off (the third
                            player will continue what the first and second player have left off). There will be three groups playing at the same
                            time, and the winning group will get extra participation fee.</p>

                        <p>There are two rounds (each 6 minutes) in this Tetris game. In the first round, each player will have 2 minutes of
                            playing time. Before starting the second round, group members will have 5 minutes of discussion time to think of what
                            can the group improve to increase the score, then to start the new game.</p>

                        <p>You will be randomly assigned a sequence to the game, and it will be shown on the next page. Enjoy:)</p>
                    </div>
                </Col>
                <Col>
                    {gameState.getter.room === null &&
                        <Form onSubmit={(e) => { e.preventDefault(); }}>
                            <Form.Group controlId="roomName">
                                <Form.Label>Room ID</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder="Type in the room name"
                                    value={gameState.getter.roomName}
                                    onChange={(e) => {
                                        gameState.setter((prevState: GameState) => ({
                                            ...prevState,
                                            roomName: e.target.value
                                        }))
                                    }}
                                />
                            </Form.Group>
                            <Form.Group controlId="playerName">
                                <Form.Label>Player Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Type in your player name"
                                    value={gameState.getter.playerName}
                                    onChange={(e) => {
                                        gameState.setter(prevState => ({
                                            ...prevState,
                                            playerName: e.target.value
                                        }))
                                    }}
                                />
                            </Form.Group>
                            <Button variant="primary" type="button" onClick={create_room}>
                                Create a room
                            </Button>
                            <Button variant="primary" type="button" onClick={join_room}>
                                Join a room
                            </Button>
                        </Form>
                    }
                    {gameState.getter.room !== null && <RoomCard />}
                </Col>
            </Row>

        </Container>
    );
}
