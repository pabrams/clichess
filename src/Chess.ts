/** *
 * Mostly just a wrapper for chess.js... mostly
 */
import * as ChessJs from 'chess.js';

export class Chess {
  public chess;

  constructor() { this.chess = new ChessJs.Chess(); }

  public getMessageData = ():string => {
    // Check for game-altering conditions
    let message = '\n';
    if (this.chess.in_checkmate()) {
      message += '{black-fg}{red-bg}CHECKMATE !!!{/red-bg}{/black-fg}';
    } else if (this.chess.in_stalemate()) {
      message += '{black-fg}{#777777-bg}STALEMATE !!!{/#777777-bg}{/black-bg}';
    } else if (this.chess.in_draw()) {
      message += '{black-fg}{#777777-bg}DRAW !!!{/#777777-bg}{/black-bg}';
    } else if (this.chess.in_threefold_repetition()) {
      message += '{black-fg}{#777777-bg}THREEFOLD !!!{/#777777-bg}{/black-bg}';
    } else if (this.chess.insufficient_material()) {
      message += '{black-fg}{#777777-bg}INSUFFICIENT_MATERIAL !!!{/#777777-bg}{/black-bg}';
    } else if (this.chess.in_check()) {
      message += '{red-fg}Check!{/red-fg}';
    }

    if (this.chess.game_over()) {
      message += '\n{yellow}GAME OVER{/yellow}';
    }
    return `${message}\n\n`;
  };

  public static fixFen = (fen:string): string => {
    let aFen = fen.trim();
    // HACK: Add missing information to the FEN received from lichess.org,
    // which is not actually a valid FEN.
    const lastFenChar = aFen.charAt(aFen.length - 1);
    if (lastFenChar === 'w' || lastFenChar === 'b') {
      aFen += ' KQkq - 0 1';
    } else if (lastFenChar === 'R') {
      aFen += ' w KQkq - 0 1';
    }
    return aFen;
  };

  public load = (fen: string): void => {
    this.chess.load(fen);
  };

  public board = () => this.chess.board();

  public makeMove = (move: string): ChessJs.Move|null => {
    let lastChessMove = null;
    const from = move.substring(0, 2);
    const to = move.substring(2, 4);
    const moves = this.chess.moves({ verbose: true, square: from });
    for (let i = 0; i < moves.length; i++) {
      if (to === moves[i].to) {
        lastChessMove = moves[i];
      }
    }

    if (lastChessMove) {
      const lastMove = this.chess.move(lastChessMove, { sloppy: true });
      return lastMove;
    }
    return null;
  };
}
