export interface IPuzzle{
  PuzzleId: string,
  FEN: string,
  Moves: string,
  Rating: string,
  RatingDeviation: string,
  Popularity: string,
  NbPlays: string,
  Themes: string,
  GameUrl: string
}

export class Puzzle implements IPuzzle {
  PuzzleId = '';

  FEN = '';

  Moves = '';

  Rating = '';

  RatingDeviation = '';

  Popularity = '';

  NbPlays = '';

  Themes = '';

  GameUrl = '';
}
