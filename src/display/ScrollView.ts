// TODO: implement ScrollView
// Inertial scrolling container, Egret-compatible.
//
// Egret-compatible API:
//   const sv = new ScrollView();
//   sv.setContent(displayObject)
//   sv.scrollLeft   → number  (get/set)
//   sv.scrollTop    → number  (get/set)
//   sv.scrollRight  → number  (readonly)
//   sv.scrollBottom → number  (readonly)
//   sv.horizontalScrollPolicy  → ScrollPolicy
//   sv.verticalScrollPolicy    → ScrollPolicy
//
// Implementation notes:
//   - Extends DisplayObjectContainer (Sprite)
//   - Touch handling: TOUCH_BEGIN → TOUCH_MOVE → TOUCH_END on stage
//   - Velocity sampling: weighted average of last N move deltas
//   - Inertia: exponential decay after TOUCH_END (friction coefficient)
//   - Bounce: spring-back animation when scrolled past content bounds
//   - scrollRect clips content to visible area
//   - Note: @blakron/ui already has Scroller + TouchScroll for EUI use;
//     this ScrollView is the standalone Egret-compatible version for
//     non-EUI projects

import { Sprite } from '@blakron/core';

export class ScrollView extends Sprite {
	constructor() {
		super();
		// TODO: initialize touch handlers
		throw new Error('ScrollView not yet implemented');
	}

	setContent(_content: Sprite): void {
		// TODO
		throw new Error('ScrollView#setContent() not yet implemented');
	}

	get scrollLeft(): number {
		// TODO
		throw new Error('ScrollView#scrollLeft not yet implemented');
	}

	set scrollLeft(_value: number) {
		// TODO
		throw new Error('ScrollView#scrollLeft not yet implemented');
	}

	get scrollTop(): number {
		// TODO
		throw new Error('ScrollView#scrollTop not yet implemented');
	}

	set scrollTop(_value: number) {
		// TODO
		throw new Error('ScrollView#scrollTop not yet implemented');
	}
}
