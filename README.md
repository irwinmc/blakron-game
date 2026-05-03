# @blakron/game

Game extensions for the Blakron engine — Tween animation, MovieClip, ScrollView, and URLLoader.

Migrated from Egret's `extension/tween` and `extension/game`, rewritten in modern TypeScript.

## Installation

```bash
pnpm add @blakron/game
```

Requires `@blakron/core` as a peer dependency.

## Modules

### Tween

Egret-compatible tween engine with object pooling and a chainable step queue.

```ts
import { Tween, Ease } from '@blakron/game';

// Basic animation
Tween.get(sprite)
	.to({ x: 200, alpha: 0 }, 500, Ease.cubicOut)
	.wait(100)
	.call(() => console.log('done'));

// Loop
Tween.get(sprite, { loop: true }).to({ scaleX: 1.2, scaleY: 1.2 }, 200, Ease.backOut).to({ scaleX: 1, scaleY: 1 }, 200);

// Start paused, then play later
const tween = Tween.get(sprite, { paused: true }).to({ x: 100 }, 300);
tween.setPaused(false);

// Jump to a specific time position
tween.setPosition(150); // seek to 150ms

// onChange callback — fires every tick
Tween.get(sprite, {
	onChange: t => console.log('progress'),
	onLoopComplete: t => console.log('loop done'),
});

// Manage tweens on a target
Tween.pauseTweens(sprite);
Tween.resumeTweens(sprite);
Tween.removeTweens(sprite);
Tween.removeAllTweens();

// Global pause
Tween.pauseAll();
Tween.resumeAll();
```

**Ease functions:**

```ts
Ease.linear;
Ease.cubicIn / Ease.cubicOut / Ease.cubicInOut;
Ease.backOut;
Ease.elasticOut;
Ease.bounceOut;
Ease.getPowOut(4); // quartOut equivalent
Ease.getElasticOut(1, 0.3);
Ease.cubicBezier(0.25, 0.1, 0.25, 1);
```

### TweenGroup

Manage a named set of tweens together.

```ts
import { TweenGroup } from '@blakron/game';

const group = new TweenGroup('ui');
group.get(btnA).to({ alpha: 0 }, 300);
group.get(btnB).to({ alpha: 0 }, 300);

group.pause();
group.resume();
group.removeAll();
```

### MovieClip

Sequence-frame animation display object. Extends `Bitmap` and drives frame changes via the engine ticker.

```ts
import { MovieClip, MovieClipData } from '@blakron/game';
import { Event } from '@blakron/core';

// Build frame data from textures
const data = MovieClipData.fromTextureArray([tex1, tex2, tex3], 12);

// From a SpriteSheet
const data2 = MovieClipData.fromSpriteSheet(sheet, ['run_01', 'run_02', 'run_03'], 24);

// Frame events — dispatched when a specific frame is reached
data.setFrameEvent(2, 'footstep'); // 0-based index

const mc = new MovieClip(data);
mc.addEventListener('footstep', () => playSound());

// Playback
mc.play(-1); // loop forever
mc.play(3); // play 3 times then stop
mc.play(0); // don't change current play count (Egret-compatible)
mc.stop();

mc.gotoAndPlay('attack'); // jump to label and play
mc.gotoAndStop(5); // jump to frame 5 (1-based) and stop
mc.prevFrame();
mc.nextFrame();

// Events
mc.addEventListener(Event.COMPLETE, () => console.log('done'));
mc.addEventListener(Event.LOOP_COMPLETE, () => console.log('loop'));

// Properties
console.log(mc.currentFrame); // 1-based frame number
console.log(mc.totalFrames);
console.log(mc.currentFrameLabel); // label of current frame, or undefined
console.log(mc.currentLabel); // nearest preceding label
console.log(mc.frameRate); // fps (override per-clip)
console.log(mc.isPlaying);

stage.addChild(mc);
```

### ScrollView

Inertial scrolling container with bounce, scroll threshold, and animated scroll-to.

```ts
import { ScrollView, ScrollPolicy } from '@blakron/game';
import { Event } from '@blakron/core';

const sv = new ScrollView();
sv.width = 640;
sv.height = 960;
sv.bounces = true;
sv.scrollSpeed = 1;
sv.scrollBeginThreshold = 10;
sv.horizontalScrollPolicy = ScrollPolicy.OFF;
sv.verticalScrollPolicy = ScrollPolicy.AUTO;
sv.setContent(contentSprite);
stage.addChild(sv);

// Instant scroll
sv.scrollTop = 200;
sv.scrollLeft = 0;

// Animated scroll
sv.setScrollTop(200, 300); // scroll to y=200 over 300ms
sv.setScrollLeft(0, 300);

// Combined (instant)
sv.setScrollPosition(200, 0);
// Combined (delta)
sv.setScrollPosition(10, 0, true);

sv.addEventListener(Event.CHANGE, () => console.log(sv.scrollTop));
sv.addEventListener(Event.COMPLETE, () => console.log('tween done'));

console.log(sv.getMaxScrollTop());
console.log(sv.getMaxScrollLeft());
```

### URLLoader

High-level resource loader wrapping `@blakron/core`'s `HttpRequest`, `ImageLoader`, and `Sound`.

```ts
import {
	URLLoader,
	URLRequest,
	URLLoaderDataFormat,
	URLRequestHeader,
	URLRequestMethod,
	URLVariables,
} from '@blakron/game';
import { Event, IOErrorEvent, Texture, Sound } from '@blakron/core';

// Load JSON
const loader = new URLLoader();
loader.dataFormat = URLLoaderDataFormat.JSON;
loader.addEventListener(Event.COMPLETE, () => {
	const config = loader.data as Record<string, unknown>;
});
loader.addEventListener(IOErrorEvent.IO_ERROR, () => console.error('failed'));
loader.load(new URLRequest('data/config.json'));

// Load texture
const texLoader = new URLLoader();
texLoader.dataFormat = URLLoaderDataFormat.TEXTURE;
texLoader.addEventListener(Event.COMPLETE, () => {
	const texture = texLoader.data as Texture;
});
texLoader.load(new URLRequest('assets/bg.png'));

// Load sound
const sndLoader = new URLLoader();
sndLoader.dataFormat = URLLoaderDataFormat.SOUND;
sndLoader.addEventListener(Event.COMPLETE, () => {
	const sound = sndLoader.data as Sound;
	sound.play();
});
sndLoader.load(new URLRequest('audio/bgm.mp3'));

// POST with URLVariables
const vars = new URLVariables();
vars.variables['key'] = 'value';
vars.variables['count'] = '3';

const req = new URLRequest('https://api.example.com/data');
req.method = URLRequestMethod.POST;
req.data = vars.toString();
req.requestHeaders.push(new URLRequestHeader('Content-Type', 'application/x-www-form-urlencoded'));
loader.load(req);

// Abort
loader.close();
```

## API Reference

### Tween static methods

| Method                        | Description                        |
| ----------------------------- | ---------------------------------- |
| `Tween.get(target, options?)` | Create or reuse a tween for target |
| `Tween.removeTweens(target)`  | Remove all tweens on target        |
| `Tween.pauseTweens(target)`   | Pause all tweens on target         |
| `Tween.resumeTweens(target)`  | Resume all tweens on target        |
| `Tween.removeAllTweens()`     | Remove all active tweens           |
| `Tween.pauseAll()`            | Global pause                       |
| `Tween.resumeAll()`           | Global resume                      |

### Tween instance methods

| Method                          | Description                        |
| ------------------------------- | ---------------------------------- |
| `.to(props, duration, ease?)`   | Animate to values                  |
| `.from(props, duration, ease?)` | Animate from values                |
| `.wait(duration)`               | Pause between steps                |
| `.call(fn, thisObj?, params?)`  | Callback step                      |
| `.set(props)`                   | Instant property set               |
| `.setPaused(value)`             | Pause or resume (Egret-compatible) |
| `.setPosition(ms)`              | Seek to absolute time position     |
| `.pause()` / `.resume()`        | Shorthand for `setPaused`          |

### TweenOptions

| Option              | Type              | Description                                     |
| ------------------- | ----------------- | ----------------------------------------------- |
| `loop`              | `boolean`         | Loop the tween sequence                         |
| `ignoreGlobalPause` | `boolean`         | Ignore `Tween.pauseAll()`                       |
| `ease`              | `EaseFunction`    | Default ease for all steps                      |
| `paused`            | `boolean`         | Start in paused state                           |
| `position`          | `number`          | Seek to this time (ms) immediately after create |
| `onChange`          | `(tween) => void` | Called every tick while running                 |
| `onLoopComplete`    | `(tween) => void` | Called each time a loop cycle completes         |

### MovieClip

| Member                        | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `play(playTimes?)`            | Play. `-1` = loop, `0` = keep current setting, `>=1` = N times |
| `stop()`                      | Stop on current frame                                          |
| `gotoAndPlay(frame)`          | Jump to frame/label and play                                   |
| `gotoAndStop(frame)`          | Jump to frame/label and stop                                   |
| `prevFrame()` / `nextFrame()` | Step one frame                                                 |
| `currentFrame`                | Current frame number, 1-based (read-only)                      |
| `totalFrames`                 | Total frame count (read-only)                                  |
| `currentFrameLabel`           | Label of current frame, or `undefined`                         |
| `currentLabel`                | Nearest preceding labeled frame, or `undefined`                |
| `frameRate`                   | Per-clip fps override (NaN = use data's rate)                  |
| `isPlaying`                   | Playback state (read-only)                                     |
| `movieClipData`               | Frame data source                                              |

### MovieClipData

| Method                                     | Description                          |
| ------------------------------------------ | ------------------------------------ |
| `addFrame(texture, duration, label?)`      | Append a frame                       |
| `setFrameEvent(frameIndex, eventName)`     | Dispatch event when frame is reached |
| `fromTextureArray(textures, fps?)`         | Static factory from texture array    |
| `fromSpriteSheet(sheet, frameNames, fps?)` | Static factory from sprite sheet     |

### URLVariables

```ts
const vars = new URLVariables('key=value&count=3');
vars.decode('extra=data');
console.log(vars.toString()); // 'key=value&count=3&extra=data'
```

## License

MIT
