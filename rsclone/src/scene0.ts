import * as Phaser from 'phaser';
import { Engine, Render, World, Bodies, Body, Events } from "matter-js";
import { checkPropertyChange } from 'json-schema';


const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  visible: false,
  key: 'Scene0',
};

export default class Scene0 extends Phaser.Scene {
  private ladder: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
  private cloudOne: Phaser.GameObjects.Image;
  private cloudTwo: Phaser.GameObjects.Image;
  private groundLayer: Phaser.Tilemaps.TilemapLayer;
  private player: Phaser.Physics.Matter.Sprite;
  private soundWalk: boolean;
  private soundQueue: object;
  private playerIsTouching: { left: boolean; ground: boolean; right: boolean };

  constructor() {
    super(sceneConfig);
  }

  public create() {
    //creation collide blocks
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('bg', 'bg');
    this.groundLayer = map.createLayer('BackGround', tileset);
    this.groundLayer.setCollisionByProperty({ collides: true });

    this.cloudOne = this.add.image(300, 180, 'cloud2').setAlpha(0.6);
    this.cloudTwo = this.add.image(1200, 105, 'cloud1').setAlpha(0.6);

    this.ladder = this.add.sprite(1515, 550 , 'ladder') as any;

    this.player = this.matter.add.sprite(30, 100, "playerIdle", 0);
    this.player.setScale(0.8);

    const { width: w, height: h } = this.player;

    // @ts-ignore
    const Bodies = Phaser.Physics.Matter.Matter.Bodies;
    const rect = Bodies.rectangle(25, 76, 50, 140);
    const bottomSensor = Bodies.rectangle(25, h * 0.5 + 55, w * 0.25, 12, { isSensor: true, label: 'bottom' });
    const rightSensor = Bodies.rectangle(w * 0.35 + 25, 55, 12, h * 0.5, { isSensor: true, label: 'right' });
    const leftSensor = Bodies.rectangle(-w * 0.35 + 25, 55, 12, h * 0.5, { isSensor: true, label: 'left' });


    // @ts-ignore
    const compoundBody = Phaser.Physics.Matter.Matter.Body.create({
      parts: [ rect, bottomSensor, rightSensor, leftSensor ],
      inertia: Infinity
    });

    this.player.setFixedRotation()
        .setExistingBody(compoundBody);

    this.playerIsTouching = { left: false, right: false, ground: false };

    // Before matter's update, reset our record of what surfaces the player is touching.
    this.matter.world.on("beforeupdate", this.resetTouching, this);

    this.matter.world.on('collisionactive',  (event) => {
      event.pairs.forEach(pair => {
        let bodyA = pair.bodyA;
        let bodyB = pair.bodyB;
        if (pair.isSensor) {
          let playerBody = bodyA.isSensor ? bodyA : bodyB;
          if (playerBody.label === 'left') {
            this.playerIsTouching.left = true;
          } else if (playerBody.label === 'right') {
            this.playerIsTouching.right = true;
          } else if (playerBody.label === 'bottom') {
            this.playerIsTouching.ground = true;
          }
        }
      });

    });


    this.matter.world.convertTilemapLayer(this.groundLayer);

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

    this.matter.world.setBounds(0, 0, 1680, 1040);
    this.sound.add('wind').play({ loop: true })

  }

  public update() {
    const cursors = this.input.keyboard.createCursorKeys();
    const isOnGround = this.playerIsTouching.ground;
    const speed = 8;

    const PlayerVerticalCenter = new Phaser.Geom.Line(
        this.player.getBottomCenter().x,
        this.player.getCenter().y,
        this.player.getTopCenter().x,
        this.player.getTopCenter().y
    );

    // ladder
    if (Phaser.Geom.Intersects.LineToRectangle(PlayerVerticalCenter, this.ladder.getBounds())) {
      if (cursors.up.isDown) {
        this.player.setVelocityY(-speed / 1.5);
        this.player.anims.play('idle', true);  // there will be ladder animation
        if (this.soundWalk) {
          this.makeSound(`ladder${this.soundQueue["ladder"]}`);
          this.soundQueue["ladder"] = (this.soundQueue["ladder"] + 1) % 4;
        }
      }
    }
    // walk
    if (cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      if (isOnGround) {
        this.player.anims.play('walk', true);
        if (this.soundWalk === true) {
          this.makeSound(`walk${this.soundQueue["walk"]}`);
          this.soundQueue["walk"] = (this.soundQueue["walk"] + 1) % 4;
        }
      }
      this.player.flipX = true;
    } else if (cursors.right.isDown) {
      this.player.setVelocityX(speed);
      if (!this.player.body.velocity.y) {
        this.player.anims.play('walk', true);
        if (this.soundWalk === true) {
          this.makeSound(`walk${this.soundQueue["walk"]}`);
          this.soundQueue["walk"] = (this.soundQueue["walk"] + 1) % 4;
        }
      }
      this.player.flipX = false;
    } else {
      if (isOnGround) this.player.anims.play('idle', true);
      this.player.setVelocityX(0);
    }

    // jump
    if (cursors.up.isDown && isOnGround) {
      this.player.setVelocityY(-22);
    }

    if(!isOnGround) {
      this.player.anims.play('jump', true);
    }

    // speed regulation
    const velocity = this.player.body.velocity;
    if (velocity.x > speed) this.player.setVelocityX(speed);
    else if (velocity.x < -speed) this.player.setVelocityX(-speed);

    if (this.player.getBottomCenter().x >= 1640) {
      this.scene.start('Scene1');
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
  public resetTouching() {
    this.playerIsTouching.left = false;
    this.playerIsTouching.right = false;
    this.playerIsTouching.ground = false;
  }

}
