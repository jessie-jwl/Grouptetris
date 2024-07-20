"use client";
import { useEffect, useContext, useRef } from "react";
import GameContext from './context.ts';
import { GRID_WIDTH, GRID_HEIGHT, BLOCK_SIZE, DIFFICULTY } from "@/types/server/game.ts"

function drawGrid(canvas: HTMLCanvasElement, width: number, height: number, blockSize: number, time: number) {
    var ctx = canvas.getContext("2d");
    if (ctx == null)
        return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#f8f8f8";
    ctx.fillRect(0, 0, width * blockSize, height * blockSize);

    ctx.strokeStyle = "#e8e8e8";

    for (var y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * blockSize);
        ctx.lineTo(width * blockSize, y * blockSize);
        ctx.stroke();
    }

    for (var x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * blockSize, 0);
        ctx.lineTo(x * blockSize, height * blockSize);
        ctx.stroke();
    }
    ctx.font = "48px serif";
    ctx.fillStyle = "black";
    ctx.fillText(time.toString(), 20, 50);
}

function drawBlock(canvas: HTMLCanvasElement, x: number, y: number, type: string, blockSize: number) {
    const ctx = canvas.getContext("2d");
    if (ctx == null)
        return;
    switch (type) {
        case DIFFICULTY.EASY:
            ctx.fillStyle = "#00f";
            break;
        case DIFFICULTY.MEDIUM:
            ctx.fillStyle = "#0f0";
            break;
        case DIFFICULTY.DIFFICULT:
            ctx.fillStyle = "#f00";
            break;
    }
    ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
}

function drawBlocks(canvas: HTMLCanvasElement, width: number, height: number, blockSize: number, grid: string[][]) {
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (grid[y][x] !== '') {
                drawBlock(canvas, x, y, grid[y][x], blockSize);
            }
        }
    }
}

export default function GameCanvas() {
    const gameState = useContext(GameContext);
    const canvasElement = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const engine = gameState.getter.engine;
        const canvas: HTMLCanvasElement | null = canvasElement.current;
        if (canvas === null || engine == null)
            return;
        canvas.width = BLOCK_SIZE * GRID_WIDTH;
        canvas.height = BLOCK_SIZE * GRID_HEIGHT;
        drawGrid(canvas, engine.width, engine.height, engine.blockSize, engine.countDown);
        drawBlocks(canvas, engine.width, engine.height, engine.blockSize, engine.grid);
        
    }, [gameState.getter]);

    return (
        <canvas ref={canvasElement} />
    )
}