import { describe, it, expect } from 'vitest';
import { Tween } from '../src/blakron/tween/Tween.js';

describe('Tween', () => {
	it('remove() detaches the tween and returns it to the pool', () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);

		tween.remove();

		tween._tick(50);
		expect(target.x).toBe(0);
		expect(Tween.getCount(target)).toBe(0);

		const reused = Tween.get({ y: 0 });
		expect(reused).toBe(tween);
	});

	it('removeTweens() returns the removed tween to the pool', () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);

		Tween.removeTweens(target);

		const reused = Tween.get({ y: 0 });
		expect(reused).toBe(tween);
	});

	it('removeAllTweens() returns every removed tween to the pool', () => {
		const a = Tween.get({ x: 0 }).to({ x: 100 }, 100);
		const b = Tween.get({ x: 0 }).to({ x: 100 }, 100);

		Tween.removeAllTweens();

		const reusedFirst = Tween.get({ y: 0 });
		const reusedSecond = Tween.get({ y: 0 });
		expect([reusedFirst, reusedSecond]).toEqual(expect.arrayContaining([a, b]));
	});

	it('a tween that completes naturally is still returned to the pool', () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);

		tween._tick(100);

		const reused = Tween.get({ y: 0 });
		expect(reused).toBe(tween);
	});

	it('getCount() tracks active tweens per target without touching the target object', () => {
		const target: Record<string, unknown> = { x: 0 };
		expect(Tween.getCount(target)).toBe(0);

		const a = Tween.get(target).to({ x: 100 }, 100);
		expect(Tween.getCount(target)).toBe(1);

		const b = Tween.get(target).to({ x: 200 }, 100);
		expect(Tween.getCount(target)).toBe(2);

		expect(target.tween_count).toBeUndefined();

		a.remove();
		expect(Tween.getCount(target)).toBe(1);

		b.remove();
		expect(Tween.getCount(target)).toBe(0);
	});
});

describe('Tween lifecycle safety', () => {
	it('does not release a replacement tween created from a completion callback', () => {
		const originalTarget = { x: 0 };
		const replacementTarget = { x: 0 };
		let replacement: Tween | undefined;
		const tween = Tween.get(originalTarget, {
			onChange: () => {
				Tween.removeTweens(originalTarget);
				replacement = Tween.get(replacementTarget).to({ x: 100 }, 100);
			},
		}).to({ x: 100 }, 100);

		tween._tick(100);

		expect(Tween.getCount(originalTarget)).toBe(0);
		expect(replacement).toBeDefined();
		expect(Tween.getCount(replacementTarget)).toBe(1);
		replacement!._tick(100);
		expect(replacementTarget.x).toBe(100);
	});

	it('completes an empty tween on the next tick', async () => {
		const target = { x: 0 };
		const tween = Tween.get(target);
		const done = tween.then();

		tween._tick(0);

		await expect(done).resolves.toBeUndefined();
		expect(Tween.getCount(target)).toBe(0);
	});
});

describe('Tween repeat', () => {
	it('plays once by default (repeat: 0)', () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);

		tween._tick(100);

		expect(target.x).toBe(100);
		expect(Tween.getCount(target)).toBe(0);
	});

	it('repeat: 2 plays a total of 3 times', () => {
		const target = { x: 0 };
		let onLoopCompleteCalls = 0;
		const tween = Tween.get(target, { repeat: 2, onLoopComplete: () => onLoopCompleteCalls++ }).to({ x: 100 }, 100);

		tween._tick(100);
		expect(target.x).toBe(100);
		expect(onLoopCompleteCalls).toBe(1);
		expect(Tween.getCount(target)).toBe(1);

		tween._tick(100);
		expect(onLoopCompleteCalls).toBe(2);
		expect(Tween.getCount(target)).toBe(1);

		tween._tick(100);
		expect(target.x).toBe(100);
		expect(Tween.getCount(target)).toBe(0);
	});

	it('reuses the original endpoints when repeating a to() step', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { repeat: 1 }).to({ x: 100 }, 100);

		tween._tick(100);
		tween._tick(50);

		expect(target.x).toBe(50);
		tween.remove();
	});

	it('consumes multiple repeat cycles from a single large tick', () => {
		const target = { x: 0 };
		let onLoopCompleteCalls = 0;
		const tween = Tween.get(target, { repeat: 2, onLoopComplete: () => onLoopCompleteCalls++ }).to({ x: 100 }, 100);

		tween._tick(250);

		expect(target.x).toBe(50);
		expect(onLoopCompleteCalls).toBe(2);
		expect(Tween.getCount(target)).toBe(1);

		tween._tick(50);
		expect(Tween.getCount(target)).toBe(0);
	});

	it('normalizes invalid repeat values to a single play', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { repeat: -2 }).to({ x: 100 }, 100);

		tween._tick(100);

		expect(Tween.getCount(target)).toBe(0);
	});

	it('repeat: -1 (equivalent to loop: true) never stops on its own', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { repeat: -1 }).to({ x: 100 }, 100);

		for (let i = 0; i < 50; i++) {
			tween._tick(100);
		}

		expect(Tween.getCount(target)).toBe(1);
		tween.remove();
	});

	it('loop: true is still honoured as repeat: -1 for backward compatibility', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { loop: true }).to({ x: 100 }, 100);

		for (let i = 0; i < 10; i++) {
			tween._tick(100);
		}

		expect(Tween.getCount(target)).toBe(1);
		tween.remove();
	});
});

describe('Tween yoyo', () => {
	it('alternates direction each repeat, animating back to the start value', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { repeat: 1, yoyo: true }).to({ x: 100 }, 100);

		tween._tick(50);
		expect(target.x).toBeCloseTo(50, 5);

		tween._tick(50);
		expect(target.x).toBe(100);

		tween._tick(50);
		expect(target.x).toBeCloseTo(50, 5);

		tween._tick(50);
		expect(target.x).toBe(0);
		expect(Tween.getCount(target)).toBe(0);
	});

	it('keeps a multi-step sequence continuous across the reverse pass', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { repeat: 1, yoyo: true }).to({ x: 100 }, 100).to({ x: 200 }, 100);

		tween._tick(200);
		expect(target.x).toBe(200);

		tween._tick(1);
		expect(target.x).toBeLessThan(200);
		expect(target.x).toBeGreaterThan(90);

		tween._tick(199);
		tween._tick(200);
		expect(target.x).toBe(0);
	});

	it('does not re-trigger call() or set() steps on the reverse pass', () => {
		const target = { x: 0, value: 0 };
		let calls = 0;
		const tween = Tween.get(target, { repeat: 1, yoyo: true })
			.to({ x: 100 }, 100)
			.call(() => calls++)
			.set({ value: 1 });

		tween._tick(100);
		expect(calls).toBe(1);
		expect(target.value).toBe(1);

		tween._tick(100);
		expect(calls).toBe(1);
		expect(target.value).toBe(1);
		expect(target.x).toBe(0);
	});

	it('handles a zero-duration property step as an instant step', () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 0);

		tween._tick(0);

		expect(target.x).toBe(100);
		expect(Tween.getCount(target)).toBe(0);
	});

	it('reuses its first-pass end values while reversing a from() step', () => {
		const target = { x: 100 };
		const tween = Tween.get(target, { repeat: 1, yoyo: true }).from({ x: 0 }, 100);

		tween._tick(50);
		expect(target.x).toBe(50);

		tween._tick(50);
		expect(target.x).toBe(100);

		tween._tick(50);
		expect(target.x).toBe(50);

		tween._tick(50);
		expect(target.x).toBe(0);
		expect(Tween.getCount(target)).toBe(0);
	});
});

describe('Tween pause lifecycle', () => {
	it('tracks a tween started paused and allows removeTweens() to remove it', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { paused: true }).to({ x: 100 }, 100);

		expect(Tween.getCount(target)).toBe(1);
		tween._tick(100);
		expect(target.x).toBe(0);

		Tween.removeTweens(target);
		expect(Tween.getCount(target)).toBe(0);
		tween._tick(100);
		expect(target.x).toBe(0);
	});

	it('allows an ignoreGlobalPause tween to advance while globally paused', () => {
		const target = { x: 0 };
		const tween = Tween.get(target, { ignoreGlobalPause: true }).to({ x: 100 }, 100);

		Tween.pauseAll();
		tween._tick(100);
		Tween.resumeAll();

		expect(target.x).toBe(100);
		expect(Tween.getCount(target)).toBe(0);
	});
});

describe('Tween as a thenable', () => {
	it('resolves with undefined when the tween completes naturally', async () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);

		const done = tween.then(value => value);
		tween._tick(100);

		await expect(done).resolves.toBeUndefined();
	});

	it('allows multiple completion callbacks', async () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);
		const first = tween.then(() => 'first');
		const second = tween.then(() => 'second');

		tween._tick(100);

		await expect(Promise.all([first, second])).resolves.toEqual(['first', 'second']);
	});

	it('resolves without rejecting when removed early via remove()', async () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 1000);

		const done = tween.then(() => 'settled');
		tween.remove();

		await expect(done).resolves.toBe('settled');
	});

	it('resolves when removed via Tween.removeTweens()', async () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 1000);

		const done = tween.then(() => 'settled');
		Tween.removeTweens(target);

		await expect(done).resolves.toBe('settled');
	});

	it('supports await directly when the tween completes before then is invoked', async () => {
		const target = { x: 0 };
		const tween = Tween.get(target).to({ x: 100 }, 100);
		const done = (async (): Promise<void> => await tween)();

		tween._tick(100);

		await expect(done).resolves.toBeUndefined();
	});
});
