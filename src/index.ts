/**
 * progressx - Ergonomic progress indicators for Node.js CLI and React TUI apps
 *
 * @example
 * ```ts
 * // CLI usage
 * import { Spinner, ProgressBar } from "@beorn/progressx/cli";
 * import { withSpinner, withProgress } from "@beorn/progressx/wrappers";
 *
 * // Quick spinner
 * const data = await withSpinner(fetchData(), "Loading...");
 *
 * // Wrap callback-based APIs
 * await withProgress((p) => syncFromFs(p), { phases: { ... } });
 *
 * // React/TUI usage
 * import { Spinner, ProgressBar } from "@beorn/progressx/react";
 * <Spinner label="Loading..." />
 * ```
 *
 * @packageDocumentation
 */

// Re-export everything for convenience
export * from "./types.js";
export * from "./cli/index.js";
export * from "./wrappers/index.js";

// Note: React components should be imported from "@beorn/progressx/react"
// to avoid requiring React as a dependency for CLI-only usage
