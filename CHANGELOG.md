# Changelog

All notable changes to `@blakron/game` are documented here.

---

## [1.0.1] — 2026-07-27

Type-safe event listeners, mirroring the `EventMap` work shipped in `@blakron/core` 1.0.2. The game package's own event sources now declare typed event maps so listeners receive the concrete `Event` subclass without manual `as` casts. No public API shape changes — existing `(e: Event) => void` callers keep working via the inherited fallback overload.

### Added

- **URLLoader**: `URLLoaderEvents` interface mapping `Event.COMPLETE → Event`, `IOErrorEvent.IO_ERROR → IOErrorEvent`, `ProgressEvent.PROGRESS → ProgressEvent`. `URLLoader` is now `extends EventDispatcher<URLLoaderEvents>`, so `loader.addEventListener(ProgressEvent.PROGRESS, e => e.bytesLoaded)` infers `e` as `ProgressEvent`.

### Changed

- **ScrollView**: the three private touch handlers (`_handleTouchBegin` / `_handleTouchMove` / `_handleTouchEnd`) now take `(e: TouchEvent)` directly instead of `(e: Event) + const touch = e as TouchEvent`. `ScrollView` inherits `DisplayObjectEvents` from core's `DisplayObject` (via `Sprite`), which already maps `TOUCH_BEGIN/MOVE/END/CANCEL → TouchEvent`, so the cast removal is a pure type-level win — no runtime change. This clears the last `as XxxEvent` cast in the game package.
- **URLLoader**: `_handleProgress` now takes `(e: ProgressEvent)` directly; the `e as ProgressEvent` cast is gone.

### Build

- **package.json**: Bumped `@blakron/core` dependency from `^1.0.1` to `^1.0.3`. Required because the typed event maps (`DisplayObjectEvents`, `EventMap` generic on `EventDispatcher`) were introduced in core 1.0.2, and core 1.0.3 carries the `TextField` width/height getter fix.

---

## [1.0.0] — 2026-07-26

First stable release. From this version forward the public API surface (exports from `src/index.ts`) is committed to backward-compatible evolution per semver. This release aligns `@blakron/game` with `@blakron/core` 1.0 and locks the core peer dependency to `^1.0.1`.

### Fixed

- **URLLoader**: `close()` now removes the `COMPLETE` / `IO_ERROR` / `PROGRESS` listeners from the underlying `HttpRequest` before aborting it. Previously only `_imageLoader` and `_sound` were fully cleaned up; `_xhr` was only aborted and dereferenced, leaving listeners attached until the next `load()` call or GC. The three loader paths now share the same remove → close → dereference pattern.

### Build

- **package.json**: Added a `prepublishOnly` hook (`npm run clean && npm run build`) so `npm publish` always ships a freshly built `dist/`. `dist/` is gitignored, so without this hook publishing from a fresh clone or CI would emit an empty package.
- **package.json**: Filled in `author` (`Kelvin <kyia.x52@gmail.com>`) and dropped the redundant `exports.`.require` entry — the package is ESM-only, matching core 1.0.

### Notes

- This release consolidates the work shipped across 0.1.2 → 0.3.4 into a single first stable version. The 0.3.x line introduced the major features that define the 1.0 API surface:
  - **Tween** (`0.3.0`+): `repeat` / `yoyo` cycles, thenable completion (`await Tween.get(...)`), bezier solver refactor, `onChange` / `onLoopComplete` callbacks, `setPosition()` seeking, and global `pauseAll` / `resumeAll` / `removeAllTweens` controls. Pooling was refactored so finished tweens return to a pool and the global ticker registers/unregisters automatically based on active tween count.
  - **MovieClip** (`0.3.2`): refactored to **external frame scheduling** — `MovieClip` no longer owns a ticker or measures elapsed time; the game loop calls `advanceFrame()` for each logical animation frame. This keeps the engine's animation clock centralized and makes frame stepping explicit.
  - **URLLoader** (`0.3.3`+): `URLVariables` support for both GET (appended as query string) and POST (sent as form-encoded body with automatic `Content-Type` header when none is set). `close()` now aborts in-flight `HttpRequest` / `ImageLoader` / `Sound` uniformly.
- No breaking changes are introduced by 1.0.0 itself beyond the version bump. The 0.3.x API is preserved as-is; 1.0 marks the stability commitment, not a behavioural change.
- Code review (`docs/game-review.md`, internal) found no A-class issues. Three B-class improvements were noted; only B1 (URLLoader listener cleanup) was applied for this release. The other two (Tween per-frame snapshot allocation, ScrollView operator-precedence readability) are accepted as-is and tracked in the review document.

---

## Pre-1.0 versions

The 0.1.x – 0.3.x releases were developed without a changelog. The feature highlights above summarise what the 1.0 API surface inherited from them. Consult `git log` for the detailed history of those releases.

---

## Template for future releases

```
## [x.y.z] — YYYY-MM-DD

### Added
- ...

### Changed
- ...

### Fixed
- ...

### Removed
- ...
```
