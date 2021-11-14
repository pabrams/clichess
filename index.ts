
import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
const fetch = require('node-fetch');
import { terminal as term } from 'terminal-kit';
import { Chess } from 'chess.js';
const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

interface Player {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
}

let chess = new Chess();
term.grey(chess.ascii());
let accountPromise = fetch('https://lichess.org/api/account', { headers })
  .then((res: { json: () => any; }) => res.json())
  .then(console.log);

accountPromise.then(() => {
  term("\n^bAnd now, let's see what's on TV^r...\n");
});

const readStream = (processLine: { (obj: any): void; (arg0: any): void; }) => (response: { 
  body: { 
    on: (arg0: string, arg1: { (v: any): void; }) => void;
  }; 
}) => {
  const matcher = /\r?\n/;
  const decoder = new TextDecoder();
  let buf: string|undefined = '';
  return new Promise<void>((resolve, fail) => {
    response.body.on('data', (v) => {
      const chunk = decoder.decode(v, { stream: true });
      buf += chunk;
      if (buf){
        const parts = buf.split(matcher);
        buf = parts.pop();
        for (const i of parts.filter(p => p)) processLine(JSON.parse(i));
      }
    });
    response.body.on('end', () => {
      if (buf && buf.length > 0) processLine(JSON.parse(buf));
      resolve();
    });
    response.body.on('error', fail);
  });
};

const stream = fetch('https://lichess.org/api/tv/feed');

let whitePlayer: Player, blackPlayer: Player;
const onMessage = (obj: any) => {
  let fen : string = obj.d.fen.trim();
  let fenLoaded: boolean = false;
  switch (obj.t){
    case 'featured': 
      term('^BFEATURED LIVE STREAM\n\r');
      // fall through...
    case 'fen':
      let lastMove = obj.d.lm;
      
      // Add missing information to the FEN received from lichess.org,
      // which is not actually a valid FEN.
      const lastFenChar = fen.charAt(fen.length - 1);
      if (lastFenChar === 'w' || lastFenChar === 'b') {
        fen = fen + " KQkq - 0 1";
      }
      else if(lastFenChar === 'R') {
        fen = fen + " w KQkq - 0 1";
      }
      if (chess.history().length > 0) {
        // make the last move...
        let moved = chess.move(lastMove);
        if (!moved){
          term(`^rThe move ^y${lastMove} ^rreceived from ^blichess.org ^ris invalid from position ^G${fen} !`)
          fenLoaded = chess.load(fen);
        }
      }
      else {
        // There is no history available, so just load the FEN.
        fenLoaded = chess.load(fen);
      }
      term(chess.ascii());
      if (obj.d.players && obj.d.players.length > 0){
        whitePlayer = obj.d.players[0];
        blackPlayer = obj.d.players[1];
      }
      term(`^W${
        whitePlayer
          ? whitePlayer.user.name + 
            ' ^y[^W' + (whitePlayer.user.title||'untitled') + '^y] ' + 
            ' ^y(^G' + whitePlayer.rating + '^y)'
          : 'White'
      } ^gclock: ^W${obj.d.wc}\n\r`);
      term(`^W${
        blackPlayer
          ? blackPlayer.user.name + 
            ' ^y[^r' + (blackPlayer.user.title||'untitled') + '^y] ' + 
            ' ^y(^G' + blackPlayer.rating + '^y)'
          : 'Black'
      } ^gclock: ^w${obj.d.bc}\n\r\n\r`);
      break;
    default: term(`^rUnknown response type: ^w${obj.t}`);
  }
}
const onComplete = () => term('^YTHE LIVE STREAM HAS ENDED');

stream
  .then(readStream(onMessage))
  .then(onComplete);

