
# clichess

A terminal-based client for lichess.org.

I couldn't get lichs to work, so I made this, instead.

## Using your lichess account

In order to use most functions, you must have a lichess account, and set up an API access token:

- rename the file "default.env" to ".env";
- log into lichess.org;
- Create an API token:
  - Click your profile name to open a dropdown menu;
  - Select "Preferences";
  - Select "API access tokens";
  - Create a new token, giving it whatever permissions you want (I just give the highest);
- Go back to the .env file, select the word snickerdoodle (not including any quotes), and paste your API token, instead.

You should now have a .env file containing something like this:

`lichessToken = 'lip_WXSAbdAptdWh4T3yMHbg'`
