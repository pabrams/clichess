
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('config.json').toString());

const isLowerCase = (char: string) => {
  return char.toString() === char.toLowerCase();
}

const charIsOnBoard = (char: string) => {
    return char === 'K' 
      || char === 'k'
      || char === 'Q'
      || char === 'q'
      || char === 'R'
      || char === 'r'
      || char === 'B'
      || char === 'b'
      || char === 'N'
      || char === 'n'
      || char === 'P'
      || char === 'p'
      || char === '.'
      || char === '♚'
      || char === '♛'
      || char === '♜'
      || char === '♝'
      || char === '♞'
      || char === '♟'
}

const replaceLetterWithColoredSymbol = (letter: string, whiteSquare: boolean) => {
  let result = letter;
  let prefix = "";

  prefix += (
    whiteSquare ? 
      config.board.whiteSquareColor :
      config.board.darkSquareColor
  );

  prefix += (
    isLowerCase(letter) ?
      config.board.darkPieceColor :
      config.board.whitePieceColor
  );
  
  if (letter.toUpperCase() === 'K') result = `${prefix}♚`;
  if (letter.toUpperCase() === 'Q') result = `${prefix}♛`;
  if (letter.toUpperCase() === 'R') result = `${prefix}♜`;
  if (letter.toUpperCase() === 'B') result = `${prefix}♝`;
  if (letter.toUpperCase() === 'N') result = `${prefix}♞`;
  if (letter.toUpperCase() === 'P') result = `${prefix}♟`;
  if (letter.toUpperCase() === '.') result = `${prefix}.`;
  return result;
}

export const mapChessAscii = (ascii: string) => {
  ascii = ascii.replaceAll(' ', '');
  ascii = ascii.replaceAll('+------------------------+', ' +--------+');
  let coloredSquares = "";
  let chars = -1;
  let whiteSquare = false;

  ascii = ascii.replaceAll('abcdefgh', '  12345678');
  for (const asciiChar of ascii) {
    if (charIsOnBoard(asciiChar)){
      chars++;
      whiteSquare = (chars %2) == 0;
      if (Math.floor(chars / 8) % 2 !== 0){
        whiteSquare = !whiteSquare;
      }
      coloredSquares += replaceLetterWithColoredSymbol(asciiChar, whiteSquare);
    }
    else{
      coloredSquares += `{black-bg}{white-fg}${asciiChar}`;
    }

  }
  // don't forget to put this back where we got it
  coloredSquares = coloredSquares.replace("12345678", "abcdefgh");
  return coloredSquares;
}
