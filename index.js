"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
require("tslib");
const dotenv = (0, tslib_1.__importStar)(require("dotenv"));
dotenv.config();
const fetch = require('node-fetch');
const terminal_kit_1 = require("terminal-kit");
const headers = { Authorization: 'Bearer ' + process.env.lichessToken };
let accountPromise = fetch('https://lichess.org/api/account', { headers })
    .then((res) => res.json())
    .then(console.log);
accountPromise.then(() => {
    (0, terminal_kit_1.terminal)("\n^bAnd now, let's see what's on TV^r...\n");
});
const readStream = (processLine) => (response) => {
    const matcher = /\r?\n/;
    const decoder = new TextDecoder();
    let buf = '';
    return new Promise((resolve, fail) => {
        response.body.on('data', (v) => {
            const chunk = decoder.decode(v, { stream: true });
            buf += chunk;
            if (buf) {
                const parts = buf.split(matcher);
                buf = parts.pop();
                for (const i of parts.filter(p => p))
                    processLine(JSON.parse(i));
            }
        });
        response.body.on('end', () => {
            if (buf && buf.length > 0)
                processLine(JSON.parse(buf));
            resolve();
        });
        response.body.on('error', fail);
    });
};
const stream = fetch('https://lichess.org/api/tv/feed');
const onMessage = (obj) => console.log(obj);
const onComplete = () => console.log('The stream has completed');
stream
    .then(readStream(onMessage))
    .then(onComplete);
