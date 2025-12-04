/**
 * Index des composants partagés - Game 2.5D
 * Import centralisé de tous les composants
 */

// Core
export { Component } from './core/component.js';
export { EventEmitter, globalEvents, GameEvents } from './core/event-emitter.js';

// Rendering
export { SpriteRenderer } from './rendering/sprite-renderer.js';
export { ParallaxLayer, ParallaxManager } from './rendering/parallax-layer.js';
