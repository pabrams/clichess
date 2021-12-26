import { Move, ShortMove, Square } from 'chess.js';
import { ChessGame } from './Chess';
import { Ui } from './Ui';
import { fromChessJsBoard } from './AsciiBoard';

export interface IPuzzle{
  PuzzleId: string,
  FEN: string,
  Moves: string,
  Rating: string,
  RatingDeviation: string,
  Popularity: string,
  NbPlays: string,
  Themes: string,
  GameUrl: string,
}

export class Puzzle implements IPuzzle {
  PuzzleId = '';
  FEN = '';
  Moves = '';
  Rating = '';
  RatingDeviation = '';
  Popularity = '';
  NbPlays = '';
  Themes = '';
  GameUrl = '';
  ui:Ui;

  /** 
   * The current index into Moves array
   */
  currentMoveIndex = 0;

  /**
   * Each puzzle has its own game
   */
  chess = new ChessGame();

  constructor (
    row: string[],
    ui: Ui,
    endOfGameCallback: () => void
  ) {
    this.ui = ui;
    this.PuzzleId = row[0];
    this.FEN = row[1];
    this.Moves = row[2];
    this.Rating = row[3];
    this.RatingDeviation = row[4];
    this.Popularity = row[5];
    this.NbPlays = row[6];
    this.Themes = row[7];
    this.GameUrl = row[8];
    this.ui.yourMove.key('enter', (ch, key) => {
      this.onSubmit(this.ui.yourMove.getText(), endOfGameCallback)
    });
  }

  // we already have the sequence of correct moves as 
  // space-separated string, from the Puzzle data,
  // so now translate that from string to Move[]
  correctMoveSequence = (): Move[] => {
    let moves: Move[] = [];
    for (const s of this.Moves.split(' ')){
      let move: ShortMove = {
        from: s.substring(0, 2) as Square,
        to: s.substring(2) as Square
      };
      let theMove = this.chess.moves().find(
        element => element.from.toString() == move.from.toString() 
                    && element.to.toString() == move.to.toString()
      );
      theMove && moves.push(theMove);
    }
    return moves;
  }

  public onSubmit = (
    yourMove: string, 
    endOfGameCallback: () => void
  ) => {
    this.ui.logLine(`yourMove: ${yourMove}`);
    const correctMove = this.correctMoveSequence()[0];
    // check that the input move matches the correct move's san 
    // or its fromTo string.
    if (
      correctMove && yourMove === correctMove.san
      || 
      (
        correctMove?.from === yourMove.substring(0, 2) as Square
        && correctMove?.to === yourMove.substring(2) as Square)
    ) {
      this.doMove(correctMove, true); // increments currentMoveIndex
      this.checkForEndOfGame(endOfGameCallback);
      this.ui.statusLine("Waiting for computer move");
      this.ui.screen.render();
      this.computerMove(endOfGameCallback);
    } else {
      this.ui.statusLine(`{red-fg}${yourMove} is incorrect. Try again.`);
    }
  }

  protected checkForEndOfGame = (endOfGameCallback: () => void) => {
    if (this.correctMoveSequence().length === 0) {
      if (this.chess.game_is_over()){
        const msg = this.chess.getMessageData();
        this.ui.logLine(msg);
        this.ui.statusLine(msg);
      }
      this.ui.logLine("Loading next puzzle...");
      endOfGameCallback();
      return;
    }
  }

  public startGame = (endOfGameCallback: () => void) => {
    this.chess = new ChessGame();
    this.chess.load(this.FEN);
    this.ui.boardBox.setContent(
      `\r\n${fromChessJsBoard(this.chess.board())}`,
    );
      this.ui.statusLine(`Waiting for ${this.chess.toMove()} to move...`);
      this.computerMove(endOfGameCallback);
  }

  protected computerMove = (endOfGameCallback: () => void) => {
    const computerMove = this.correctMoveSequence()[0];
    this.doMove(computerMove, false);
    this.checkForEndOfGame(endOfGameCallback);
    this.ui.statusLine('Your move...');
    this.ui.yourMove.focus();
    this.ui.yourMove.clearValue();
    this.ui.screen.render();
  }

  protected doMove = (move: Move, isPlayer: boolean) => {
    const fullMove = this.chess.makeMove(move);
    if (fullMove) {
      const movedStringPrefix = isPlayer ? 'You played ' : 'Opponent played ';
      this.ui.statusLine(movedStringPrefix + fullMove.san);
      this.ui.boardBox.setContent(fromChessJsBoard(this.chess.board()));
      this.currentMoveIndex += 1;
      if (isPlayer) {
        this.ui.statusLine('{red-fg}Correct{yellow-fg}!{/yellow-fg}{/red-fg}');
      }
    } else {
      throw new Error(`Bad move: ${move}`);
    }
  };
}
