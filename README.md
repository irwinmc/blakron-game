# @blakron/game

Game extensions for the Blakron engine — Tween animation, MovieClip, ScrollView, and URLLoader.

Merged from Egret's `extension/tween` and `extension/game`, with a unified dependency on `@blakron/core`.

## Installation

```bash
pnpm add @blakron/game
```

## Modules

### Tween

Egret-compatible tween engine with object pooling and a chainable step queue.

```ts
import { Tween, Ease } from '@blakron/game';

Tween.get(sprite)
	.to({ x: 200, alpha: 0 }, 500, Ease.cubicOut)
	.wait(100)
	.call(() => console.log('done'));

// Play N times
Tween.get(sprite, { loop: false })
	.to({ scaleX: 1.2, scaleY: 1.2 }, 200, Ease.backOut)
	.to({ scaleX: 1, scaleY: 1 }, 200);

// Pause / resume all tweens on a target
Tween.pauseTweens(sprite);
Tween.resumeTweens(sprite);

// Remove all tweens globally
Tween.removeAllTweens();
```

**Ease functions** — all standard Egret easing curves are available, plus factory methods:

```ts
Ease.cubicOut; // direct function
Ease.getPowOut(4); // quartOut equivalent
Ease.getElasticOut(1, 0.3);
Ease.cubicBezier(0.25, 0.1, 0.25, 1);
```

### TweenGroup

Manage a set of tweens together.

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

// Build frame data
const data = MovieClipData.fromTextureArray([tex1, tex2, tex3], 12);
// or from a SpriteSheet
const data2 = MovieClipData.fromSpriteSheet(sheet, ['run_01', 'run_02', 'run_03'], 24);

const mc = new MovieClip(data);
mc.play(-1); // loop forever
mc.play(3); // play 3 times then stop
stage.addChild(mc);

mc.addEventListener(Event.COMPLETE, () => console.log('done'));
mc.addEventListener(Event.LOOP_COMPLETE, () => console.log('loop'));

mc.gotoAndPlay('attack'); // jump to label and play
mc.gotoAndStop(5); // jump to frame 5 and stop
mc.prevFrame();
mc.nextFrame();

console.log(mc.currentFrameLabel); // label of current frame
console.log(mc.currentLabel); // nearest preceding label
console.log(mc.frameRate); // fps
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

// Programmatic scroll (instant)
sv.scrollTop = 200;

// Animated scroll
sv.setScrollTop(200, 300); // scroll to y=200 over 300ms
sv.setScrollLeft(0, 300);

// Combined
sv.setScrollPosition(200, 0); // instant
sv.setScrollPosition(10, 0, true); // offset by delta

sv.addEventListener(Event.CHANGE, () => console.log(sv.scrollTop));
sv.addEventListener(Event.COMPLETE, () => console.log('scroll tween done'));

// Bounds
console.log(sv.getMaxScrollTop());
console.log(sv.getMaxScrollLeft());
```

### URLLoader

High-level resource loader wrapping `@blakron/core`'s `HttpRequest`, `ImageLoader`, and `Sound`.

```ts
import { URLLoader, URLRequest, URLLoaderDataFormat, URLRequestHeader, URLRequestMethod } from '@blakron/game';
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

// POST with headers
const req = new URLRequest('https://api.example.com/data');
req.method = URLRequestMethod.POST;
req.data = JSON.stringify({ key: 'value' });
req.requestHeaders.push(new URLRequestHeader('Content-Type', 'application/json'));
loader.load(req);

// Abort
loader.close();
```

## API Reference

### Tween

| Method                          | Description                        |
| ------------------------------- | ---------------------------------- |
| `Tween.get(target, options?)`   | Create or reuse a tween for target |
| `Tween.removeTweens(target)`    | Remove all tweens on target        |
| `Tween.pauseTweens(target)`     | Pause all tweens on target         |
| `Tween.resumeTweens(target)`    | Resume all tweens on target        |
| `Tween.removeAllTweens()`       | Remove all active tweens           |
| `Tween.pauseAll()`              | Global pause                       |
| `Tween.resumeAll()`             | Global resume                      |
| `.to(props, duration, ease?)`   | Animate to values                  |
| `.from(props, duration, ease?)` | Animate from values                |
| `.wait(duration)`               | Pause between steps                |
| `.call(fn, thisObj?, params?)`  | Callback step                      |
| `.set(props)`                   | Instant property set               |
| `.pause()` / `.resume()`        | Instance pause/resume              |

### MovieClip

| Member                        | Description                        |
| ----------------------------- | ---------------------------------- |
| `play(playTimes?)`            | Play (-1 = loop, >=1 = N times)    |
| `stop()`                      | Stop on current frame              |
| `gotoAndPlay(frame)`          | Jump and play                      |
| `gotoAndStop(frame)`          | Jump and stop                      |
| `prevFrame()` / `nextFrame()` | Step one frame                     |
| `currentFrame`                | Current frame index (read-only)    |
| `totalFrames`                 | Total frame count (read-only)      |
| `currentFrameLabel`           | Label of current frame             |
| `currentLabel`                | Nearest preceding label            |
| `frameRate`                   | Per-clip fps override              |
| `isPlaying`                   | Playback state (read-only)         |
| `movieClipData`               | Frame data source                  |
| `loop`                        | Loop flag (use `play(-1)` instead) |

### ScrollView

| Member                                            | Description                       |
| ------------------------------------------------- | --------------------------------- |
| `setContent(sprite)`                              | Set scrollable content            |
| `removeContent()`                                 | Remove content                    |
| `scrollLeft` / `scrollTop`                        | Scroll position                   |
| `setScrollLeft(x, duration?)`                     | Scroll with optional tween        |
| `setScrollTop(y, duration?)`                      | Scroll with optional tween        |
| `setScrollPosition(top, left, isOffset?)`         | Set both axes                     |
| `getMaxScrollLeft()` / `getMaxScrollTop()`        | Scroll bounds                     |
| `scrollRight` / `scrollBottom`                    | Max scroll (read-only)            |
| `bounces`                                         | Enable bounce (default: true)     |
| `scrollSpeed`                                     | Speed multiplier (default: 1)     |
| `scrollBeginThreshold`                            | Min drag distance (default: 10px) |
| `horizontalScrollPolicy` / `verticalScrollPolicy` | `auto` / `on` / `off`             |

## License

MIT
