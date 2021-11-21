/***
 * Mostly just a wrapper for chess.js... mostly
 */
import * as ChessJs from 'chess.js';

export class Chess{
  public chess;
  constructor(){ this.chess = new ChessJs.Chess(); }
  public getMessageData = ():string => {
    // Check for game-altering conditions
    let message = '\n';
    if (this.chess.in_checkmate()){
      message += '{black-fg}{red-bg}CHECKMATE !!!{/red-bg}{/black-fg}'
    }
    else if (this.chess.in_stalemate()){
      message += '{black-fg}{#777777-bg}STALEMATE !!!{/#777777-bg}{/black-bg}'
    }
    else if (this.chess.in_draw()){
      message += '{black-fg}{#777777-bg}DRAW !!!{/#777777-bg}{/black-bg}'
    }
    else if (this.chess.in_threefold_repetition()){
      message += '{black-fg}{#777777-bg}THREEFOLD !!!{/#777777-bg}{/black-bg}'
    }
    else if (this.chess.insufficient_material()){
      message += '{black-fg}{#777777-bg}INSUFFICIENT_MATERIAL !!!{/#777777-bg}{/black-bg}'
    }
    else if (this.chess.in_check()){
      message += '{red-fg}Check!{/red-fg}';
    }
    
    if (this.chess.game_over()){
      message += "\n{yellow}GAME OVER{/yellow}"
    }
    return message + '\n\n';
  }

  public load = (fen: string): void => {
    this.chess.load(fen);
  }

  public board = () => this.chess.board();
  public makeMove = (move: string): ChessJs.Move|null => {
    let lastChessMove = null;
    let from = move.substring(0,2);
    let to = move.substring(2,4);
    let moves = this.chess.moves({verbose: true, square: from});
    for (let i=0;i< moves.length;i++){
      if (to === moves[i].to){
        lastChessMove = moves[i];
      }
    }

    // if (!lastChessMove){
    //   logLine("{red-fg}no lastChessMove found !!!{/red-fg} loading fen...");
    //   this.chess.load(fen);
    // }
    // else{
    if (lastChessMove){
      return this.chess.move(lastChessMove, {sloppy: true});
    }
    return null;

    // }
  }
}