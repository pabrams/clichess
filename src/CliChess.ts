import { Command } from 'commander';
import { Feed } from './Feed';
import fetch from 'cross-fetch';
require('dotenv').config();
import * as util from 'util';
import * as Tactics from './Tactics';

const headers = { 
  'Authorization': 'Bearer ' + process.env.lichessToken
};
const pmHeaders = {
  'Authorization': 'Bearer ' + process.env.pmScope
};
const puzzleHeaders = { 
  'Authorization': 'Bearer ' + process.env.puzzleScope
};

const Api_Url = 'https://lichess.org/api';

const feed_Url = Api_Url + '/tv/feed';
const cloudEval_Url = Api_Url + '/cloud-eval';
const puzzle_Url = Api_Url + '/user/puzzle-activity';
const prog = new Command();

prog
  .version('0.0.1')
  .description('command line client to lichess.org');

prog
  .command('puzzleActivity')
  .description('puzzle activity')
  .action(() => {
    fetch(puzzle_Url, {headers: puzzleHeaders})
      .then(response => {
        console.log(util.inspect(response, true, 20, true));
      })
  }) 
   
prog
  .command('analyze')
  .description('analyze the position given as FEN')
  .argument(
    '<FEN>', 
    'the position to analyze, in Forsythe-Edwards Notation'
  )
  .action((fen, options, command) => {
    fetch(cloudEval_Url + '?' + fen)
      .then((response: { json: () => any; }) => {
        console.log('Analysis outcome response: ', response.json());
      })
  });

prog
  .command('feed')
  .description('stream the current tv game from ' + feed_Url)
  .action((fen, options, command) => {
    const feed = new Feed(options, command, feed_Url);
    feed.go();
  });
  
prog
  .command('pm')
  .description('send a private message ')
  .argument('username', 'user name to message')
  .argument('message', 'message to send' )
  .action((username:string, message:string, options, command) => {
    console.log("Sending message '" + message + "' to '" + username + "'");
    fetch('https://lichess.org/inbox/' + username, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({text: message})
    })
    .then((response: { status: number; }) => {
      console.log("response from sending pm", Promise.resolve(response));
      if (response.status === 200) {
        console.log("Message sent.");
      }
      else {
        console.error(
          " - the message wasn't sent; response is ",
          Promise.resolve(response)
        );
      }
    })
  });

prog
  .command('myprofile')
  .description('display information from your profile')
  .action((options, command) => {
    genericFetch ("/account");
  });

prog
  .command('tactics')
  .description('run the tactics trainer')
  .action((options, command) => {
    Tactics.nextPuzzle();
  });

prog
  .command('mypreferences')
  .description('display information from your preferences')
  .action((options, command) => {
    genericFetch ("/account/preferences");
  });

prog
  .command('generic-api-call')
  .description('provide some parameters to make a generic api call')
  .argument(
    '-a, --apiPath', 
    'the portion of the target URL starting after the api folder ....'
  )
  .action((options, command) => {
    genericFetch (command.apiPath);
  })

const genericFetch = (apiPath:string) => {
  fetch(Api_Url + apiPath, { headers: headers })
  .then((response: { json: () => Promise<any>; }) => {
    response.json()
    .then((jsonResponse: any) => {
      console.log("jsonResponse", jsonResponse);
    })
  }).catch((err: any) => {
    console.log("error", err);
  });
};

prog
  .option('-d, --debug', 'output debug information');


prog.parse(process.argv);

// sample FEN
// fen=rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2

