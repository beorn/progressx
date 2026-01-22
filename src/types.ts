/**
 * Core types for progressx
 */

/** Progress info passed to callbacks (matches km pattern) */
export interface ProgressInfo {
  phase?: string;
  current: number;
  total: number;
  detail?: string;
}

/** Callback signature for progress reporting */
export type ProgressCallback = (info: ProgressInfo) => void;

/** Generator that yields progress info */
export type ProgressGenerator<T = void> = Generator<
  { current: number; total: number },
  T,
  unknown
>;

/** Spinner animation styles */
export type SpinnerStyle = "dots" | "line" | "arc" | "bounce" | "pulse";

/** Task status for multi-task display */
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

/** Options for Spinner class */
export interface SpinnerOptions {
  /** Initial text to display */
  text?: string;
  /** Animation style */
  style?: SpinnerStyle;
  /** Spinner color (chalk color name) */
  color?: string;
  /** Output stream (default: process.stdout) */
  stream?: NodeJS.WriteStream;
  /** Hide cursor during spinner (default: true) */
  hideCursor?: boolean;
  /** Animation interval in ms (default: 80) */
  interval?: number;
}

/** Options for ProgressBar class */
export interface ProgressBarOptions {
  /** Total value for progress calculation */
  total?: number;
  /** Format string with placeholders: :bar :percent :current :total :eta :rate :phase */
  format?: string;
  /** Width of the progress bar in characters (default: 40) */
  width?: number;
  /** Character for completed portion (default: "█") */
  complete?: string;
  /** Character for incomplete portion (default: "░") */
  incomplete?: string;
  /** Show percentage (default: true) */
  showPercentage?: boolean;
  /** Show ETA (default: true) */
  showETA?: boolean;
  /** Output stream (default: process.stdout) */
  stream?: NodeJS.WriteStream;
  /** Hide cursor during progress (default: true) */
  hideCursor?: boolean;
  /** Phase names for multi-phase progress */
  phases?: Record<string, string>;
}

/** Options for withSpinner wrapper */
export interface WithSpinnerOptions {
  /** Spinner style */
  style?: SpinnerStyle;
  /** Clear the spinner output on completion */
  clearOnComplete?: boolean;
  /** Color for the spinner */
  color?: string;
}

/** Options for withProgress wrapper */
export interface WithProgressOptions {
  /** Map of phase keys to display names */
  phases?: Record<string, string>;
  /** Format string for progress bar */
  format?: string;
  /** Clear output on completion */
  clearOnComplete?: boolean;
}

/** Task state for Tasks component */
export interface TaskState {
  id: string;
  title: string;
  status: TaskStatus;
  progress?: { current: number; total: number };
  error?: Error;
  children?: TaskState[];
}

/** Props for React Spinner component */
export interface SpinnerProps {
  /** Label text to display */
  label?: string;
  /** Animation style */
  style?: SpinnerStyle;
  /** Spinner color */
  color?: string;
}

/** Props for React ProgressBar component */
export interface ProgressBarProps {
  /** Current value */
  value: number;
  /** Total value */
  total: number;
  /** Width in characters */
  width?: number;
  /** Show percentage */
  showPercentage?: boolean;
  /** Show ETA */
  showETA?: boolean;
  /** Label text */
  label?: string;
  /** Color for completed portion */
  color?: string;
}

/** Props for React Task component */
export interface TaskProps {
  /** Task title */
  title: string;
  /** Task status */
  status: TaskStatus;
  /** Children (e.g., nested progress bar) */
  children?: React.ReactNode;
}
