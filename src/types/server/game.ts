import { Server } from "socket.io";
import Room from "./room";
import RoomManager from './manager'

enum GameProgress {
    Waiting = "Waiting",
    RoundPlaying = "RoundPlaying",
    RoundOver = "RoundOver",
    Rating = "Rating",
    Discussion = "Discussion",
    Over = "Over"
}

interface ClientGameEngine {
    round: number;
    maxRound: number;
    currentPlayerSequence: number;
    sequence: Sequence[][];
    progress: GameProgress;
    grid: string[][];
    width: number;
    height: number;
    blockSize: number;
    score: number[][];
    countDown: number;
    rating: Rating[][];
}

const DIFFICULTY = {
    EASY: "easy",
    MEDIUM: "medium",
    DIFFICULT: "hard"
}

const GAME_DURATION = 2 * 60;

const BLOCK_SHAPES = {
    [DIFFICULTY.EASY]: [
        // 方块形状1
        [
            [1, 1],
            [1, 1],
        ],
        // 方块形状2
        [[1, 1, 1, 1]],
        // 方块形状3
        [[1], [1], [1], [1]],
    ],
    [DIFFICULTY.MEDIUM]: [
        // 方块形状1
        [
            [0, 1],
            [0, 1],
            [1, 1],
        ],
        // 方块形状2
        [
            [1, 1, 1],
            [0, 0, 1],
        ],
        // 方块形状3
        [
            [1, 1],
            [1, 0],
            [1, 0],
        ],
        // 方块形状4
        [
            [1, 0, 0],
            [1, 1, 1],
        ],
        // 方块形状5
        [
            [1, 0],
            [1, 0],
            [1, 1],
        ],
        // 方块形状6
        [
            [1, 1, 1],
            [1, 0, 0],
        ],
        // 方块形状7
        [
            [1, 1],
            [0, 1],
            [0, 1],
        ],
        // 方块形状8
        [
            [0, 0, 1],
            [1, 1, 1],
        ],
    ],
    [DIFFICULTY.DIFFICULT]: [
        // 方块形状1
        [
            [1, 0],
            [1, 1],
            [0, 1],
        ],
        // 方块形状2
        [
            [0, 1, 1],
            [1, 1, 0],
        ],
        // 方块形状3
        [
            [0, 1],
            [1, 1],
            [1, 0],
        ],
        // 方块形状4
        [
            [1, 1, 0],
            [0, 1, 1],
        ],
        // 方块形状5
        [
            [1, 0],
            [1, 1],
            [1, 0],
        ],
        // 方块形状6
        [
            [1, 1, 1],
            [0, 0, 0],
        ],
        // 方块形状7
        [
            [0, 1],
            [1, 1],
            [0, 1],
        ],
        // 方块形状8
        [
            [0, 1, 0],
            [1, 1, 1],
        ],
    ],
};

const BLOCK_PROBABILITY = {
    [DIFFICULTY.EASY]: {
        [DIFFICULTY.EASY]: 0.7,
        [DIFFICULTY.MEDIUM]: 0.15,
        [DIFFICULTY.DIFFICULT]: 0.15,
    },
    [DIFFICULTY.MEDIUM]: {
        [DIFFICULTY.EASY]: 0.15,
        [DIFFICULTY.MEDIUM]: 0.7,
        [DIFFICULTY.DIFFICULT]: 0.15,
    },
    [DIFFICULTY.DIFFICULT]: {
        [DIFFICULTY.EASY]: 0.15,
        [DIFFICULTY.MEDIUM]: 0.15,
        [DIFFICULTY.DIFFICULT]: 0.7,
    },
};

const GRID_WIDTH = 15;
const GRID_HEIGHT = 38;
const BLOCK_SIZE = 15;

interface Block {
    x: number;
    y: number;
    type: string;
    shape: number[][];
}

interface Rating {
    playerIndex: number,
    score: number,
    reason: string
}

interface Sequence {
    playerIndex: number,
    time: number,
    difficulty: string
}

class GameEngine implements ClientGameEngine {
    intervalId: NodeJS.Timeout | null;
    io: Server;
    room: Room;
    round: number;
    maxRound: number;
    currentPlayerSequence: number;
    sequence: Sequence[][];
    progress: GameProgress;
    grid: string[][] = [];
    noCurrentGrid: string[][] = [];
    width: number;
    height: number;
    blockSize: number;
    currentBlock: Block | null;
    manager: RoomManager;
    score: number[][];
    endTime: Date;
    countDown: number;
    rating: Rating[][];
    agreeCount: number;

    constructor(io: Server, room: Room, manager: RoomManager) {
        this.intervalId = null;
        this.io = io;
        this.room = room;
        this.round = 0;
        this.maxRound = 2;
        this.currentPlayerSequence = 0;
        this.sequence = Array(this.maxRound).fill(
            Array(this.room.maxPlayers).fill(0).map((_, i) => ({
                playerIndex: i,
                time: GAME_DURATION,
                difficulty: DIFFICULTY.EASY,
            }))
        );
        this.progress = GameProgress.Waiting;
        this.width = GRID_WIDTH;
        this.height = GRID_HEIGHT;
        this.blockSize = BLOCK_SIZE;
        this.grid = [];
        this.noCurrentGrid = [];
        this.score = [Array(this.room.maxPlayers).fill(0), 
                      Array(this.room.maxPlayers).fill(0)];
        this.endTime = new Date(new Date().getTime() + GAME_DURATION * 1000);
        this.countDown = GAME_DURATION;
        this.currentBlock = null;
        this.manager = manager;
        this.rating = Array(this.room.maxPlayers).fill([])
        this.agreeCount = 0;
        this.init();
    }

    init() {
        let difficulty = [DIFFICULTY.EASY, DIFFICULTY.MEDIUM, DIFFICULTY.DIFFICULT]
        difficulty = difficulty.sort(() => Math.random() - 0.5);
        for (let i = 0; i < this.room.maxPlayers; i++) {
            for(let j = 0; j < this.maxRound; j++)
                this.sequence[j][i].difficulty = difficulty[i];
        }
        this.reset()
    }

    reset() {
        for (var y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (var x = 0; x < this.width; x++) {
                this.grid[y][x] = '';
            }
        }
        this.noCurrentGrid = JSON.parse(JSON.stringify(this.grid));
        this.countDown = this.sequence[this.round][this.currentPlayerSequence].time;
        this.progress = GameProgress.Waiting;
        this.currentBlock = null;
    }

    getRandomBlockType(difficulty: string) {
        var probability = BLOCK_PROBABILITY[difficulty];
        var r = Math.random();
        if (r < probability[DIFFICULTY.EASY]) {
            return DIFFICULTY.EASY;
        } else if (r < probability[DIFFICULTY.EASY] + probability[DIFFICULTY.MEDIUM]) {
            return DIFFICULTY.MEDIUM;
        } else {
            return DIFFICULTY.DIFFICULT;
        }
    }

    generateNewBlock() {
        var type = this.getRandomBlockType(
            this.sequence[this.round][this.currentPlayerSequence].difficulty
        );
        var shapeIndex = Math.floor(Math.random() * BLOCK_SHAPES[type].length);
        var shape = BLOCK_SHAPES[type][shapeIndex];
        this.currentBlock = {
            x: Math.floor((GRID_WIDTH - shape[0].length) / 2),
            y: 0,
            shape: shape,
            type: type,
        };
    }

    isBlockColliding() {
        let block = this.currentBlock;
        if(block == null) 
            return false;
        for (var i = 0; i < block.shape.length; i++) {
            for (var j = 0; j < block.shape[i].length; j++) {
                if (block.shape[i][j] === 1) {
                    var x = block.x + j;
                    var y = block.y + i;
                    if (y >= GRID_HEIGHT || this.grid[y][x] !== '') {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    fixBlock() {
        let block = this.currentBlock;
        if(block == null)
            return;
        for (var i = 0; i < block.shape.length; i++) {
            for (var j = 0; j < block.shape[i].length; j++) {
                if (block.shape[i][j] === 1) {
                    var x = block.x + j;
                    var y = block.y + i;
                    if (y >= 0) {
                        this.grid[y][x] = block.type;
                    }
                }
            }
        }
    }

    eliminateRows() {
        var eliminatedRows = 0;
        for (var y = GRID_HEIGHT - 1; y >= 0; y--) {
            var isFullRow = true;
            for (var x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x] === '') {
                    isFullRow = false;
                    break;
                }
            }
            if (isFullRow) {
                eliminatedRows++;
    
                for (var i = y - 1; i >= 0; i--) {
                    this.grid[i + 1] = this.grid[i];
                }
    
                this.grid[0] = [];
                for (var x = 0; x < GRID_WIDTH; x++) {
                    this.grid[0][x] = '';
                }
    
                y++;
            }
        }
    
        this.score[this.round][this.currentPlayerSequence] += eliminatedRows * 10;
    }

    isGameOver() {
        for (var x = 0; x < GRID_WIDTH; x++) {
            if (this.grid[0][x] !== '') {
                return true;
            }
        }
        if (new Date() >= this.endTime) {
            return true;
        }
        return false;
    }

    tick(): void {
        if (!this.currentBlock) {
            this.generateNewBlock();
        }
        if (!this.currentBlock) 
            return;
        this.currentBlock.y++;
        this.grid = JSON.parse(JSON.stringify(this.noCurrentGrid));
        if (this.isBlockColliding()) {
            this.currentBlock.y--;
            this.fixBlock();
            this.eliminateRows();
            this.noCurrentGrid = JSON.parse(JSON.stringify(this.grid));
            this.currentBlock = null;
        }
        if(this.currentBlock) {
            let shape = this.currentBlock.shape;
            for (var i = 0; i < shape.length; i++) {
                for (var j = 0; j < shape[i].length; j++) {
                    if (shape[i][j] === 1) {
                        this.grid[this.currentBlock.y + i][this.currentBlock.x + j] = this.currentBlock.type;
                    }
                }
            }
        }
        this.countDown = (this.endTime.getTime() - new Date().getTime()) / 1000;
        if (this.isGameOver()) {
            this.countDown = 0;
            this.progress = GameProgress.RoundOver;
            if(this.currentPlayerSequence === this.room.maxPlayers - 1) {
                if(this.round == this.maxRound - 1)
                    this.progress = GameProgress.Over;
                else
                    this.progress = GameProgress.Rating;
            }
        } else {
            this.intervalId = setTimeout(() => {
                this.tick();
            }, 200)
        }
        this.manager.updateEngine(this.io, this.room.name);
    };

    start() {
        this.progress = GameProgress.RoundPlaying;
        this.endTime = new Date(new Date().getTime() + this.sequence[this.round][this.currentPlayerSequence].time * 1000);
        this.tick();
    }

    stop() {
        if(this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }    

    nextToken() {
        this.currentPlayerSequence++;
        this.progress = GameProgress.Waiting;
        this.manager.updateEngine(this.io, this.room.name);
    }

    isBlockPositionValid(x: number, y:number, shape: number[][]) {
        for (var i = 0; i < shape.length; i++) {
            for (var j = 0; j < shape[i].length; j++) {
                if (shape[i][j] === 1) {
                    var blockX = x + j;
                    var blockY = y + i;
                    if (
                        blockX < 0 ||
                        blockX >= GRID_WIDTH ||
                        blockY >= GRID_HEIGHT ||
                        (blockY >= 0 && this.noCurrentGrid[blockY][blockX] !== '')
                    ) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    moveCurrentBlock(dx: number, dy: number) {
        if(this.currentBlock == null)
            return;
        var x = this.currentBlock.x + dx;
        var y = this.currentBlock.y + dy;
        if (this.isBlockPositionValid(x, y, this.currentBlock.shape)) {
            this.currentBlock.x = x;
            this.currentBlock.y = y;
        }
    }
    
    rotateCurrentBlock() {
        if(this.currentBlock == null)
            return;
        var rows = this.currentBlock.shape.length;
        var cols = this.currentBlock.shape[0].length;
    
        var newShape: number[][] = [];
        for (var i = 0; i < cols; i++) {
            newShape[i] = [];
            for (var j = 0; j < rows; j++) {
                newShape[i][j] = this.currentBlock.shape[rows - j - 1][i];
            }
        }
    
        if (this.isBlockPositionValid(this.currentBlock.x, this.currentBlock.y, newShape)) {
            this.currentBlock.shape = newShape;
        }
    }
    
    move(direction: string) {
        if(direction === "left")
            this.moveCurrentBlock(-1, 0);
        else if(direction === "right")
            this.moveCurrentBlock(1, 0);
        else if(direction === "up")
            this.rotateCurrentBlock();
        else if(direction === "down")
            this.moveCurrentBlock(0, 1);
    }

    allRatingDone() {
        for (var i = 0; i < this.room.maxPlayers; i++) {
            if (this.rating[i].length === 0) {
                return false;
            }
        }
        return true;
    }

    updateRating(playerIndex: number, rating: Rating[]) {
        this.rating[playerIndex] = rating;
        if (this.allRatingDone()) {
            this.progress = GameProgress.Discussion;
        }
    }

    updateSequence(sequence: Sequence[]) {
        this.sequence[1] = sequence;
    }

    updateAgreement() {
        this.agreeCount += 1;
        if(this.agreeCount == this.room.maxPlayers) {
            this.round = 1;
            this.currentPlayerSequence = 0;
            this.reset();
        }
        
    }
}

export { GAME_DURATION, GRID_WIDTH, GRID_HEIGHT, BLOCK_SIZE, GameProgress, DIFFICULTY, GameEngine as default } ;
export type { ClientGameEngine, Rating, Sequence };

