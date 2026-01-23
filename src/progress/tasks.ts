/**
 * Fluent sequential task builder
 *
 * Run multiple tasks in sequence with progress display.
 *
 * @example
 * ```typescript
 * import { tasks } from "@beorn/inkx-ui/progress";
 *
 * const results = await tasks()
 *   .add("Loading modules", () => Promise.all([
 *     import("./moduleA"),
 *     import("./moduleB"),
 *   ]))
 *   .add("Processing data", function* () {
 *     for (let i = 0; i < 100; i++) {
 *       yield { current: i, total: 100 };
 *       processItem(i);
 *     }
 *     return finalResult;
 *   })
 *   .run({ clear: true });
 * ```
 */

import type { ProgressInfo } from "../types.js";
import { MultiProgress, type TaskHandle } from "../cli/multi-progress.js";

/** Phase labels for common operations */
const PHASE_LABELS: Record<string, string> = {
  reading: "Reading events",
  applying: "Applying events",
  rules: "Evaluating rules",
  scanning: "Scanning files",
  reconciling: "Reconciling changes",
  board: "Building view",
};

/** Task definition */
interface TaskDef<T = unknown> {
  title: string;
  work: () => T | PromiseLike<T> | Generator<ProgressInfo, T, unknown>;
}

/** Options for run() */
export interface RunOptions {
  /** Clear progress display after completion (default: false) */
  clear?: boolean;
}

export interface TaskBuilder {
  /**
   * Add a task to the sequence
   * @param title - Display title
   * @param work - Function, async function, or generator
   */
  add<T>(
    title: string,
    work: () => T | PromiseLike<T> | Generator<ProgressInfo, T, unknown>,
  ): TaskBuilder;

  /**
   * Run all tasks in sequence
   * @param options - Run options
   * @returns Results keyed by task title
   */
  run(options?: RunOptions): Promise<Record<string, unknown>>;
}

/**
 * Create a sequential task builder
 *
 * @returns TaskBuilder with add() and run() methods
 */
export function tasks(): TaskBuilder {
  const taskList: TaskDef[] = [];

  const builder: TaskBuilder = {
    add<T>(
      title: string,
      work: () => T | PromiseLike<T> | Generator<ProgressInfo, T, unknown>,
    ): TaskBuilder {
      taskList.push({ title, work });
      return builder;
    },

    async run(options?: RunOptions): Promise<Record<string, unknown>> {
      const multi = new MultiProgress();
      const handles = new Map<string, TaskHandle>();
      const results: Record<string, unknown> = {};

      // Register all tasks upfront (shows pending state)
      for (const task of taskList) {
        handles.set(task.title, multi.add(task.title, { type: "spinner" }));
      }

      multi.start();

      try {
        for (const task of taskList) {
          const handle = handles.get(task.title)!;
          handle.start();

          // Force render before potentially blocking operation
          await new Promise((r) => setImmediate(r));

          const result = task.work();

          if (isGenerator(result)) {
            results[task.title] = await runGenerator(
              result,
              handle,
              task.title,
            );
          } else if (isPromiseLike(result)) {
            results[task.title] = await result;
          } else {
            results[task.title] = result;
          }

          handle.complete();
        }
      } finally {
        multi.stop(options?.clear ?? false);
      }

      return results;
    },
  };

  return builder;
}

/**
 * Run a generator task with progress updates
 */
async function runGenerator<T>(
  gen: Generator<ProgressInfo, T, unknown>,
  handle: TaskHandle,
  baseTitle: string,
): Promise<T> {
  let result = gen.next();

  while (!result.done) {
    const info = result.value;
    const phase = info.phase ?? "";
    const phaseLabel = PHASE_LABELS[phase] ?? (phase || baseTitle);

    // Update title with phase and progress count
    if (info.total && info.total > 0) {
      handle.setTitle(`${phaseLabel} (${info.current}/${info.total})`);
    } else {
      handle.setTitle(phaseLabel);
    }

    // Yield to event loop for animation
    await new Promise((r) => setImmediate(r));

    result = gen.next();
  }

  // Reset title on completion
  handle.setTitle(baseTitle);

  return result.value;
}

function isGenerator(
  value: unknown,
): value is Generator<ProgressInfo, unknown, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Generator).next === "function" &&
    typeof (value as Generator).throw === "function"
  );
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}
