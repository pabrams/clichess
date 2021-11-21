
export interface IPlayer {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
  dataForDisplay?: () => string;
}

export class Player implements IPlayer{
  constructor(
    public color: string,
    public user: { name: string, title: string, id: string },
    public  rating: number
  ) {}

  public dataForDisplay = (): string => {
    const str = `{blue-fg}${this.user.name}{yellow-fg}[{red-fg}${this.user.title||'untitled'}
      {/red-fg}]{green-fg}${this.rating}
      {/green-fg}{/yellow-fg}{/blue-fg}`;
    return str;
  }
}  