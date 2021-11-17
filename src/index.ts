import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'cross-fetch';
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { Chess } from 'chess.js';
import { readStream } from './util';
import fs from 'fs';

const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

const config = JSON.parse(fs.readFileSync('config.json').toString());

interface Player {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
}

const isLowerCase = (char: string) => {
  return char.toString() === char.toLowerCase();
}

const charIsOnBoard = (char: string) => {
    return char === 'K' 
      || char === 'k'
      || char === 'Q'
      || char === 'q'
      || char === 'R'
      || char === 'r'
      || char === 'B'
      || char === 'b'
      || char === 'N'
      || char === 'n'
      || char === 'P'
      || char === 'p'
      || char === '.'
      || char === '♚'
      || char === '♛'
      || char === '♜'
      || char === '♝'
      || char === '♞'
      || char === '♟'
}

const replaceLetterWithSymbol = (letter: string, whiteSquare: boolean) => {
  let result = letter;
  let prefix = "";

  prefix += (
    whiteSquare ? 
      config.board.whiteSquareColor :
      config.board.darkSquareColor
  );

  prefix += (
    isLowerCase(letter) ?
      config.board.darkPieceColor :
      config.board.whitePieceColor
  );
  
  if (letter.toUpperCase() === 'K') result = `${prefix}♚`;
  if (letter.toUpperCase() === 'Q') result = `${prefix}♛`;
  if (letter.toUpperCase() === 'R') result = `${prefix}♜`;
  if (letter.toUpperCase() === 'B') result = `${prefix}♝`;
  if (letter.toUpperCase() === 'N') result = `${prefix}♞`;
  if (letter.toUpperCase() === 'P') result = `${prefix}♟`;
  if (letter.toUpperCase() === '.') result = `${prefix}.`;
  return result;
}

const mapChessAscii = (ascii: string) => {
  ascii =  ascii.replaceAll(' ', '');
  ascii =  ascii.replaceAll('+------------------------+', ' +--------+');
  let coloredSquares = "";
  let chars = -1;
  let whiteSquare = false;

  for (const asciiChar of ascii) {
    if (charIsOnBoard(asciiChar)){
      chars++;
      whiteSquare = (chars %2) == 1;
      if (Math.floor(chars / 8) % 2 !== 0){
        whiteSquare = !whiteSquare;
      }
      let square = replaceLetterWithSymbol(asciiChar, whiteSquare);
      coloredSquares += square;
    }
    else{
      coloredSquares += `{black-bg}{white-fg}${asciiChar}`;
    }
  }
  return coloredSquares;
}

let screen = blessed.screen();
let grid = new contrib.grid({rows: 12, cols:12, screen: screen})

let playersBox = grid.set(
  0,0,2,5, blessed.box, { 
    label: 'players', tags: true, content: ""
  }
);

let boardBox = grid.set(0,5,5,4, blessed.box, {
  content: 'the game board',
  fg: "green",
  label: "main board",
  tags: true,
  border: { type: "line",fg: "blue" }
});

let log = grid.set(
  0,9,12,3, contrib.log, { 
    label: 'log', tags: true 
  }
);

let chess = new Chess();
boardBox.setContent(mapChessAscii(chess.ascii()));
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
  switch (obj.t){
    case 'featured': 
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
        log.log(lastMove);
        let moved = chess.move(lastMove, {sloppy: true});
        if (!moved){  
          // HACK: if moving doesn't work, fall back to loadFen
          fenLoaded = chess.load(fen);
        }
      }
      boardBox.setContent(mapChessAscii(chess.ascii()));
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
      }: {magenta-fg}${obj.d.wc}{/magenta-fg}s\n`;
      playerData += `{blue-fg}${
        blackPlayer
          ? blackPlayer.user.name + 
            ' {yellow-fg}[{red-fg}' + (blackPlayer.user.title||'untitled') + '{/red-fg}] ' + 
            ' {/yellow-fg}({green-fg}' + blackPlayer.rating + '{/green-fg})'
          : 'Black'
        }: {magenta-fg}${obj.d.bc}{/magenta-fg}s\n`;
      break;
    default: 
      log.log(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
  }
  playerData && playersBox.setContent(playerData);
  screen.render();
}
const onComplete = () => {
  log.log('{yellow-fg}THE LIVE STREAM HAS ENDED');
  screen.render();
}

stream
  .then(readStream(onMessage))
  .then(onComplete);
