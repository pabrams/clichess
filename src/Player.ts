
interface IPlayer {
  color: string;
  user: { name: string, title: string, id: string };
  rating: number
  dataForDisplay?: () => string;
}

class Player implements IPlayer{
  color = 'b';
  user = {name: 'none', title: 'none', id: 'none'};
  rating = 800;  
  public dataForDisplay = (): string => {
    return  `{blue-fg}
        ${this.user.name}{yellow-fg}[{red-fg}
        ${(this.user.title||'untitled')}
        {/red-fg}]{green-fg}${this.rating}
        {/green-fg}{/yellow-fg}{/blue-fg}`
  }
  

}