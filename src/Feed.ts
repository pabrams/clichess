
import fetch from 'cross-fetch';
import * as Blessed from 'blessed';
import BlessedContrib from 'blessed-contrib';
import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
import { Chess } from './Chess';
import { readStream } from './util';
import * as AsciiBoard from './AsciiBoard';
import { Player } from './Player';

export class Feed {
  protected whitePlayer: Player = new Player('w', {name:'name', title: 'title', id: 'id'}, 800);
  protected blackPlayer: Player = new Player('w', {name:'name', title: 'title', id: 'id'}, 800);
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
    this.grid = new BlessedContrib.grid({rows: 12, cols:12, screen: this.screen});

    this.playersBox = this.grid.set(0,0,4,4, Blessed.box, { tags: true });
    this.boardBox = this.grid.set(0,4,4,4, Blessed.box, { tags: true });
    this.logBox = this.grid.set(0,8,4,4, Blessed.box, { 
      label: 'log', 
      tags: true ,
      alwaysScroll: true,
      scrollable: true,
      scrollbar: {
        ch: ' ',
        bg: 'red'
      }
    });
  }

  logDebug = (message: string, ...args:any) => {
    if (this.options.debug){
      console.log(message, args);
    }
  }

  processMove = (d: { 
    fen: string; 
    lm?: string | undefined; 
    players?: Player[] | undefined;
    orientation?: string | undefined; 
    wc?: number | undefined; 
    bc?: number | undefined; 
  }) => {
    this.logDebug("Processing move from: ", d);
    let fen = this.fixFen(d.fen);
    if (d.players && d.players.length > 1){
      this.whitePlayer = new Player(d.players[0].color, d.players[0].user, d.players[0].rating);
      this.blackPlayer = new Player(d.players[1].color, d.players[1].user, d.players[1].rating);
    }

    let move = d.lm;
    if (!move){
      this.chess.load(fen);
    }
    else {
      let moved = this.chess.makeMove(move);
      if (!moved){
        this.chess.load(fen);
        this.logLine("loaded FEN: " + fen);
      }
      else{
        if (moved.color === "b"){
          this.logLine(".." + moved?.san);
        }
        else{
          this.fullTurnCount += 1;
          this.logLine(this.fullTurnCount + ". " + moved?.san);
        }
      }
    }
  }

  public logLine = (text: string) => {
    this.logBox.pushLine(text);
    this.logBox.setScrollPerc(100);
  };

  protected setMetadata = (d: {
    fen: string; 
    lm?: string; 
    players?: Player[];
    orientation?: string;
    wc?: number; 
    bc?: number; 
  }) => {
    let playerContent = "{right}" + this.blackPlayer.dataForDisplay();
    playerContent +=`{yellow-fg}${d.bc}s\n`;

    playerContent += this.chess.getMessageData();

    let boardContent = "\n{center}";
    boardContent += AsciiBoard.fromChessJsBoard(this.chess.board());
    this.boardBox.setContent(boardContent);

    playerContent +=`{right}{yellow-fg}${d.wc}s\n`;
    playerContent += this.whitePlayer.dataForDisplay();
    this.playersBox.setContent(playerContent);
  }

  protected fixFen = (fen:string): string => {
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
    switch (obj.t){
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
    this.screen.key(["C-c", "escape", "q"], () => {
      return process.exit(0);
    });

    const stream = fetch(this.feedUrl);
    this.fullTurnCount = 0;

    stream
      .then(readStream(this.onMessage))
      .then(this.onComplete);
  }
}