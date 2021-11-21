import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'cross-fetch';
import * as blessed from 'blessed';
import * as contrib from 'blessed-contrib';
import { Chess, ChessInstance, Move, ShortMove, Square } from 'chess.js';
import { readStream } from './util';
import * as AsciiBoard from './AsciiBoard'

const headers = { Authorization: 'Bearer ' + process.env.lichessToken };


let screen = blessed.screen();
let grid = new contrib.grid({rows: 12, cols:12, screen: screen})
let playersBox = grid.set(0,0,4,4, blessed.box, { tags: true });
let boardBox = grid.set(0,4,4,4, blessed.box, { tags: true });
let logBox = grid.set(0,8,4,4, blessed.box, { 
  label: 'log', 
  tags: true ,
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: ' ',
    bg: 'red'
  }
});

const logLine = (text: string) => {
  logBox.pushLine(text);
  logBox.setScrollPerc(100);
};

const log = (text: string) => {
  let line = logBox.popLine();
  logBox.pushLine(line + text);
  logBox.setScrollPerc(100);
};

let chess = new Chess();
boardBox.setContent(AsciiBoard.fromChessJsBoard(chess.board()));
screen.key(["C-c", "escape", "q"], () => {
  return process.exit(0);
});

const stream = fetch('https://lichess.org/api/tv/feed');
let whitePlayer = new Player();
let  blackPlayer = new Player();

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
  switch (obj.t){
    case 'featured': 
      fullTurnCount = 1;
      // fall through...
    case 'fen':
      processMove(obj.d);
      setMetadata(obj.d);
      break;
    default: 
      logLine(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
  }
  screen.render();
};

const onComplete = () => {
  logLine('{yellow-fg}THE LIVE STREAM HAS ENDED');
  screen.render();
};

stream
  .then(readStream(onMessage))
  .then(onComplete);

const getMessageData = ():string => {
  // Check for game-altering conditions
  let message = '\n';
  if (chess.in_checkmate()){
    message += '{black-fg}{red-bg}CHECKMATE !!!{/red-bg}{/black-fg}'
  }
  else if (chess.in_stalemate()){
    message += '{black-fg}{#777777-bg}STALEMATE !!!{/#777777-bg}{/black-bg}'
  }
  else if (chess.in_draw()){
    message += '{black-fg}{#777777-bg}DRAW !!!{/#777777-bg}{/black-bg}'
  }
  else if (chess.in_threefold_repetition()){
    message += '{black-fg}{#777777-bg}THREEFOLD !!!{/#777777-bg}{/black-bg}'
  }
  else if (chess.insufficient_material()){
    message += '{black-fg}{#777777-bg}INSUFFICIENT_MATERIAL !!!{/#777777-bg}{/black-bg}'
  }
  else if (chess.in_check()){
    message += '{red-fg}Check!{/red-fg}';
  }
  
  if (chess.game_over()){
    message += "\n{yellow}GAME OVER{/yellow}"
  }
  log(message);
  return message + '\n\n';
}

const setMetadata = (d: {
  fen: string; 
  lm?: string; 
  players?: Player[];
  orientation?: string;
  wc?: number; 
  bc?: number; 
}) => {
  let playerContent = blackPlayer.dataForDisplay();
  playerContent +=`{yellow-fg}${d.bc}s\n`;

  playerContent += getMessageData();

  let boardContent = "\n{center}";
  boardContent += AsciiBoard.fromChessJsBoard(chess.board());
  boardBox.setContent(boardContent);

  playerContent +=`{yellow-fg}${d.wc}s\n`;
  playerContent += whitePlayer.dataForDisplay;
  playersBox.setContent(playerContent);
}

const processMove = (d: { 
  fen: string; 
  lm?: string | undefined; 
  players?: Player[] | undefined;
  orientation?: string | undefined; 
  wc?: number | undefined; 
  bc?: number | undefined; 
}) => {
  let fen = fixFen(d.fen);
  if (d.players && d.players.length > 1){
    whitePlayer = d.players[0];
    blackPlayer = d.players[1];
  }

  let move = d.lm;
  let lastChessMove = null;
  if (!move){
    chess.load(fen);
  }
  else {
    let from = move.substring(0,2);
    let to = move.substring(2, 4);
    let moves = chess.moves({verbose: true, square: from});
    for (let i=0;i< moves.length;i++){
      if (to === moves[i].to){
        lastChessMove = moves[i];
      }
    }

    if (!lastChessMove){
      logLine("{red-fg}no lastChessMove found !!!{/red-fg} loading fen...");
      chess.load(fen);
    }
    else{
      let moved = chess.move(lastChessMove, {sloppy: true});
      if (!moved){
        throw new Error ("Illegal move: " + lastChessMove.san);
      }
      if (moved.color === "b"){
        logLine(`... ${moved.san}`)
      }
      else{
        fullTurnCount+=1;
        logLine(`FT:${fullTurnCount}. ${moved.san}`);
      }
    }
  }
}

const fixFen = (fen:string): string => {
  fen = fen.trim();
    // HACK: Add missing information to the FEN received from lichess.org,
  // which is not actually a valid FEN.
  const lastFenChar = fen.charAt(fen.length - 1);
  if (lastFenChar === 'w' || lastFenChar === 'b') {
    fen = fen + " KQkq - 0 1";
  }
  else if(lastFenChar === 'R') {
    fen = fen + " w KQkq - 0 1";
  }
  return fen;
}