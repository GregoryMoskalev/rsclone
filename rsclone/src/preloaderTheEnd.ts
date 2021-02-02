import * as Phaser from 'phaser';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'PreloaderTheEnd',
};

export default class PreloaderTheEnd extends Phaser.Scene {
  private player;

  private lastScene: string;

  constructor() {
    super(sceneConfig);
  }

  init(data :Record<string, string>): void {
    this.lastScene = data.key;
    this.player = data.player;
  }

  public create():void {
    const graphics = this.add.graphics();
    let alpha = 0;
    graphics.fillStyle(0x000000);
    graphics.fillRect(0, 0, this.game.renderer.width * 2, this.game.renderer.width * 2);

    graphics.setAlpha(alpha);

    const go = setInterval(() => {
      alpha += 0.02;
      graphics.setAlpha(alpha);
      if (alpha >= 1) {
        clearInterval(go);
        this.scene.stop('Scene6');
        this.game.sound.stopAll();
        this.scene.start('EndGame', { key: 'Scene6', pause: true, player: this.player });
      }
    }, 50);
  }
}
