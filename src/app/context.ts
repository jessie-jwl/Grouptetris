"use client"; 
import { createContext } from "react";
import { GameStateContext, initState } from "./state";
const GameContext = createContext<GameStateContext>({
    getter: initState(),
    setter: () => { },
});
export default GameContext