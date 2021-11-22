import { Command } from 'commander';
import { Feed } from './Feed'

const headers = { Authorization: 'Bearer ' + process.env.lichessToken };
const feed_Url = 'https://lichess.org/api/tv/feed';
const prog = new Command();
prog
  .version('0.0.1')
  .description('command line client to lichess.org')
  .option('-n, --name <name>', 'your name', 'pabrams')
  .option('-d, --debug', 'output debug information')
  .command('feed')
  .description('stream the current tv game from ' + feed_Url)
  .action((options, command) => {
    const feed = new Feed(options, command, feed_Url);
    feed.go();
  });

prog.parse(process.argv);



