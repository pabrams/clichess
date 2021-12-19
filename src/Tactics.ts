import * as fs from 'fs';
import { parse } from 'fast-csv';
import * as path from 'path';
import * as AsciiBoard from './AsciiBoard';
import { Chess } from './Chess';
import * as Blessed from 'blessed';
import BlessedContrib from 'blessed-contrib';

interface IPuzzle{
  PuzzleId: string,
  FEN: string,
  Moves: string,
  Rating: string,
  RatingDeviation: string,
  Popularity: string,
  NbPlays: string, 
  Themes: string,
  GameUrl: string
}

class Puzzle implements IPuzzle {
  PuzzleId = '';
  FEN = '';
  Moves = '';
  Rating = '';
  RatingDeviation = '';
  Popularity = '';
  NbPlays = '';
  Themes = '';
  GameUrl = '';
}

const screen = Blessed.screen({
  smartCSR: true,
  title: 'CliChess'
});
const grid = new BlessedContrib.grid({rows: 12, cols:12, screen: screen});;
const boardBox = grid.set(0, 0, 4, 4, Blessed.box, { tags: true });
const logBox = grid.set(0,8,4,4, Blessed.box, {
  label: 'log',
  tags: true ,
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: ' ',
    bg: 'red'
  }
});

const form = grid.set(0, 4, 4, 4, Blessed.form, {
  parent: screen, 
  label: 'Move?',
  left: 'center', 
  fg: 'yellow',
  keys: true,
  vi: true,
  border: {
    type: 'line'
  },
  bg: 'black',
  autoNext: true,
});
const yourMove = Blessed.textbox({ 
  parent: form,
  name: 'yourMove',
  width: '80%',
  height: 3,
  top: 1,
  keys: true,
  mouse: true,
  input: true,
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'black'
  },
  border: {
    type: 'line'
  },
  focus: {
    fg: 'blue'
  }
});
const submit = Blessed.button({
  parent: form,
  mouse: true,
  keys: true,
  shrink: true,
  bg: 'grey',
  padding: {
      left: 1,
      right: 1
  },
  border: {
    type: 'line'
  },
  hover: {
    bg: 'red',
    fg: 'blue'
  },
  left: 1,
  bottom: 1,
  name: 'submit',
  content: 'move'
});
let chess:Chess = new Chess();
const puzzles: IPuzzle[] = [];
let correctMoves: string[] = [];
let moveCounter = 0;
let puzzleIndex = 0;

const sideToMove = (puzzle: IPuzzle) => {
  return puzzle.FEN.split(' ')[1] === 'b' ? 'BLACK': 'WHITE';
}

/**
 * When it's BLACK to move, return prefix "...", otherwise return like "1. "
 * @param sideToMove 
 * @returns 
 */
const movePrefix = (sideToMove: string) => {
  return sideToMove === 'BLACK' ? "..." : (moveCounter / 2) + ". ";
}

/**
 * PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl
 */
export const readTacticsCsv = () => {
  fs.createReadStream(path.resolve(__dirname, '../lichess_db_puzzle.csv'))
    .pipe(parse({ headers: false , maxRows: 5 }))
    .on('error', (error: any) => console.error(error))
    .on('data', (row: any) => {
        const puzzle = new Puzzle();
        puzzle.PuzzleId = row[0];
        puzzle.FEN = row[1];
        puzzle.Moves = row[2];
        puzzle.Rating = row[3];
        puzzle.RatingDeviation = row[4];
        puzzle.Popularity = row[5];
        puzzle.NbPlays = row[6];
        puzzle.Themes = row[7];
        puzzle.GameUrl = row[8];
        puzzles.push(puzzle);
    })
    .on('end', (rowCount: any) => {
        const puzzle = puzzles[puzzleIndex];
        chess.load(puzzle.FEN);
        boardBox.setContent(
          '\r\n' + AsciiBoard.fromChessJsBoard(chess.board()));
        correctMoves = puzzle.Moves.split(' ');
        setTimeout(letComputerMakeMove, 3000);
        screen.render();
    });
}
const letComputerMakeMove = () => {
  const fullMove = chess.makeMove(correctMoves[moveCounter]);
  boardBox.setContent(AsciiBoard.fromChessJsBoard(chess.board()));
  if (fullMove){
    moveCounter++;
    logLine(movePrefix(sideToMove(puzzles[0])) +  fullMove.san);
    boardBox.setContent(AsciiBoard.fromChessJsBoard(chess.board()));
    screen.render();
  }
}
form.on('submit', function (data: any) {
  if (data.yourMove === correctMoves[moveCounter]){
    const myFullMove = chess.makeMove(correctMoves[moveCounter]);
    if (myFullMove){
      moveCounter++;
      logLine(moveCounter + ". " + myFullMove.san);
      if (moveCounter >= correctMoves.length - 1){
        console.log('YOU WIN!');
      }
      else {
        letComputerMakeMove();
      }
      screen.render();
    }

  }
});
export const nextPuzzle = () => {
  readTacticsCsv();
}
submit.on('press', function() {
  form.submit();
});
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});
const logLine = (text: string) => {
  logBox.pushLine(text);
  logBox.setScrollPerc(100);
};