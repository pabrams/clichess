import { PieceType } from 'chess.js';

import fs from 'fs';
const config = JSON.parse(fs.readFileSync('config.json').toString());
const isEven = (x: number):boolean => x % 2 === 0;

export const fromChessJsBoard = (board: 
    ({ type: PieceType; color: "b" | "w"; } | null)[][]
  ) => {
  let boardAscii = "";
  for (let row = 0; row < 8; row++){
    for (let col = 0; col < 8; col++){

      if(col === 0) {
        boardAscii += "{black-bg}{white-fg}\n"
      }

      const whiteSquare = isEven(row + col);

      boardAscii +=
        whiteSquare
        ? config.board["whiteSquareColor"]
        : config.board["darkSquareColor"]

      const piece = board[row][col];
      piece // is there a piece here?
        ? ( boardAscii += 
          // add piece color and symbol
          ( 
            piece.color === 'w'
            ? config.board["whitePieceColor"]
            : config.board["blackPieceColor"]
          )
          + config.board[piece.type.toUpperCase()]
        )
        // no piece here, so add empty square symbol and fg color
        : ( boardAscii += 
            ( 
              whiteSquare
                ? config.board["emptyWhiteSquareFgColor"]
                : config.board["emptyBlackSquareFgColor"]
            )
          + config.board["emptySquareChar"]
        );
    }
  }
  return boardAscii + '{white-fg}{black-bg}';
}
