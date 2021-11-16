
import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
const fetch = require('node-fetch');
import { Chess } from 'chess.js';
import { readStream } from './util';
const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

interface Player {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
}

let chess = new Chess();
console.log(chess.ascii());
let accountPromise = fetch('https://lichess.org/api/account', { headers })
  .then((res: { json: () => any; }) => res.json())
  .then(console.log);

accountPromise.then(() => {
  console.log("\n{yellow}And now, let's see what's on TV{red}...\n");
});

const stream = fetch('https://lichess.org/api/tv/feed');

let whitePlayer: Player, blackPlayer: Player;
const onMessage = (obj: any) => {
  let fen : string = obj.d.fen.trim();
  let fenLoaded: boolean = false;
  switch (obj.t){
    case 'featured': 
      console.log('{blue}FEATURED LIVE STREAM\n\r');
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
          console.log(`{red}The move {yellow}${lastMove}{/yellow}received from {blue}lichess.org {/blue}is invalid from position {green}${fen} {/green} !`)
          fenLoaded = chess.load(fen);
        }
      }
      else {
        // There is no history available, so just load the FEN.
        fenLoaded = chess.load(fen);
      }
      console.log(chess.ascii());
      if (obj.d.players && obj.d.players.length > 0){
        whitePlayer = obj.d.players[0];
        blackPlayer = obj.d.players[1];
      }
      console.log(`{white}${
        whitePlayer
          ? whitePlayer.user.name + 
            ' {yellow}[{white}' + (whitePlayer.user.title||'untitled') + '{/white}] ' + 
            ' {/yellow}({green}' + whitePlayer.rating + '{/green})'
          : 'White'
      } {green}clock: {white}${obj.d.wc}\n\r`);
      console.log(`{white}${
        blackPlayer
          ? blackPlayer.user.name + 
            ' {yellow}[{red}' + (blackPlayer.user.title||'untitled') + '{/red}] ' + 
            ' {yellow}({green}' + blackPlayer.rating + '{/green})'
          : 'Black'
      } {green}clock: {white}${obj.d.bc}\n\r\n\r`);
      break;
    default: console.log(`{red}Unknown response type: {yellow}${obj.t}`);
  }
}
const onComplete = () => console.log('{yellow}THE LIVE STREAM HAS ENDED');

stream
  .then(readStream(onMessage))
  .then(onComplete);

