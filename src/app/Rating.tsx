"use client";
import { useContext, useState } from "react";
import { Container, Row, Button, Col } from 'react-bootstrap';
import GameContext from './context.ts'
import { GameStage } from "./state.ts";
import Card from 'react-bootstrap/Card';
import { Rating } from '@/types/server/game'

export default function Rating() {
    const gameState = useContext(GameContext);
    const totalScore = gameState.getter.engine?.score[0].reduce((partialSum, a) => partialSum + a, 0) || 0;
    const [ratingList, setRatingList] = useState(
        gameState.getter.room?.playerNames.map((name) => {
            return {
                score: totalScore,
                reason: ""
            }
        }) || []
    )
    if (gameState.getter.room == null || gameState.getter.engine == null)
        return null;


    function validateScore(score: string) {
        let result: number = parseInt(score);
        if (isNaN(result))
            result = totalScore;
        if (result > totalScore)
            result = totalScore;
        return result;
    }
    function sendRating() {
        gameState.getter.socket?.emit("rating",
            ratingList.map((rating, index) => ({
                playerIndex: index,
                score: rating.score,
                reason: rating.reason
            } as Rating))
        );
        gameState.setter((prevState) => ({
            ...prevState,
            stage: GameStage.Waiting
        }))
    }
    return (
        <Container>
            <Row>
                <Col>
                    <h1>What do you think about the performance of your group members?</h1>
                    <Card>
                        <Card.Body>
                            <p>The group score is {totalScore}, so {totalScore} is your final score.</p>
                            {
                                gameState.getter.engine.sequence[0].map((sequence, seq) => (
                                    <p key={seq}> {gameState.getter.room?.playerNames[sequence.playerIndex]} gains {gameState.getter.engine?.score[0][seq]} </p>
                                ))
                            }
                        </Card.Body>
                    </Card>
                    <div>
                        <h2>How many points do you think the group member should get?</h2>
                        <div className="text-center my-4">
                            {
                                ratingList.map((playerRate, index) => (
                                    <div key={index}>
                                        <span>{gameState.getter.room?.playerNames[index]}: </span>
                                        <input type="nubmer" value={playerRate.score} onChange={(e) => {
                                            const nextRatingList = ratingList.map((playerRate, pindex) => {
                                                if (index === pindex) {
                                                    return {
                                                        score: validateScore(e.target.value),
                                                        reason: playerRate.reason
                                                    }
                                                } else
                                                    return playerRate;
                                            })
                                            setRatingList(nextRatingList)
                                        }} />
                                        <input type="text" placeholder="reason" value={playerRate.reason} onChange={(e) => {
                                            const nextRatingList = ratingList.map((playerRate, pindex) => {
                                                if (index === pindex) {
                                                    return {
                                                        score: playerRate.score,
                                                        reason: e.target.value
                                                    }
                                                } else
                                                    return playerRate;
                                            })
                                            setRatingList(nextRatingList)
                                        }} />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                    <Button variant="primary" type="button" onClick={sendRating}>
                        Submit
                    </Button>
                </Col>
            </Row>
        </Container>
    )
}