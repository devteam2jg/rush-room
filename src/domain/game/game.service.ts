import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {}

export class GameLifeCycle {
  onRoomCreated(gameData: GameData) {
    return new Promise(() => {
      console.log('onRoomCreated', gameData);
    });
  }
  onCreated(gameData: GameData) {
    return new Promise(() => {
      console.log('onCreated', gameData);
    });
  }
  onStarted(gameData: GameData) {
    return new Promise(() => {
      console.log('onStarted', gameData);
    });
  }
  onRushTime(gameData: GameData) {
    return new Promise(() => {
      console.log('onRushTime', gameData);
    });
  }
  onEnded(gameData: GameData) {
    return new Promise(() => {
      console.log('onEnded', gameData);
    });
  }

  run(gameData: GameData) {
    this.onRoomCreated(gameData)
      .then(() => this.onCreated(gameData))
      .then(() => this.onStarted(gameData))
      .then(() => this.onRushTime(gameData))
      .then(() => this.onEnded(gameData));
  }
}
export class GameData {
  id: string;
  name: string;
  status: string;
  players: string[];
  createdAt: Date;
  updatedAt: Date;
}
