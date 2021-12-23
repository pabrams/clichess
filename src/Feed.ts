/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable new-cap */
/* eslint-disable import/prefer-default-export */
import * as Blessed from 'blessed';
import BlessedContrib from 'blessed-contrib';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tslib';
import * as dotenv from 'dotenv';
import fetch from 'cross-fetch';
import { Chess } from './Chess';
import { readStream } from './util';
import * as AsciiBoard from './AsciiBoard';
import { Player } from './Player';

dotenv.config();

export class Feed {
  protected whitePlayer: Player = new Player();

  protected blackPlayer: Player = new Player();

  fullTurnCount: number;

  chess: Chess;

  screen;

  grid: BlessedContrib.grid;

  boardBox: Blessed.Widgets.BoxElement;

  logBox: Blessed.Widgets.BoxElement;

  playersBox: Blessed.Widgets.BoxElement;

  feedUrl: string;

  options: any;

  command: any;

  constructor(options: any, command: any, feedUrl: string) {
    this.fullTurnCount = 0;
    this.feedUrl = feedUrl;
    this.options = options;
    this.command = command;
    this.chess = new Chess();
    this.screen = Blessed.screen();
    this.grid = new BlessedContrib.grid({ rows: 12, cols: 12, screen: this.screen });
    this.playersBox = this.grid.set(0, 0, 4, 4, Blessed.box, { tags: true });
    this.boardBox = this.grid.set(0, 4, 4, 4, Blessed.box, { tags: true });
    this.logBox = this.grid.set(0, 8, 4, 4, Blessed.box, {
      label: 'log',
      tags: true,
      alwaysScroll: true,
      scrollable: true,
      scrollbar: {
        ch: ' ',
        bg: 'red',
      },
    });
  }

  public logLine = (text: string) => {
    this.logBox.pushLine(text);
    this.logBox.setScrollPerc(100);
  };

  logDebug = (message: string) => {
    if (this.options.debug) {
      this.logLine(message);
    }
  };

  processMove = (d: {
    fen: string;
    lm?: string | undefined;
    players?: Player[] | undefined;
    orientation?: string | undefined;
    wc?: number | undefined;
    bc?: number | undefined;
  }) => {
    this.logDebug(`Processing move from: ${d}`);
    const fen = Chess.fixFen(d.fen);
    if (d.players && d.players.length > 1) {
      this.whitePlayer = new Player();
      this.blackPlayer = new Player();
    }

    const move = d.lm;
    if (!move) {
      this.chess.load(fen);
    } else {
      const moved = this.chess.makeMove(move);
      if (!moved) {
        this.chess.load(fen);
        this.logLine(`loaded FEN: ${fen}`);
      } else if (moved.color === 'b') {
        this.logLine(`..${moved?.san}`);
      } else {
        this.fullTurnCount += 1;
        this.logLine(`${this.fullTurnCount}. ${moved?.san}`);
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
    this.boardBox.setContent(boardContent);

    playerContent += `{right}{yellow-fg}${d.wc}s\n`;
    playerContent += this.whitePlayer.dataForDisplay();
    this.playersBox.setContent(playerContent);
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
        this.logLine(`{red-fg}Unknown response type: {yellow-fg}${obj.t}`);
    }
    this.screen.render();
  };

  protected onComplete = () => {
    this.logLine('{yellow-fg}THE LIVE STREAM HAS ENDED');
    this.screen.render();
  };

  public go = () => {
    this.boardBox.setContent(AsciiBoard.fromChessJsBoard(this.chess.board()));
    this.screen.key(['C-c', 'escape', 'q'], () => process.exit(0));

    const stream = fetch(this.feedUrl);
    this.fullTurnCount = 0;

    stream
      .then(readStream(this.onMessage))
      .then(this.onComplete);
  };
}
