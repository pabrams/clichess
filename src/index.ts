import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'cross-fetch';
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { Chess } from 'chess.js';
import { readStream } from './util';
import util from 'util';
const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

interface Player {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
}

let screen = blessed.screen();
let grid = new contrib.grid({rows: 12, cols:12, screen: screen})

let board = grid.set(0,4,4,4, blessed.box, {
  content: 'the game board',
  fg: "green",
  label: "main board",
  tags: true,
  border: { type: "line",fg: "blue" }
});

let playersBox = grid.set(
  4,4,2,4, blessed.box, { 
    label: 'playersBox', tags: true, content: ""
  }
);

let clocksBox = grid.set(
  6,4,2,4, blessed.box, { 
    label: 'Clocks', tags: true, content: ""
  }
);

let log = grid.set(
  0,8,12,4, contrib.log, { 
    label: 'log', tags: true 
  }
);

let chess = new Chess();
board.setContent(chess.ascii());
screen.key(["C-c", "escape", "q"], () => {
  return process.exit(0);
});

const stream = fetch('https://lichess.org/api/tv/feed');
let whitePlayer: Player, blackPlayer: Player;

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
  let fenLoaded = false;
  let playerData = "";
  let clockData = "";
  switch (obj.t){
    case 'featured': 
      // fall through...
    case 'fen':
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
      let lastMove = obj.d.lm;
      if (lastMove){
        log.log(lastMove);
        let moved = chess.move(lastMove);
        if (!moved){
          fenLoaded = chess.load(fen);
        }
      }
      board.setContent(chess.ascii());
      if (obj.d.players && obj.d.players.length > 0){
        whitePlayer = obj.d.players[0];
        blackPlayer = obj.d.players[1];
      }
      playerData += `{blue-fg}${
        whitePlayer
          ? whitePlayer.user.name + 
            ' {yellow-fg}[{red-fg}' + (whitePlayer.user.title||'untitled') + '{/white-fg}] ' + 
            ' {/yellow-fg}({green-fg}' + whitePlayer.rating + '{/green-fg})'
          : 'White'
      }\n`;
      clockData += `{white-fg}{black-bg}White: ${obj.d.wc}\n`;
      playerData += `{blue-fg}${
        blackPlayer
          ? blackPlayer.user.name + 
            ' {yellow-fg}[{red-fg}' + (blackPlayer.user.title||'untitled') + '{/red-fg}] ' + 
            ' {yellow-fg}({green-fg}' + blackPlayer.rating + '{/green-fg})'
          : 'Black'
      }\n\n`;
      clockData += `{black-fg}{white-bg}Black: ${obj.d.bc}{/white-bg}{/black-fg}`;
      break;
    default: 
      log.log(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
  }
  playerData && playersBox.setContent(playerData);
  clockData && clocksBox.setContent(clockData);
  screen.render();
}
const onComplete = () => {
  log.log('{yellow-fg}THE LIVE STREAM HAS ENDED');
  screen.render();
}

stream
  .then(readStream(onMessage))
  .then(onComplete);
  