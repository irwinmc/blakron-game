# @blakron/game

Game extensions for the Blakron engine — Tween animation, MovieClip, ScrollView, and URLLoader.

> ⚠️ **Work in progress.** See [docs/plan.md](./docs/plan.md) for implementation status.

## Installation

```bash
pnpm add @blakron/game
```

## Modules

### Tween

```ts
import { Tween, Ease } from '@blakron/game';

Tween.get(sprite)
	.to({ x: 200, alpha: 0 }, 500, Ease.cubicOut)
	.wait(100)
	.call(() => console.log('done'));
```

### MovieClip

```ts
import { MovieClip, MovieClipData } from '@blakron/game';

const data = new MovieClipData();
data.addFrame(texture1, 100);
data.addFrame(texture2, 100);

const mc = new MovieClip(data);
mc.loop = true;
mc.play();
stage.addChild(mc);
```

### ScrollView

```ts
import { ScrollView } from '@blakron/game';

const sv = new ScrollView();
sv.width = 640;
sv.height = 960;
sv.setContent(contentSprite);
stage.addChild(sv);
```

### URLLoader

```ts
import { URLLoader, URLRequest, URLLoaderDataFormat } from '@blakron/game';
import { Event } from '@blakron/core';

const loader = new URLLoader();
loader.dataFormat = URLLoaderDataFormat.JSON;
loader.addEventListener(Event.COMPLETE, () => {
	console.log(loader.data);
});
loader.load(new URLRequest('data/config.json'));
```

## License

MIT
