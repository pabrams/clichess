import * as fs from 'fs';
import { parse } from 'fast-csv';
import * as path from 'path';
import * as Blessed from 'blessed';
import BlessedContrib from 'blessed-contrib';
import * as AsciiBoard from './AsciiBoard';
import { Chess } from './Chess';

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
let toMove = 'WHITE';
const screen = Blessed.screen({
  smartCSR: true,
  title: 'CliChess',
});
const grid = new BlessedContrib.grid({ rows: 12, cols: 12, screen });
const boardBox = grid.set(0, 0, 4, 4, Blessed.box, { tags: true });
const colorToPlayBox = Blessed.text({
  tags: true,
  content: toMove,
});
const logBox = grid.set(0, 8, 4, 4, Blessed.box, {
  label: 'log',
  tags: true,
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: ' ',
    bg: 'red',
  },
});

const form = grid.set(0, 4, 4, 4, Blessed.form, {
  parent: screen,
  label: 'Move?',
  top: 'center',
  left: 'center',
  fg: 'yellow',
  keys: true,
  vi: true,
  border: {
    type: 'line',
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
  left: 1,
  keys: true,
  mouse: true,
  input: true,
  inputOnFocus: true,
  tags: true,
  style: {
    fg: 'white',
    bg: 'black',
  },
  border: {
    type: 'line',
  },
  focus: {
    fg: 'blue',
  },
});
const submit = Blessed.button({
  parent: form,
  mouse: true,
  keys: true,
  shrink: true,
  bg: 'grey',
  padding: {
    left: 1,
    right: 1,
  },
  border: {
    type: 'line',
  },
  style: {
    border: {
      type: 'line',
      fg: 'green',
    },
    hover: {
      bg: 'darkgreen',
      fg: 'blue',
    },
  },
  left: 1,
  bottom: 1,
  height: 3,
  name: 'submit',
  content: 'submit',
});
const statusBox = grid.set(4, 0, 2, 12, Blessed.box, {
  label: 'status',
  tags: true,
  alwaysScroll: true,
  scrollable: true,
  scrollbar: {
    ch: ' ',
    bg: 'red',
  },
});
const chess:Chess = new Chess();
const puzzles: IPuzzle[] = [];
let correctMoves: string[] = [];
let moveCounter = 0;
const puzzleIndex = 0;

const sideToMove = (puzzle: IPuzzle) => {
  const blackOrWhite = (puzzle.FEN.split(' ')[1] === 'b') ? 'BLACK' : 'WHITE';
  return blackOrWhite;
};
const toggleSideToMove = () => {
  if (toMove === 'BLACK') {
    toMove = 'WHITE';
    colorToPlayBox.setContent('WHITE');
  } else {
    toMove = 'BLACK';
    colorToPlayBox.setContent('BLACK');
  }
};
const blackToMove = () => toMove === 'BLACK';

/**
 * When it's BLACK to move, return prefix "...", otherwise return like "1. "
 * @param sideToMove
 * @returns
 */
const movePrefix = (sideToMove: string) => (sideToMove === 'BLACK' ? ' ..' : `${moveCounter / 2}. `);

/**
 * PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl
 */
export const readTacticsCsv = () => {
  fs.createReadStream(path.resolve(__dirname, '../lichess_db_puzzle.csv'))
    .pipe(parse({ headers: false, maxRows: 5 }))
    .on('error', (error: any) => console.error(error))
    .on('data', (row: any) => {
      const puzzle = new Puzzle();
      puzzle.PuzzleId = row[0];
      puzzle.FEN = row[1];
      puzzle.Moves = row[2];
      puzzle.Rating = row[3];
      puzzle.RatingDeviation = row[4];
      puzzle.Popularity = row[5]; e;
      puzzle.NbPlays = row[6];
      puzzle.Themes = row[7];
      puzzle.GameUrl = row[8];
      puzzles.push(puzzle);
    })
    .on('end', (rowCount: any) => {
      const puzzle = puzzles[puzzleIndex];
      chess.load(puzzle.FEN);
      boardBox.setContent(
        `\r\n${AsciiBoard.fromChessJsBoard(chess.board())}`,
      );
      correctMoves = puzzle.Moves.split(' ');
      setTimeout(letComputerMakeMove, 3000);
      toMove = sideToMove(puzzle);
      statusLine(`Waiting for ${toMove} to move...`);
      screen.render();
    });
};
const onEveryMove = (move: string, isPlayer: boolean) => {
  const fullMove = chess.makeMove(move);
  if (fullMove) {
    const moveString = movePrefix(toMove) + fullMove.san;
    logLine(moveString);

    const movedStringPrefix = isPlayer ? 'You played ' : 'Opponent played ';
    statusLine(movedStringPrefix + moveString);

    boardBox.setContent(AsciiBoard.fromChessJsBoard(chess.board()));
    screen.focusPush(yourMove);
    toggleSideToMove();
    moveCounter++;
    if (!isPlayer) {
      statusLine('Your move...');
    } else {
      statusLine('{red-fg}Correct{yellow-fg}!{/yellow-fg}{/red-fg}');
    }
  }
};
const letComputerMakeMove = () => {
  onEveryMove(correctMoves[moveCounter], false);
  screen.render();
};
form.on('submit', (data: any) => {
  if (data.yourMove === correctMoves[moveCounter]) {
    onEveryMove(correctMoves[moveCounter], true);
    if (moveCounter >= correctMoves.length - 1) {
      statusLine('{blue-fg}YOU WIN!');
    } else {
      letComputerMakeMove();
    }
    screen.render();
  } else {
    statusLine(`{red-fg}${data.yourMove} is incorrect. Try again.`);
    screen.focusPush(yourMove);
    yourMove.clearValue();
  }
});
export const nextPuzzle = () => {
  readTacticsCsv();
};
submit.on('press', () => {
  form.submit();
});
screen.key(['escape', 'q', 'C-c'], (ch, key) => process.exit(0));
const logLine = (text: string) => {
  logBox.pushLine(text);
  logBox.setScrollPerc(100);
};
const statusLine = (text: string) => {
  statusBox.pushLine(text);
  statusBox.setScrollPerc(100);
};
