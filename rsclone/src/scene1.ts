import * as Phaser from 'phaser';
import initScene from './initScene';
import Player from './player';
import { countDeath, statisticInGame, moveCloud } from './utils/utilitites';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Scene1',
};

export default class Scene1 extends Phaser.Scene {
  private lantern: Phaser.GameObjects.Sprite;

  private spikes1: Phaser.GameObjects.Zone;

  private spikes2: Phaser.GameObjects.Zone;

  private player: Player;

  private deathStatus: boolean;

  private cloudOne;

  private note: Phaser.GameObjects.Sprite;

  private dialogue: Phaser.GameObjects.Sprite;

  private text: Phaser.GameObjects.Text;

  private clickable: boolean;

  private lang: Record<string, string>;

  private pause: boolean;

  private atHome: boolean;

  private homeZone: Phaser.GameObjects.Zone;

  constructor() {
    super(sceneConfig);
  }

  public create(): void {
    const x = 350; // player position
    const y = 640;

    initScene.call(this, 1, x, y);

    this.lang = this.registry.get('lang');

    this.anims.create({
      key: 'lantern',
      frames: this.anims.generateFrameNames('lantern', {
        start: 1,
        end: 4,
        prefix: '',
        suffix: '.png',
      }),
      frameRate: 11,
      repeat: -1,
    });
    this.lantern = this.add.sprite(300, 525, 'lantern', 1).setScale(0.8);
    this.lantern.anims.play('lantern', true);
    this.spikes1 = this.add.zone(1048, 940, 200, 150);
    this.spikes2 = this.add.zone(1420, 670, 160, 20);

    statisticInGame(this);

    this.note = this.add.sprite(545, 824, 'note').setScale(0.8);
    this.player.player.setDepth(2);

    this.cloudOne = this.add.image(300, 110, 'cloud2').setAlpha(0.6).setScale(0.9);

    this.dialogue = this.add.sprite(800, 200, 'dialogueNote').setDepth(999);
    this.dialogue.visible = false;
    this.text = this.add
      .text(530, 100, this.lang.shoppingList, {
        font: '22px monospace',
      })
      .setDepth(1000);
    this.text.visible = false;
    this.clickable = true;

    this.sound.play('home', { loop: true });
    this.atHome = true;
    this.homeZone = this.add.zone(280, 500, 440, 150);
  }

  public update(): void {
    this.changeLang();

    const cursors = this.input.keyboard.createCursorKeys();
    const keyboardKeys: {
      action?
    } = this.input.keyboard.addKeys({
      action: 'e',
    });

    const action = cursors.space.isDown || keyboardKeys.action.isDown;

    this.killOnSpikes(this.spikes1);
    this.killOnSpikes(this.spikes2);
    this.cloudOne.x = moveCloud(this.cloudOne.x, 0.7);

    if (
      !Phaser.Geom.Intersects.RectangleToRectangle(
        this.homeZone.getBounds(),
        this.player.player.getBounds(),
      )
    ) {
      if (this.atHome) {
        this.atHome = false;
        this.sound.stopAll();
        this.sound.play('wind', { loop: true });
      }
    } else if (!this.atHome) {
      this.atHome = true;
      this.sound.stopAll();
      this.sound.play('home', { loop: true });
    }

    if (
      Phaser.Geom.Intersects.RectangleToRectangle(
        this.note.getBounds(),
        this.player.player.getBounds(),
      )
    ) {
      if (
        Phaser.Geom.Intersects.RectangleToRectangle(
          this.note.getBounds(),
          this.player.player.getBounds(),
        )
      ) {
        this.note.setTexture('noteActive');
        if (action && this.clickable) {
          this.sound.play(`note${1 + +this.dialogue.visible}`);
          this.dialogue.visible = !this.dialogue.visible;
          this.text.visible = !this.text.visible;
          this.clickable = false;
          setTimeout(() => {
            this.clickable = true;
          }, 200);
        }
      } else {
        this.note.setTexture('note');
        this.dialogue.visible = false;
        this.text.visible = false;
      }
    }
  }

  private killOnSpikes(spikeid): void {
    if (
      Phaser.Geom.Intersects.RectangleToRectangle(
        spikeid.getBounds(),
        this.player.player.getBounds(),
      )
    ) {
      this.player.die();
      this.time.paused = true;
      if (!this.deathStatus) {
        countDeath();
        this.deathStatus = true;
      }
    }
  }

  private changeLang() {
    if (!this.pause) return;
    this.lang = this.registry.get('lang');
    this.text.setText(this.lang.shoppingList);
    this.pause = false;
  }
}
