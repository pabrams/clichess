
# clichess

A terminal-based client for lichess.org, using the lichess API, and the [blessed](https://www.npmjs.com/package/blessed) and [chess.js](https://github.com/jhlywa/chess.js/) libraries, among others.
I couldn't get lichs to work, so I decided to make this, instead.

## Building and Installing

Install a reasonably recent version of Node.js.
From a command line, execute the following commands.

- `git clone https://github.com/pabrams/clichess.git`
- `cd clichess`
- `npm install`
- `npm run build` must complete without errors.

## Running, using your lichess account

In order to use most functions, you must have a lichess account, and set up an API access token, by following these steps:

- rename the clichess file "default.env" to ".env";
- log into lichess.org;
- Create an API token:
  - Click your profile name to open a dropdown menu;
  - Select "Preferences";
  - Select "API access tokens";
  - Create a new token, giving it whatever permissions you want (I just give the highest, but I guess that's bad practice);
- Go back to the .env file, select the word snickerdoodle (not including any quotes), and paste your API token, instead.

You should now have a .env file containing something like this:

`lichessToken = 'lip_WXSAbdAptdWh4T3yMHbg'`

Now you can use `npm start` to run clichess.
