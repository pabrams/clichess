import { Command } from 'commander';
import { Feed } from './Feed'
import fetch from 'cross-fetch';

const headers = { Authorization: 'Bearer ' + process.env.lichessToken };
const Api_Url = 'https://lichess.org/api';
const feed_Url = Api_Url + '/tv/feed';
const cloudEval_Url = Api_Url + '/cloud-eval';
const prog = new Command();
prog
  .version('0.0.1')
  .description('command line client to lichess.org');

prog
  .command('analyze')
  .description('analyze the position given as FEN')
  .argument(
    '<FEN>', 
    'the position to analyze, in Forsythe-Edwards Notation'
  )
  .action((fen, options, command) => {
    fetch(cloudEval_Url + '?' + fen)
      .then((reply) => {
        console.log('Analysis outcome: ', reply);
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
  .option('-d, --debug', 'output debug information');


prog.parse(process.argv);

// sample FEN
// fen=rnbqkbnr/ppp1pppp/8/3pP3/8/8/PPPP1PPP/RNBQKBNR b KQkq - 0 2

