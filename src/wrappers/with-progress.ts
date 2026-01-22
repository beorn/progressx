/**
 * withProgress - Wrap callback-based progress functions
 *
 * This is the main wrapper for existing km patterns like:
 * - manager.syncFromFs((info) => ...)
 * - rebuildState((info) => ...)
 */

import type { ProgressInfo, ProgressCallback, WithProgressOptions } from "../types.js";
import { ProgressBar } from "../cli/progress-bar.js";
import {
  CURSOR_HIDE,
  CURSOR_SHOW,
  write,
  isTTY,
} from "../cli/ansi.js";

/**
 * Wrap a function that takes a progress callback
 *
 * @example
 * ```ts
 * // Wrap existing km sync API
 * const result = await withProgress(
 *   (onProgress) => manager.syncFromFs(onProgress),
 *   {
 *     phases: {
 *       scanning: "Scanning files",
 *       reconciling: "Reconciling changes",
 *       rules: "Evaluating rules"
 *     }
 *   }
 * );
 *
 * // Simple usage without phases
 * await withProgress((onProgress) => rebuildState(onProgress));
 *
 * // With custom format
 * await withProgress(
 *   (p) => processFiles(p),
 *   { format: ":phase :bar :percent" }
 * );
 * ```
 */
export async function withProgress<T>(
  fn: (onProgress: ProgressCallback) => T | Promise<T>,
  options: WithProgressOptions = {},
): Promise<T> {
  const stream = process.stdout;
  const isTty = isTTY(stream);

  // Determine format
  const format = options.format ?? (
    options.phases
      ? ":phase [:bar] :current/:total"
      : "[:bar] :current/:total :percent"
  );

  const bar = new ProgressBar({
    format,
    phases: options.phases ?? {},
    hideCursor: true,
  });

  let lastPhase: string | null = null;
  let started = false;

  // Hide cursor
  if (isTty) {
    write(CURSOR_HIDE, stream);
  }

  const onProgress: ProgressCallback = (info: ProgressInfo) => {
    // Handle phase transitions
    if (info.phase && info.phase !== lastPhase) {
      if (lastPhase !== null && isTty) {
        // Print newline before switching phases
        write("\n", stream);
      }
      lastPhase = info.phase;

      // Start or update bar with new phase
      if (!started) {
        bar.start(info.current, info.total);
        started = true;
      }
      bar.setPhase(info.phase, { current: info.current, total: info.total });
    } else {
      if (!started) {
        bar.start(info.current, info.total);
        started = true;
      }
      bar.update(info.current);
    }
  };

  try {
    const result = await fn(onProgress);

    // Stop and show cursor
    if (started) {
      bar.stop(options.clearOnComplete);
    }
    if (isTty) {
      write(CURSOR_SHOW, stream);
    }

    return result;
  } catch (error) {
    // Restore cursor on error
    if (started) {
      bar.stop();
    }
    if (isTty) {
      write(CURSOR_SHOW, stream);
    }
    throw error;
  }
}

/**
 * Create a progress callback that can be passed to existing APIs
 * Returns [callback, complete] tuple
 *
 * @example
 * ```ts
 * const [onProgress, complete] = createProgressCallback({
 *   phases: { scanning: "Scanning", reconciling: "Reconciling" }
 * });
 *
 * const result = await manager.syncFromFs(onProgress);
 * complete();
 * ```
 */
export function createProgressCallback(
  options: WithProgressOptions = {},
): [ProgressCallback, () => void] {
  const stream = process.stdout;
  const isTty = isTTY(stream);

  const format = options.format ?? (
    options.phases
      ? ":phase [:bar] :current/:total"
      : "[:bar] :current/:total :percent"
  );

  const bar = new ProgressBar({
    format,
    phases: options.phases ?? {},
    hideCursor: true,
  });

  let lastPhase: string | null = null;
  let started = false;

  if (isTty) {
    write(CURSOR_HIDE, stream);
  }

  const callback: ProgressCallback = (info: ProgressInfo) => {
    if (info.phase && info.phase !== lastPhase) {
      if (lastPhase !== null && isTty) {
        write("\n", stream);
      }
      lastPhase = info.phase;

      if (!started) {
        bar.start(info.current, info.total);
        started = true;
      }
      bar.setPhase(info.phase, { current: info.current, total: info.total });
    } else {
      if (!started) {
        bar.start(info.current, info.total);
        started = true;
      }
      bar.update(info.current);
    }
  };

  const complete = () => {
    if (started) {
      bar.stop(options.clearOnComplete);
    }
    if (isTty) {
      write(CURSOR_SHOW, stream);
    }
  };

  return [callback, complete];
}
