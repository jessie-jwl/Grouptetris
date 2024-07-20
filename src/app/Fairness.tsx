"use client";
import { useContext, useState } from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import GameContext from './context.ts'
import styles from "./fairness.module.css"

export default function Fairness({ showFairness, setShowFairness }: { showFairness: boolean, setShowFairness: (value: boolean | ((prevState: boolean) => boolean)) => void }) {
    const gameState = useContext(GameContext);
    const [firstSelect, setFirstSelect] = useState(-1);
    const [secondSelect, setSecondSelect] = useState(-1);
    if (gameState.getter.room == null || gameState.getter.engine == null)
        return null;

    function handleClose() {
        setShowFairness(false);
    }

    const totalScore = gameState.getter.engine.score[0].reduce((partialSum, a) => partialSum + a, 0);
    function getMyScore() {
        const index = gameState.getter.room?.playerNames.indexOf(gameState.getter.playerName)
        if (index === undefined)
            return undefined;
        return gameState.getter.engine?.rating[index]
    }
    function getAvgScore() {
        let score = Array(gameState.getter.room?.maxPlayers).fill(0)
        console.log(gameState.getter.engine?.rating)
        gameState.getter.engine?.rating.map((rating) => {
            rating.map((rate, index) => {
                score[index] += rate.score / (gameState.getter.room?.maxPlayers || 3);
            })
        })
        return score;
    }
    function calculate() {
        const score = getAvgScore();
        if (firstSelect == -1 || secondSelect == -1)
            return "-"
        let result = (((totalScore / 3) - score[firstSelect]) - ((totalScore / 3) - score[secondSelect])) / totalScore
        result *= 100
        result = Math.abs(result)
        return result
    }

    function selection(index: number) {
        if (firstSelect === index) {
            setFirstSelect(-1);
        } else if (secondSelect === index) {
            setSecondSelect(-1);
        } else if (firstSelect === -1) {
            setFirstSelect(index);
        } else if (secondSelect === -1) {
            setSecondSelect(index);
        } else {
            setFirstSelect(index);
        }
    }
    return (
        <Modal show={showFairness} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Fairness Dashboard</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {
                    gameState.getter.engine.sequence[1].map((sequence, index) => (
                        <div
                            key={index}
                            className={styles.playerBlock + ((firstSelect === index) ? " " + styles.selected1 : "") + ((secondSelect === index) ? " " + styles.selected2 : "")}
                            onClick={() => selection(index)}>
                            <span>
                                {gameState.getter.room?.playerNames[sequence.playerIndex]}
                            </span>
                        </div>
                    ))
                }
                <div>
                    <h2>Wordload Efficiency Gap</h2>
                    <p>
                        Click on any of the two members and you will see the gap on how these two members contribute
                    </p>
                    <p>
                        = {calculate()} %
                    </p>
                </div>
                <div>
                    <h2>Difficulty Level Reveal</h2>
                    {
                        gameState.getter.engine.sequence[0].map((sequence, index) => (
                            <div key={index}>
                                <span>
                                    {gameState.getter.room?.playerNames[sequence.playerIndex]}: {sequence.difficulty}
                                </span>
                            </div>
                        ))
                    }
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}