import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'cross-fetch';
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { Chess } from 'chess.js';
import { readStream } from './util';
import * as AsciiBoard from './AsciiBoard'

const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

interface Player {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
}

let screen = blessed.screen();

let grid = new contrib.grid({rows: 12, cols:12, screen: screen})

let playersBox = grid.set(0,0,3,4, blessed.box, { tags: true });

let boardBox = grid.set(0,4,3,4, blessed.box, { tags: true });

let log = grid.set(0,8,3,4, contrib.log, { label: 'log', tags: true
  }
);

let chess = new Chess();
boardBox.setContent(AsciiBoard.fromChessJsBoard(chess.board()));
screen.key(["C-c", "escape", "q"], () => {
  return process.exit(0);
});


const stream = fetch('https://lichess.org/api/tv/feed');
let whitePlayer: Player, blackPlayer: Player;

let fullTurnCount = 0;
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
  switch (obj.t){
    case 'featured': 
      fullTurnCount = 1;
      // fall through...
    case 'fen':
      let fen = obj.d.fen.trim();
      // HACK: Add missing information to the FEN received from lichess.org,
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
        if (fen.indexOf(" b ") > -1){
          log.log(`${fullTurnCount++}. ${lastMove}`);
        } 
        else if (fen.indexOf(" w ") > -1){
          log.log(`... ${lastMove}`);
        };
        let moved = chess.move(lastMove, {sloppy: true});
        if (!moved){  
          // HACK: if moving doesn't work, fall back to loadFen
          fenLoaded = chess.load(fen);
        }
      }
      if (obj.d.players && obj.d.players.length > 0){
        whitePlayer = obj.d.players[0];
        blackPlayer = obj.d.players[1];
      }
      let playerContent = `{right}{blue-fg}${
        blackPlayer
          ? blackPlayer.user.name + 
            '{yellow-fg}[{red-fg}' + (blackPlayer.user.title||'untitled') + '{/red-fg}] ' + 
            '{green-fg}' + blackPlayer.rating + '{/green-fg}'
          : 'Black'
      }\n`;
      // add white's clock count to board content
      playerContent +=`{yellow-fg}${obj.d.bc}s\n`;

      let boardContent = "\n{center}";
      boardContent += AsciiBoard.fromChessJsBoard(chess.board());
      boardBox.setContent(boardContent);

      playerContent += '\n\n\n\n';
      // add White's's clock count to board content
      playerContent +=`{yellow-fg}${obj.d.wc}s\n`;
      // playerContent += '\n';
      playerContent += `{blue-fg}${
        whitePlayer
          ? whitePlayer.user.name + 
            ' {yellow-fg}[{red-fg}' + (whitePlayer.user.title||'untitled') + '{/white-fg}] ' + 
            '{/yellow-fg}{green-fg}' + whitePlayer.rating + '{/green-fg}'
          : 'White'
      }\n`;
      playersBox.setContent(playerContent);
      break;
    default: 
      log.log(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
  }
  screen.render();
}
const onComplete = () => {
  log.log('{yellow-fg}THE LIVE STREAM HAS ENDED');
  screen.render();
}

stream
  .then(readStream(onMessage))
  .then(onComplete);
