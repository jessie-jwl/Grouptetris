"use client";
import { useContext } from "react";
import Intro from "./Intro.tsx";
import GameContext from './context.ts'
import { GameStage } from './state.ts'
import Game from './Game.tsx'
import Rating from './Rating.tsx'
import LoadingPage from './loading.tsx'
import Discuss from './Discuss.tsx'
import Result from './Result.tsx'
import { GameProgress } from "@/types/server/game.ts";

export default function Home() {
  const gameState = useContext(GameContext);
  switch (gameState.getter.stage) {
    case GameStage.Loading:
      return <LoadingPage message={"Loading..."} />
    case GameStage.Waiting:
      return <LoadingPage message={"Waiting for other players..."} />
    case GameStage.Intro:
      return (<>
        <Intro />
      </>
      );
    case GameStage.Playing:
    case GameStage.Playing:
      if (gameState.getter.engine === null)
        return <LoadingPage message={"Loading..."} />;
      else {
        switch (gameState.getter.engine.progress) {
          case GameProgress.Waiting:
          case GameProgress.RoundOver:
          case GameProgress.RoundPlaying:
            return <Game />;
          case GameProgress.Rating:
            return <Rating />;
          case GameProgress.Discussion:
            return <Discuss />;
          case GameProgress.Over:
            return <Result/>;
          default:
            return <LoadingPage message={"Loading..."} />;
        }
      }
    default:
      return <LoadingPage message={"Loading..."} />;
  }
}
