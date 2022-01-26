
# clichess

A terminal-based client for lichess.org, using the lichess API, and the [blessed](https://www.npmjs.com/package/blessed) and [chess.js](https://github.com/jhlywa/chess.js/) libraries, among others.
I couldn't get lichs to work, so I decided to make this, instead.

## Building and Installing

Install a reasonably recent version of Node.js.

From a command line, execute the following commands, to run a live feed of featured players.

- `git clone https://github.com/pabrams/clichess.git`
- `cd clichess`
- `npm run feed`

The tactics command requires that you have a file called 'lichess_db_puzzle.csv.bz2' in the same folder as Clichess (parent of src directory). The file is at [https://database.lichess.org/#puzzles.](https://database.lichess.org/#puzzles.)

## Running, using your lichess account

In order to use some functions, you must have a lichess account, and set up an API access token, by following these steps:

- rename the clichess file "default.env" to ".env";
- log into lichess.org;
- Create an API token:
  - Click your profile name to open a dropdown menu;
  - Select "Preferences";
  - Select "API access tokens";
  - Create a new token, following the principle of least privileged when assigning scope;
- Go back to the .env file, select the word snickerdoodle (not including any quotes), and paste your API token, instead.

You should now have a .env file containing something like this:

`lichessToken = 'lip_whatever'`

Now you can use `npm start` to run clichess.
