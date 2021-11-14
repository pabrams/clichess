
import 'tslib';
import * as dotenv from 'dotenv';
dotenv.config();
const fetch = require('node-fetch');
import { terminal as term } from 'terminal-kit';
const headers = { Authorization: 'Bearer ' + process.env.lichessToken };

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

const onMessage = (obj: any) => console.log(obj);
const onComplete = () => console.log('The stream has completed');

stream
  .then(readStream(onMessage))
  .then(onComplete);
