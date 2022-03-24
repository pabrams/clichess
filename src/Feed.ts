import 'tslib';
import * as dotenv from 'dotenv';
import fetch from 'cross-fetch';
import { ChessGame } from './Chess';
import { readStream } from './Util';
import * as AsciiBoard from './AsciiBoard';
import { Player } from './Player';
import { Ui } from './Ui';
dotenv.config();

export class Feed {
  protected whitePlayer: Player = new Player();
  protected blackPlayer: Player = new Player();
  fullTurnCount: number;
  chess: ChessGame;
  feedUrl: string;
  options: any;
  command: any;
  ui;

  constructor(options: any, command: any, feedUrl: string, ui: Ui) {
    this.fullTurnCount = 0;
    this.feedUrl = feedUrl;
    this.command = command;
    this.chess = new ChessGame();
    this.ui = ui;
    this.ui.useInput(false);
  }

  protected processMove = (d: {
    fen: string;
    lm?: string | undefined;
    players?: Player[] | undefined;
    orientation?: string | undefined;
    wc?: number | undefined;
    bc?: number | undefined;
  }) => {
    const fen = ChessGame.fixFen(d.fen);
    if (d.players && d.players.length > 1) {
      this.whitePlayer = new Player();
      this.whitePlayer.user = d.players[0].user;
      this.blackPlayer = new Player();
      this.blackPlayer.user = d.players[1].user;
    }

    const move = d.lm;
    if (!move) {
      this.chess.load(fen);
    } else {
      const moved = this.chess.makeMove(move);
      if (!moved) {
        this.chess.load(fen);
        this.ui.logLine(`loaded FEN: ${fen}`);
      } else if (moved.color === 'b') {
        this.ui.logLine(`..${moved?.san}`);
      } else {
        this.fullTurnCount += 1;
        this.ui.logLine(`${this.fullTurnCount}. ${moved?.san}`);
      }
    }
  };

  protected setMetadata = (d: {
    fen: string;
    lm?: string;
    players?: Player[];
    orientation?: string;
    wc?: number;
    bc?: number;
  }) => {
    let playerContent = `{right}${this.blackPlayer.dataForDisplay()}`;
    playerContent += `{yellow-fg}${d.bc}s\n`;

    playerContent += this.chess.getMessageData();

    let boardContent = '\n{center}';
    boardContent += AsciiBoard.fromChessJsBoard(this.chess.board());
    this.ui.boardBox.setContent(boardContent);

    playerContent += `{right}{yellow-fg}${d.wc}s\n`;
    playerContent += this.whitePlayer.dataForDisplay();
    this.ui.playersBox.setContent(playerContent);
  };

  protected onMessage = (obj: {
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
    switch (obj.t) {
      case 'featured':
        this.fullTurnCount = 1;
        // fall through...
      case 'fen':
        this.processMove(obj.d);
        this.setMetadata(obj.d);
        break;
      default:
        this.ui.logLine(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
    }
    this.ui.screen.render();
  };

  protected onComplete = () => {
    this.ui.logLine('{yellow-fg}THE LIVE STREAM HAS ENDED');
    this.ui.screen.render();
  };

  public go = () => {
    this.ui.boardBox.setContent(AsciiBoard.fromChessJsBoard(this.chess.board()));
    this.ui.screen.key(['C-c', 'escape', 'q'], () => process.exit(0));

    const stream = fetch(this.feedUrl);
    this.fullTurnCount = 0;

    stream
      .then(readStream(this.onMessage))
      .then(this.onComplete);
  };
}
