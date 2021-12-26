import * as Blessed from 'blessed';
import BlessedContrib from 'blessed-contrib';

export class Ui {
  screen: Blessed.Widgets.Screen;
  grid: BlessedContrib.grid;
  playersBox: Blessed.Widgets.BoxElement;
  boardBox: Blessed.Widgets.BoxElement;
  logBox: Blessed.Widgets.BoxElement;
  statusBox: Blessed.Widgets.BoxElement;
  form: Blessed.Widgets.FormElement<any>;
  yourMove: Blessed.Widgets.TextboxElement;

  constructor() {
    this.screen = Blessed.screen();
    this.grid = new BlessedContrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.playersBox = this.grid.set(0, 4, 4, 4, Blessed.box, { tags: true });

    this.boardBox = this.grid.set(0, 0, 4, 4, Blessed.box, { 
      tags: true,
      label: 'board'
    });

    this.logBox = this.grid.set(0, 8, 4, 4, Blessed.box, {
      label: 'log',
      tags: true,
      alwaysScroll: true,
      scrollable: true,
      scrollbar: {
        ch: ' ',
        bg: 'red',
      },
    })

    this.statusBox = this.grid.set(4, 0, 4, 12, Blessed.box, { 
      label: 'status',
      tags: true,
      alwaysScroll: true,
      scrollable: true,
      scrollbar: {
        ch: ' ',
        bg: 'red',
      },
    });

    this.form = this.grid.set(0, 4, 4, 4, Blessed.form, {
      parent: this.screen,
      label: 'Move?',
      top: 'center',
      left: 'center',
      fg: 'yellow',
      keys: true,
      vi: true,
      border: {
        type: 'line',
      },
      bg: 'black',
      autoNext: false,
    });

    this.yourMove = Blessed.textbox({
      parent: this.form,
      name: 'yourMove',
      width: '80%',
      height: 3,
      top: 1,
      left: 1,
      keys: true,
      mouse: true,
      input: true,
      inputOnFocus: true,
      tags: true,
      style: {
        fg: 'white',
        bg: 'black',
      },
      border: {
        type: 'line',
      },
      focus: {
        fg: 'blue',
      },
    });
  }

  // TODO: remove
  public useInput(useInputFormInsteadOfPlayerBox: boolean){
    if (useInputFormInsteadOfPlayerBox){
      this.playersBox.hide();
      this.form.show();
      this.yourMove.show();
    }else {
      this.form.hide();
      this.yourMove.hide();
      this.playersBox.show();
    }
  }

  public logLine = (text: string) => {
    this.logBox.pushLine(text);
    this.logBox.setScrollPerc(100);
  };

  public statusLine = (text: string) => {
    this.statusBox.pushLine(text);
    this.statusBox.setScrollPerc(100);
  };
}
