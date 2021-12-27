export interface IPlayer {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
  dataForDisplay?: () => string;
}

export class Player implements IPlayer {
  color = 'none';

  user = { name: '', title: '', id: '' };

  rating = 0;

  public dataForDisplay = (): string => {
    const str = `{blue-fg}${this.user.name}
      \n{yellow-fg}[{red-fg}${this.user.title || 'untitled'}{/red-fg}]({green-fg}${this.rating}{/green-fg}){/yellow-fg}{/blue-fg}\n`;
    return str;
  };
}
