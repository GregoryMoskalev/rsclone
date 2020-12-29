import * as Phaser from 'phaser';
import { checkPropertyChange } from 'json-schema';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Scene0',
};

export default class Scene0 extends Phaser.Scene {
  public player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private groundLayer: Phaser.Tilemaps.TilemapLayer;
  private objects: Phaser.Physics.Arcade.StaticGroup;
  private cloudOne: Phaser.GameObjects.Image;
  private cloudTwo: Phaser.GameObjects.Image;
  private soundWalk: boolean;
  private soundQueue: object;
  private ladder: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;


  constructor() {
    super(sceneConfig);
  }

  public preload() {}

  public create() {

    const centerX = 840;
    const centerY = 520;

    //creation collide blocks
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('bg', 'bg');
    this.groundLayer = map.createLayer('BackGround', tileset);
    this.groundLayer.setCollisionByProperty({ collides: true });

    // coloring the colliding tiles
    const debugGraphics = this.add.graphics().setAlpha(0.5);
    this.groundLayer.renderDebug(debugGraphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    });
    this.cloudOne = this.add.image(centerX + 300, centerY / 4, 'cloud1').setAlpha(0.6);
    this.cloudTwo = this.add.image(centerX / 5, centerY / 8, 'cloud2').setAlpha(0.6);

    this.ladder = this.add.sprite(centerX + 680, centerY+20 , 'ladder') as any;

    this.player = this.physics.add.sprite(400, 300, 'playerIdle').setScale(0.8);
    this.player.setCollideWorldBounds(true);

    // additional ground layer
    this.objects = this.physics.add.staticGroup();
    this.objects.create(centerX, 900, 'ground', '', false).refreshBody();

    this.physics.add.collider(this.player, this.groundLayer);
    this.physics.add.collider(this.player, this.objects);


    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNames('playerWalk', {
        start: 2,
        end: 8,
        prefix: '',
        suffix: '.png',
      }),
      frameRate: 11,
      repeat: -1,
    });

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNames('playerIdle', {
        start: 1,
        end: 8,
        prefix: '',
        suffix: '.png',
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNames('playerJump', {
        start: 1,
        end: 3,
        prefix: '',
        suffix: '.png',
      }),
      frameRate: 6,
      repeat: -1,
    });

    this.soundWalk = true;
    this.soundQueue = {
      ladder: 0,
      walk: 0
    }

    this.sound.add('wind').play({ loop: true })
  }

  public update() {
    const cursors = this.input.keyboard.createCursorKeys();
    const speed = 400;
    const PlayerVerticalCenter = new Phaser.Geom.Line(
        this.player.getBottomCenter().x,
        this.player.getCenter().y,
        this.player.getTopCenter().x,
        this.player.getTopCenter().y
    );

    // ladder
    if (Phaser.Geom.Intersects.LineToRectangle(PlayerVerticalCenter, this.ladder.getBounds())) {
      if (cursors.up.isDown) {
        this.player.body.setVelocityY(-speed / 1.5);
        this.player.anims.play('idle', true);  // there will be ladder animation
        if (this.soundWalk) {
          this.makeSound(`ladder${this.soundQueue["ladder"]}`);
          this.soundQueue["ladder"] = (this.soundQueue["ladder"] + 1) % 4;
        }
      }
    }

    // walk
    if (cursors.left.isDown) {
      this.player.body.setVelocityX(-speed);
      if (this.player.body.blocked.down) this.player.anims.play('walk', true);
      this.player.flipX = true;
      if (this.soundWalk === true && this.player.body.onFloor()) {
        this.makeSound(`walk${this.soundQueue["walk"]}`);
        this.soundQueue["walk"] = (this.soundQueue["walk"] + 1) % 4;
      }
    } else if (cursors.right.isDown) {
      this.player.body.setVelocityX(speed);
      if (this.player.body.blocked.down) this.player.anims.play('walk', true);
      this.player.flipX = false;
      if (this.soundWalk === true && this.player.body.onFloor()) {
        this.makeSound(`walk${this.soundQueue["walk"]}`);
        this.soundQueue["walk"] = (this.soundQueue["walk"] + 1) % 4;
      }
    } else {
      if (this.player.body.blocked.down) this.player.anims.play('idle', true);
      this.player.body.setVelocityX(0);
    }

    // jump
    if (cursors.up.isDown && this.player.body.blocked.down) {
      this.player.body.setVelocityY(-810);
      this.player.anims.play('jump', true);
    }

    this.moveCloud(this.cloudOne, 0.7);
    this.moveCloud(this.cloudTwo, 0.3);
  }

  public moveCloud(cloud, speed) {
    cloud.x += speed;
    if (cloud.x > window.innerWidth + 400) {
      this.resetCloudPosition(cloud);
    }
  }

  public resetCloudPosition(cloud) {
    cloud.x = -400;
  }

  public makeSound(key) {
    this.sound.add(key).play({ loop: false });
    this.soundWalk = false;
    setTimeout(() => {
      this.soundWalk = true;
    }, 350);
  }
}
