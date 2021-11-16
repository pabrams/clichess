import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'cross-fetch';
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { Chess } from 'chess.js';
import { readStream } from './util';
const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

interface Player {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
}

// interface tvResponse {
//   t: string;
//   d: { 
//     fen: string; 
//     lm: string;
//     wc?: number; 
//     bc?: number;
//     id?: string;
//     orientation?: string;
//     players?: Player[];
//   };
// };

let screen = blessed.screen();
let grid = new contrib.grid({rows: 12, cols:12, screen: screen})

let board = grid.set(0,4,4,4, blessed.box, {
  content: 'the game board',
  fg: "green",
  label: "main board",
  tags: true,
  border: { type: "line",fg: "blue" }
});
let metadata = grid.set(8,4,4,4, blessed.box, { label: 'metadata', tags: true });

let chess = new Chess();-
board.setContent(chess.ascii());
screen.key(["C-c", "escape", "q"], () => {
  return process.exit(0);
});
screen.render();
const stream = fetch('https://lichess.org/api/tv/feed');
let whitePlayer: Player, blackPlayer: Player;
let playerData: string;
const onMessage = (obj: {
  t: string; 
  d: {
    fen: string; 
    lm?: string; 
    players?: Player[];
    orientation?: string;
    wc?: number; 
    bc?: number; 
  }; 
}) => {
  console.log("obj", obj);
  let fenLoaded: boolean = false;
  switch (obj.t){
    case 'featured': 
      metadata.setContent('{blue-fg}FEATURED LIVE STREAM{/blue-fg}\n\r');
      // fall through...
    case 'fen':
      let lastMove = obj.d.lm;
      let fen = obj.d.fen.trim();
      // Add missing information to the FEN received from lichess.org,
      // which is not actually a valid FEN.
      const lastFenChar = fen.charAt(fen.length - 1);
      if (lastFenChar === 'w' || lastFenChar === 'b') {
        fen = fen + " KQkq - 0 1";
      }
      else if(lastFenChar === 'R') {
        fen = fen + " w KQkq - 0 1";
      }
      if (chess.history().length > 0) {
        // make the last move...
        if (lastMove){
          let moved = chess.move(lastMove);
          if (!moved){
            console.log(`{red-fg}The move {yellow-fg}${lastMove}{/yellow-fg}received from {blue-fg}lichess.org {/blue-fg}is invalid from position {green-fg}${fen} {/green-fg} !`)
            fenLoaded = chess.load(fen);
          }
        }
        else {
          throw ("undefined lastMove");
        }
      }
      else {
        // There is no history available, so just load the FEN.
        fenLoaded = chess.load(fen);
      }
      board.setContent(chess.ascii());
      if (obj.d.players && obj.d.players.length > 0){
        whitePlayer = obj.d.players[0];
        blackPlayer = obj.d.players[1];
      }
      playerData += `{white-fg}${
        whitePlayer
          ? whitePlayer.user.name + 
            ' {yellow-fg}[{white-fg}' + (whitePlayer.user.title||'untitled') + '{/white-fg}] ' + 
            ' {/yellow-fg}({green-fg}' + whitePlayer.rating + '{/green-fg})'
          : 'White'
      } {green-fg}clock: {white-fg}${obj.d.wc}\n\r`;
      playerData += `{white-fg}${
        blackPlayer
          ? blackPlayer.user.name + 
            ' {yellow-fg}[{red-fg}' + (blackPlayer.user.title||'untitled') + '{/red-fg}] ' + 
            ' {yellow-fg}({green-fg}' + blackPlayer.rating + '{/green-fg})'
          : 'Black'
      } {green-fg}clock: {white-fg}${obj.d.bc}\n\r\n\r`;
      break;
    default: 
      console.log(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
      console.log("obj", obj);
  }
  playerData && metadata.setContent(playerData);
  screen.render();
}
const onComplete = () => {
  console.log('{yellow-fg}THE LIVE STREAM HAS ENDED');
  screen.render();
}

stream
  .then(readStream(onMessage))
  .then(onComplete);

