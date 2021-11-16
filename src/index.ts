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

const charIsOnBoard = (char: string) => {
  if (config.board.useChessSymbols){
    return char === '♚'
      || char === '♔'
      || char === '♛'
      || char === '♕'
      || char === '♜'
      || char === '♖'
      || char === '♝'
      || char === '♗'
      || char === '♘'
      || char === '♞'
      || char === '♟'
      || char === '♙'
      || char === '.'
  }
  else {
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
  }
}

const mapChessAscii = (ascii: string) => {
  ascii =  ascii.replaceAll(' ', '');
  ascii =  ascii.replaceAll('+------------------------+', ' +--------+');

  if (config.board.useChessSymbols){
    ascii = ascii    
      .replace('k', '♚')
      .replace('K', '♚')
      .replaceAll('Q', '♛')
      .replaceAll('q', '♕')
      .replaceAll('R', '♜')
      .replaceAll('r', '♖')
      .replaceAll('B', '♝')
      .replaceAll('b', '♗')
      .replaceAll('N', '♘')
      .replaceAll('n', '♞')
      .replaceAll('P', '♟')
      .replaceAll('p', '♙')
  }
  let coloredSquares = "";
  let chars = -1;
  let whiteSquare = false;
  ascii = ascii.replace('a♗cdefgh', '  abcdefgh');
  if (!config.board.colorSquares){
    coloredSquares = ascii;
  }
  else {
    for (const asciiChar of ascii) {
      if (charIsOnBoard(asciiChar)){
        chars++;
        // console.log(chars, chars%2, Math.floor(chars / 8) %2);
        if (chars % 2 == 0){
          whiteSquare = true;
        }else{
          whiteSquare = false;
        }
        if (Math.floor(chars / 8) % 2 !== 0){
          whiteSquare = !whiteSquare;
        }

        if (whiteSquare){
          coloredSquares += `${config.board.whiteSquare}${asciiChar}`;
        }else{
          coloredSquares += `${config.board.darkSquare}${asciiChar}`;
        }
      }
      else{
        coloredSquares += `{black-bg}{white-fg}${asciiChar}`;
      }
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
