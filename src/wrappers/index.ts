/**
 * Progress wrappers - Adapt existing async patterns
 *
 * @example
 * ```ts
 * import {
 *   withSpinner,
 *   withProgress,
 *   wrapGenerator,
 *   wrapEmitter
 * } from "@beorn/progressx/wrappers";
 *
 * // Wrap any promise
 * const data = await withSpinner(fetchData(), "Loading...");
 *
 * // Wrap callback-based APIs (like km sync)
 * await withProgress(
 *   (onProgress) => manager.syncFromFs(onProgress),
 *   { phases: { scanning: "Scanning", reconciling: "Reconciling" } }
 * );
 *
 * // Wrap generators
 * await wrapGenerator(evaluateAllRules(), "Evaluating rules");
 *
 * // Track EventEmitter state
 * wrapEmitter(manager, { events: { ready: { succeed: true } } });
 * ```
 */

export { withSpinner, createSpinner } from "./with-spinner.js";
export { withProgress, createProgressCallback } from "./with-progress.js";
export { wrapGenerator, withIterableProgress } from "./wrap-generator.js";
export { wrapEmitter, waitForEvent } from "./wrap-emitter.js";
