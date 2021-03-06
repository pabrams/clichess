import { Command } from 'commander';
import fetch from 'cross-fetch';
import * as util from 'util';
import { Feed } from './Feed';
import { PuzzleDb } from './PuzzleDb';
import { Ui } from './Ui';

require('dotenv').config();

const headers = {
  Authorization: `Bearer ${process.env.lichessToken}`,
};
const puzzleHeaders = {
  Authorization: `Bearer ${process.env.lichessToken_Puzzle}`,
};
const readHeaders = {
  Authorization: `Bearer ${process.env.lichessToken_Read}`,
}
const ApiUrl = 'https://lichess.org/api';

const feedUrl = `${ApiUrl}/tv/feed`;
const cloudEvalUrl = `${ApiUrl}/cloud-eval`;
const puzzleUrl = `${ApiUrl}/user/puzzle-activity`;
const prog = new Command();

let ui = null;

prog
  .version('0.0.1')
  .description('command line client to lichess.org');

prog
  .command('puzzleActivity')
  .description('puzzle activity')
  .action(() => {
    fetch(puzzleUrl, { headers: puzzleHeaders })
      .then((response) => {
        console.log(util.inspect(response, true, 20, true));
      });
  });

prog
  .command('analyze')
  .description('analyze the position given as FEN')
  .argument(
    '<FEN>',
    'the position to analyze, in Forsythe-Edwards Notation',
  )
  .action((fen, options, command) => {
    fetch(`${cloudEvalUrl}?${fen}`)
      .then((response: { json: () => any; }) => {
        console.log('Analysis outcome response: ', response.json());
      });
  });

prog
  .command('feed')
  .description(`stream the current tv game from ${feedUrl}`)
  .action((fen, options, command) => {
    ui = new Ui;
    const feed = new Feed(options, command, feedUrl, ui);
    feed.go();
  });

prog
  .command('pm')
  .description('send a private message ')
  .argument('username', 'user name to message')
  .argument('message', 'message to send')
  .action((username:string, message:string, options, command) => {
    console.log(`Sending message '${message}' to '${username}'`);
    fetch(`https://lichess.org/inbox/${username}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: message }),
    })
      .then((response: { status: number; }) => {
        console.log('response from sending pm', Promise.resolve(response));
        if (response.status === 200) {
          console.log('Message sent.');
        } else {
          console.error(
            " - the message wasn't sent; response is ",
            Promise.resolve(response),
          );
        }
      });
  });

prog
  .command('myprofile')
  .description('display information from your profile')
  .action((options, command) => {
    genericFetch('/account', readHeaders );
  });

prog
  .command('tactics')
  .description('run the tactics trainer')
  .action((options, command) => {
    ui = new Ui;
    (new PuzzleDb(ui)).readTacticsCsv();
  });

prog
  .command('mypreferences')
  .description('display information from your preferences')
  .action((options, command) => {
    genericFetch('/account/preferences', readHeaders);
  });

prog
  .command('myemail')
  .description('display your email')
  .action((options, command) => {
    genericFetch('/account/email', readHeaders);
  });

prog
  .command('userdata')
  .description('display public data for given user')
  .addHelpText('after', 'example: npm start userdata pabrams')
  .argument('username', 'user name for desired user data')
  .action((username:string, options, command) => {
    genericFetch(`/user/${username}`, readHeaders);
  });

prog
  .command('generic-api-call')
  .description('provide some parameters to make a generic api call')
  .argument(
    '-a, --apiPath',
    'the portion of the target URL starting after the api folder ....',
  )
  .action((options, command) => {
    genericFetch(command.apiPath, readHeaders)
  });

const genericFetch = (apiPath:string, headers: any) => {
  fetch(ApiUrl + apiPath, { headers })
    .then((response: { json: () => Promise<any>; }) => {
      response.json()
        .then((jsonResponse: any) => {
          console.log('jsonResponse', jsonResponse);
        });
    }).catch((err: any) => {
      console.log('error', err);
    });
};

prog
  .option('-d, --debug', 'output debug information');

prog.parse(process.argv);

// sample FEN
// fen=rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2
