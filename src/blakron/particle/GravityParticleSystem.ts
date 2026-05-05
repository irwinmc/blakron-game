import { NumberUtils, Rectangle, Texture } from '@blakron/core';
import { GravityParticle } from './GravityParticle.js';
import { Particle } from './Particle.js';
import { ParticleSystem } from './ParticleSystem.js';

// ── Helper ────────────────────────────────────────────────────────────────────

function getValue(value: unknown): number {
	if (typeof value === 'undefined') return 0;
	return value as number;
}

// ── GravityParticleSystem ─────────────────────────────────────────────────────

export class GravityParticleSystem extends ParticleSystem {
	// ── Private fields ────────────────────────────────────────────────────────

	private emitterXVariance!: number;
	private emitterYVariance!: number;

	private lifespan!: number;
	private lifespanVariance!: number;

	private startSize!: number;
	private startSizeVariance!: number;
	private endSize!: number;
	private endSizeVariance!: number;

	private emitAngle!: number;
	private emitAngleVariance!: number;

	private startRotation!: number;
	private startRotationVariance!: number;
	private endRotation!: number;
	private endRotationVariance!: number;

	private speed!: number;
	private speedVariance!: number;

	private gravityX!: number;
	private gravityY!: number;

	private radialAcceleration!: number;
	private radialAccelerationVariance!: number;
	private tangentialAcceleration!: number;
	private tangentialAccelerationVariance!: number;

	private startAlpha!: number;
	private startAlphaVariance!: number;
	private endAlpha!: number;
	private endAlphaVariance!: number;

	private particleBlendMode!: number;

	// ── Constructor ───────────────────────────────────────────────────────────

	public constructor(texture: Texture, config: any) {
		super(texture, 200);
		this.parseConfig(config);
		this.emissionRate = this.lifespan / this.maxParticles;
		this.particleClass = GravityParticle;
	}

	// ── Public methods ────────────────────────────────────────────────────────

	public override initParticle(particle: Particle): void {
		const locParticle = particle as GravityParticle;

		const lifespan = GravityParticleSystem.getValue(this.lifespan, this.lifespanVariance);

		locParticle.currentTime = 0;
		locParticle.totalTime = lifespan > 0 ? lifespan : 0;

		if (lifespan <= 0) return;

		locParticle.x = GravityParticleSystem.getValue(this.emitterX, this.emitterXVariance);
		locParticle.y = GravityParticleSystem.getValue(this.emitterY, this.emitterYVariance);
		locParticle.startX = this.emitterX;
		locParticle.startY = this.emitterY;

		const angle = GravityParticleSystem.getValue(this.emitAngle, this.emitAngleVariance);
		const speed = GravityParticleSystem.getValue(this.speed, this.speedVariance);
		locParticle.velocityX = speed * NumberUtils.cos(angle);
		locParticle.velocityY = speed * NumberUtils.sin(angle);

		locParticle.radialAcceleration = GravityParticleSystem.getValue(
			this.radialAcceleration,
			this.radialAccelerationVariance,
		);
		locParticle.tangentialAcceleration = GravityParticleSystem.getValue(
			this.tangentialAcceleration,
			this.tangentialAccelerationVariance,
		);

		let startSize = GravityParticleSystem.getValue(this.startSize, this.startSizeVariance);
		if (startSize < 0.1) startSize = 0.1;
		let endSize = GravityParticleSystem.getValue(this.endSize, this.endSizeVariance);
		if (endSize < 0.1) endSize = 0.1;

		const textureWidth = this.texture.textureWidth;
		locParticle.scale = startSize / textureWidth;
		locParticle.scaleDelta = (endSize - startSize) / lifespan / textureWidth;

		const startRotation = GravityParticleSystem.getValue(this.startRotation, this.startRotationVariance);
		const endRotation = GravityParticleSystem.getValue(this.endRotation, this.endRotationVariance);
		locParticle.rotation = startRotation;
		locParticle.rotationDelta = (endRotation - startRotation) / lifespan;

		const startAlpha = GravityParticleSystem.getValue(this.startAlpha, this.startAlphaVariance);
		const endAlpha = GravityParticleSystem.getValue(this.endAlpha, this.endAlphaVariance);

		locParticle.alpha = startAlpha;
		locParticle.alphaDelta = (endAlpha - startAlpha) / lifespan;

		locParticle.blendMode = this.particleBlendMode;
	}

	public override advanceParticle(particle: Particle, dt: number): void {
		const locParticle = particle as GravityParticle;
		const dtSec = dt / 1000;

		const restTime = locParticle.totalTime - locParticle.currentTime;
		const actualDt = restTime > dtSec ? dtSec : restTime;
		locParticle.currentTime += actualDt;

		const distanceX = locParticle.x - locParticle.startX;
		const distanceY = locParticle.y - locParticle.startY;
		let distanceScalar = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
		if (distanceScalar < 0.01) distanceScalar = 0.01;

		let radialX = distanceX / distanceScalar;
		let radialY = distanceY / distanceScalar;

		const tangentialX = radialX;
		const tangentialY = radialY;

		radialX *= locParticle.radialAcceleration;
		radialY *= locParticle.radialAcceleration;

		const temp = tangentialX;
		const finalTangentialX = -tangentialY * locParticle.tangentialAcceleration;
		const finalTangentialY = temp * locParticle.tangentialAcceleration;

		locParticle.velocityX += actualDt * (this.gravityX + radialX + finalTangentialX);
		locParticle.velocityY += actualDt * (this.gravityY + radialY + finalTangentialY);
		locParticle.x += locParticle.velocityX * actualDt;
		locParticle.y += locParticle.velocityY * actualDt;

		locParticle.scale += locParticle.scaleDelta * actualDt * 1000;
		if (locParticle.scale < 0) locParticle.scale = 0;
		locParticle.rotation += locParticle.rotationDelta * actualDt * 1000;
		locParticle.alpha += locParticle.alphaDelta * actualDt * 1000;
	}

	// ── Private methods ───────────────────────────────────────────────────────

	private parseConfig(config: any): void {
		this.emitterX = getValue(config.emitter.x);
		this.emitterY = getValue(config.emitter.y);
		this.emitterXVariance = getValue(config.emitterVariance.x);
		this.emitterYVariance = getValue(config.emitterVariance.y);

		this.gravityX = getValue(config.gravity.x);
		this.gravityY = getValue(config.gravity.y);

		if (config.useEmitterRect === true) {
			const bounds = new Rectangle();
			bounds.x = getValue(config.emitterRect.x);
			bounds.y = getValue(config.emitterRect.y);
			bounds.width = getValue(config.emitterRect.width);
			bounds.height = getValue(config.emitterRect.height);
			this.emitterBounds = bounds;
		}

		this.maxParticles = getValue(config.maxParticles);

		this.speed = getValue(config.speed);
		this.speedVariance = getValue(config.speedVariance);

		this.lifespan = Math.max(0.01, getValue(config.lifespan));
		this.lifespanVariance = getValue(config.lifespanVariance);

		this.emitAngle = getValue(config.emitAngle);
		this.emitAngleVariance = getValue(config.emitAngleVariance);

		this.startSize = getValue(config.startSize);
		this.startSizeVariance = getValue(config.startSizeVariance);
		this.endSize = getValue(config.endSize);
		this.endSizeVariance = getValue(config.endSizeVariance);

		this.startRotation = getValue(config.startRotation);
		this.startRotationVariance = getValue(config.startRotationVariance);
		this.endRotation = getValue(config.endRotation);
		this.endRotationVariance = getValue(config.endRotationVariance);

		this.radialAcceleration = getValue(config.radialAcceleration);
		this.radialAccelerationVariance = getValue(config.radialAccelerationVariance);
		this.tangentialAcceleration = getValue(config.tangentialAcceleration);
		this.tangentialAccelerationVariance = getValue(config.tangentialAccelerationVariance);

		this.startAlpha = getValue(config.startAlpha);
		this.startAlphaVariance = getValue(config.startAlphaVariance);
		this.endAlpha = getValue(config.endAlpha);
		this.endAlphaVariance = getValue(config.endAlphaVariance);

		this.particleBlendMode = getValue(config.blendMode);
	}

	private static getValue(base: number, variance: number): number {
		return base + variance * (Math.random() * 2 - 1);
	}
}
