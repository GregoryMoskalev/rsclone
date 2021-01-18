import * as Phaser from 'phaser';
import { setBtnActive, disableBtnActive } from './utilitites';

export default class Statistic extends Phaser.Scene {
  private lang: Record<string, string>;

  private backButton: Phaser.GameObjects.Text;

  private emptyStatistic: string;

  private openLink: (link: string) => void;

  private pause: boolean;

  private lastScene: string;

  private player;

  constructor() {
    super({ key: 'Statistic', active: false });
  }

  init(data :{ key: string; pause: boolean; player }): void {
    this.lastScene = data.key;
    this.pause = data.pause;
    this.player = data.player;
  }

  create(): void {
    this.lang = this.registry.get('lang');
    const styleTitle = { font: '40px monospace' };
    const styleStat = { font: '35px monospace' };
    this.add
      .text(this.game.renderer.width / 2, this.game.renderer.height / 2 - 400,
        this.lang.statistic, styleTitle)
      .setOrigin(0.5);

    this.backButton = this.add
      .text(this.game.renderer.width / 2, this.game.renderer.height - 100,
        this.lang.backToMenu, styleTitle)
      .setOrigin(0.5)
      .setInteractive({ cursor: 'pointer' });

    if (JSON.parse(localStorage.getItem('statistic')).length === 0) {
      this.emptyStatistic = 'There is no statistic yet...';
      this.add.text(this.game.renderer.width / 2, 400, this.emptyStatistic, styleTitle)
        .setOrigin(0.5)
        .setInteractive();
    } else {
      const title = ['Top', 'Time', 'Deaths'];
      title.forEach((el, i) => this.add.text(this.game.renderer.width / 2 + i * 160 - 200, 200,
        el, styleTitle));
      JSON.parse(localStorage.getItem('statistic')).forEach((el, i) => {
        el.forEach((param, j) => {
          this.add.text(this.game.renderer.width / 2 + j * 160 - 200, 300 + i * 75,
            param, styleStat);
        });
      });
    }

    this.backButton.on('pointerup', this.backToMenu, this);
    this.backButton.on('pointerover', () => setBtnActive(this.backButton), this);
    this.backButton.on('pointerout', () => disableBtnActive(this.backButton), this);
    this.input.keyboard.on('keydown-ESC', this.backToMenu, this);
  }

  backToMenu(): void {
    if (!this.pause) {
      this.scene.start('Menu');
    } else {
      this.scene.start('PauseMenu', { key: this.lastScene, player: this.player });
    }
  }
}
