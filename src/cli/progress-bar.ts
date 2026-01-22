/**
 * CLI ProgressBar - Determinate progress indicator with ETA
 */

import chalk from "chalk";
import type { ProgressBarOptions } from "../types.js";
import {
  CURSOR_HIDE,
  CURSOR_SHOW,
  CURSOR_TO_START,
  CLEAR_LINE_END,
  write,
  isTTY,
  getTerminalWidth,
} from "./ansi.js";

/** Default format string */
const DEFAULT_FORMAT = ":bar :percent | :current/:total | ETA: :eta";

/**
 * ProgressBar class for CLI progress indication
 *
 * @example
 * ```ts
 * const bar = new ProgressBar({ total: 100 });
 * bar.start();
 * for (let i = 0; i <= 100; i++) {
 *   await doWork();
 *   bar.update(i);
 * }
 * bar.stop();
 * ```
 */
export class ProgressBar {
  private total: number;
  private format: string;
  private width: number;
  private complete: string;
  private incomplete: string;
  private stream: NodeJS.WriteStream;
  private hideCursor: boolean;
  private phases: Record<string, string>;

  private current = 0;
  private phase: string | null = null;
  private startTime: number | null = null;
  private isActive = false;

  // ETA smoothing - track last N update times
  private readonly etaBufferSize = 10;
  private etaBuffer: { time: number; value: number }[] = [];

  constructor(options: ProgressBarOptions = {}) {
    this.total = options.total ?? 100;
    this.format = options.format ?? DEFAULT_FORMAT;
    this.width = options.width ?? 40;
    this.complete = options.complete ?? "█";
    this.incomplete = options.incomplete ?? "░";
    this.stream = options.stream ?? process.stdout;
    this.hideCursor = options.hideCursor ?? true;
    this.phases = options.phases ?? {};
  }

  /**
   * Start the progress bar
   */
  start(initialValue = 0, initialTotal?: number): this {
    if (initialTotal !== undefined) {
      this.total = initialTotal;
    }

    this.current = initialValue;
    this.startTime = Date.now();
    this.isActive = true;
    this.etaBuffer = [{ time: this.startTime, value: initialValue }];

    if (this.hideCursor && isTTY(this.stream)) {
      write(CURSOR_HIDE, this.stream);
    }

    this.render();
    return this;
  }

  /**
   * Update progress value
   */
  update(value: number, tokens?: Record<string, string | number>): this {
    this.current = Math.min(value, this.total);

    // Update ETA buffer
    const now = Date.now();
    this.etaBuffer.push({ time: now, value: this.current });
    if (this.etaBuffer.length > this.etaBufferSize) {
      this.etaBuffer.shift();
    }

    if (this.isActive) {
      this.render(tokens);
    }

    return this;
  }

  /**
   * Increment progress by amount (default: 1)
   */
  increment(amount = 1, tokens?: Record<string, string | number>): this {
    return this.update(this.current + amount, tokens);
  }

  /**
   * Set the current phase (for multi-phase progress)
   */
  setPhase(
    phaseName: string,
    options?: { current?: number; total?: number },
  ): this {
    this.phase = phaseName;

    if (options?.total !== undefined) {
      this.total = options.total;
    }
    if (options?.current !== undefined) {
      this.current = options.current;
      // Reset ETA buffer on phase change
      this.etaBuffer = [{ time: Date.now(), value: this.current }];
    }

    if (this.isActive) {
      this.render();
    }

    return this;
  }

  /**
   * Stop the progress bar
   */
  stop(clear = false): this {
    if (!this.isActive) {
      return this;
    }

    this.isActive = false;

    if (clear && isTTY(this.stream)) {
      write(`${CURSOR_TO_START}${CLEAR_LINE_END}`, this.stream);
    } else {
      write("\n", this.stream);
    }

    if (this.hideCursor && isTTY(this.stream)) {
      write(CURSOR_SHOW, this.stream);
    }

    return this;
  }

  /**
   * Calculate ETA in seconds using smoothed rate
   */
  private calculateETA(): number | null {
    if (this.etaBuffer.length < 2) {
      return null;
    }

    const first = this.etaBuffer[0];
    const last = this.etaBuffer[this.etaBuffer.length - 1];

    const elapsed = (last.time - first.time) / 1000; // seconds
    const progress = last.value - first.value;

    if (elapsed <= 0 || progress <= 0) {
      return null;
    }

    const rate = progress / elapsed; // items per second
    const remaining = this.total - this.current;

    return remaining / rate;
  }

  /**
   * Format ETA for display
   */
  private formatETA(eta: number | null): string {
    if (eta === null || !isFinite(eta)) {
      return "--:--";
    }

    if (eta > 86400) {
      // > 24 hours
      return ">1d";
    }

    const hours = Math.floor(eta / 3600);
    const minutes = Math.floor((eta % 3600) / 60);
    const seconds = Math.floor(eta % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  /**
   * Render the progress bar
   */
  private render(tokens?: Record<string, string | number>): void {
    const percent = this.total > 0 ? this.current / this.total : 0;
    const eta = this.calculateETA();

    // Build the bar
    const completeLength = Math.round(this.width * percent);
    const incompleteLength = this.width - completeLength;
    const bar =
      this.complete.repeat(completeLength) +
      this.incomplete.repeat(incompleteLength);

    // Get phase display name
    const phaseDisplay = this.phase
      ? this.phases[this.phase] ?? this.phase
      : "";

    // Calculate rate
    const elapsed = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const rate = elapsed > 0 ? this.current / elapsed : 0;

    // Replace tokens in format string
    let output = this.format
      .replace(":bar", chalk.cyan(bar))
      .replace(":percent", `${Math.round(percent * 100)}%`.padStart(4))
      .replace(":current", String(this.current))
      .replace(":total", String(this.total))
      .replace(":eta", this.formatETA(eta))
      .replace(":elapsed", this.formatETA(elapsed))
      .replace(":rate", rate.toFixed(1))
      .replace(":phase", chalk.dim(phaseDisplay));

    // Replace custom tokens
    if (tokens) {
      for (const [key, value] of Object.entries(tokens)) {
        output = output.replace(`:${key}`, String(value));
      }
    }

    // Truncate to terminal width
    const termWidth = getTerminalWidth(this.stream);
    if (output.length > termWidth) {
      output = output.slice(0, termWidth - 1);
    }

    if (isTTY(this.stream)) {
      write(`${CURSOR_TO_START}${output}${CLEAR_LINE_END}`, this.stream);
    }
  }

  /**
   * Get current progress ratio (0-1)
   */
  get ratio(): number {
    return this.total > 0 ? this.current / this.total : 0;
  }

  /**
   * Get current progress percentage (0-100)
   */
  get percentage(): number {
    return Math.round(this.ratio * 100);
  }
}
