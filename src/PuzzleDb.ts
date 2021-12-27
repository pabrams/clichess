import * as fs from 'fs';
import { parse } from 'fast-csv';
import * as path from 'path';
import { Puzzle } from './Puzzle';
import { Ui } from './Ui';

export class PuzzleDb{
  puzzles: any[] = [];
  puzzleIndex = 0;
  ui: Ui;

  constructor (ui: Ui) { 
    this.ui = ui;
    this.ui.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    this.ui.useInput(true);
  }

  /**
   * PuzzleId,FEN,Moves,Rating,RatingDeviation,Popularity,NbPlays,Themes,GameUrl
   */
  public readTacticsCsv = () => {
    fs.createReadStream(path.resolve(__dirname, '../lichess_db_puzzle.csv'))
      .pipe(parse({ headers: false, maxRows: 5 }))
      .on('error', (error: any) => { throw error; })
      .on('data', (row: any) => {
        this.puzzles.push(row);
      })
      .on('end', () => {
        this.nextPuzzle();
      });
  };

  public nextPuzzle = () => {
    this.ui.logLine('nextPuzzle - index: ' + this.puzzleIndex);
    const puz = new Puzzle(
      this.puzzles[this.puzzleIndex],
      this.ui,
      this.nextPuzzle
    );
    puz.startGame(this.nextPuzzle);
    this.puzzleIndex += 1;
  }
}