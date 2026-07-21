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

Sequence-frame animation display object. Extends `Bitmap`; the external game loop owns timing and calls `advanceFrame()` once per scheduled animation step.

```ts
import { MovieClip, MovieClipData, MovieClipDataFactory, MovieClipEvent } from '@blakron/game';
import { Event, getTimer } from '@blakron/core';

// Parse an Egret MovieClip JSON data set with its atlas texture.
// MovieClipDataFactory internally creates a core SpriteSheet.
const factory = new MovieClipDataFactory(egretMcData, atlasTexture);
const data = factory.generateMovieClipData('run');
if (!data) throw new Error('MovieClip data not found');

const mc = new MovieClip(data);
mc.addEventListener(MovieClipEvent.COMPLETE, () => console.log('done'));
mc.play(-1); // loop forever
stage.addChild(mc);

// One external loop owns the logical animation cadence for all MovieClips.
const playingClips = [mc];
const frameDuration = 1000 / 12;
let elapsed = 0;
let lastTime = getTimer();
stage.addEventListener(Event.ENTER_FRAME, () => {
	const now = getTimer();
	elapsed += now - lastTime;
	lastTime = now;

	while (elapsed >= frameDuration) {
		elapsed -= frameDuration;
		for (const clip of playingClips) {
			clip.advanceFrame();
		}
	}
});

// Manual navigation APIs stop playback.
mc.gotoAndStop(5); // 1-based frame number
mc.prevFrame();
mc.nextFrame();

// gotoAndPlay begins a new externally-driven playback session.
mc.gotoAndPlay('attack', 3);
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

| Member                           | Description                                              |
| -------------------------------- | -------------------------------------------------------- |
| `play(playTimes?)`               | Start/resume; external code controls the frame schedule  |
| `advanceFrame()`                 | Advance exactly one externally scheduled animation frame |
| `stop()`                         | Stop on current frame                                    |
| `gotoAndPlay(frame, playTimes?)` | Jump to frame/label and start a new playback session     |
| `gotoAndStop(frame)`             | Jump to frame/label and stop                             |
| `prevFrame()` / `nextFrame()`    | Manually step one frame and stop                         |
| `currentFrame`                   | Current frame number, 1-based (read-only)                |
| `totalFrames`                    | Total frame count (read-only)                            |
| `currentFrameLabel`              | Label of current frame, or `undefined`                   |
| `currentLabel`                   | Nearest preceding labeled frame, or `undefined`          |
| `isPlaying`                      | Playback state (read-only)                               |
| `movieClipData`                  | Frame data source                                        |

### MovieClipData

| Method                                       | Description                                                  |
| -------------------------------------------- | ------------------------------------------------------------ |
| `addFrame(texture, duration, label?)`        | Append a logical frame                                       |
| `setFrameLabel(name, startFrame, endFrame?)` | Define a 0-based inclusive label playback range              |
| `setFrameEvent(frameIndex, eventName)`       | Dispatch event when frame is reached                         |
| `fromTextureArray(textures, fps?)`           | Static factory from texture array                            |
| `fromSpriteSheet(sheet, frameNames, fps?)`   | Static factory from already-resolved SpriteSheet frame names |

### MovieClipDataFactory

| Member                                       | Description                                                         |
| -------------------------------------------- | ------------------------------------------------------------------- |
| `new MovieClipDataFactory(dataSet, texture)` | Parse Egret `mc` / `res` JSON with an atlas texture                 |
| `generateMovieClipData(name?)`               | Generate (and optionally cache) data for a named exported MovieClip |
| `clearCache()`                               | Clear generated MovieClipData instances                             |
| `enableCache`                                | Toggle generated data caching                                       |

### URLVariables

```ts
const vars = new URLVariables('key=value&count=3');
vars.decode('extra=data');
console.log(vars.toString()); // 'key=value&count=3&extra=data'
```

## License

MIT
