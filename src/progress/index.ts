/**
 * Progress utilities for CLI applications
 *
 * Fluent APIs for displaying progress during async operations.
 */

// Fluent task wrappers
export { task, type TaskWrapper } from "./task.js";
export { tasks, type TaskBuilder, type RunOptions } from "./tasks.js";

// Re-export CLI progress components
export {
  Spinner,
  createSpinner,
  type CallableSpinner,
} from "../cli/spinner.js";
export { ProgressBar } from "../cli/progress-bar.js";
export { MultiProgress, type TaskHandle } from "../cli/multi-progress.js";

// Re-export types
export type { ProgressInfo } from "../types.js";
