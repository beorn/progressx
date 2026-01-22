/**
 * MultiProgress - Container for managing multiple concurrent progress indicators
 */

import chalk from "chalk";
import type { SpinnerStyle, TaskStatus } from "../types.js";
import {
  CURSOR_HIDE,
  CURSOR_SHOW,
  CLEAR_LINE,
  cursorUp,
  write,
  isTTY,
} from "./ansi.js";
import { Spinner, SPINNER_FRAMES } from "./spinner.js";
import { ProgressBar } from "./progress-bar.js";

/** Status icons */
const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: chalk.gray("○"),
  running: "", // Will be replaced with spinner frame
  completed: chalk.green("✔"),
  failed: chalk.red("✖"),
  skipped: chalk.yellow("⊘"),
};

/** Task configuration */
interface TaskConfig {
  title: string;
  type: "spinner" | "bar";
  status: TaskStatus;
  total?: number;
  current?: number;
  spinnerStyle?: SpinnerStyle;
}

/** Internal task state */
interface TaskState extends TaskConfig {
  id: string;
}

/**
 * MultiProgress - Manage multiple concurrent progress indicators
 *
 * @example
 * ```ts
 * const multi = new MultiProgress();
 *
 * const download = multi.add("Downloading files", { type: "bar", total: 100 });
 * const process = multi.add("Processing", { type: "spinner" });
 *
 * download.start();
 * download.update(50);
 * download.complete();
 *
 * process.start();
 * process.complete();
 *
 * multi.stop();
 * ```
 */
export class MultiProgress {
  private tasks: Map<string, TaskState> = new Map();
  private taskOrder: string[] = [];
  private stream: NodeJS.WriteStream;
  private isActive = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private frameIndex = 0;
  private renderedLines = 0;

  constructor(stream: NodeJS.WriteStream = process.stdout) {
    this.stream = stream;
  }

  /**
   * Add a new task
   */
  add(
    title: string,
    options: {
      type?: "spinner" | "bar";
      total?: number;
      spinnerStyle?: SpinnerStyle;
    } = {},
  ): TaskHandle {
    const id = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const task: TaskState = {
      id,
      title,
      type: options.type ?? "spinner",
      status: "pending",
      total: options.total,
      current: 0,
      spinnerStyle: options.spinnerStyle ?? "dots",
    };

    this.tasks.set(id, task);
    this.taskOrder.push(id);

    if (this.isActive) {
      this.render();
    }

    return new TaskHandle(this, id);
  }

  /**
   * Start the multi-progress display
   */
  start(): this {
    if (this.isActive) {
      return this;
    }

    this.isActive = true;

    if (isTTY(this.stream)) {
      write(CURSOR_HIDE, this.stream);
    }

    this.render();

    // Start animation timer
    this.timer = setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % 10;
      this.render();
    }, 80);

    return this;
  }

  /**
   * Stop the multi-progress display
   */
  stop(): this {
    if (!this.isActive) {
      return this;
    }

    this.isActive = false;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    // Final render
    this.render();
    write("\n", this.stream);

    if (isTTY(this.stream)) {
      write(CURSOR_SHOW, this.stream);
    }

    return this;
  }

  /** @internal Update task state */
  _updateTask(id: string, updates: Partial<TaskState>): void {
    const task = this.tasks.get(id);
    if (task) {
      Object.assign(task, updates);
      if (this.isActive) {
        this.render();
      }
    }
  }

  /** @internal Get task state */
  _getTask(id: string): TaskState | undefined {
    return this.tasks.get(id);
  }

  private render(): void {
    if (!isTTY(this.stream)) {
      return;
    }

    // Move cursor up to clear previous render
    if (this.renderedLines > 0) {
      write(cursorUp(this.renderedLines), this.stream);
    }

    const lines: string[] = [];

    for (const id of this.taskOrder) {
      const task = this.tasks.get(id);
      if (!task) continue;

      let icon: string;
      if (task.status === "running") {
        const frames = SPINNER_FRAMES[task.spinnerStyle ?? "dots"];
        icon = chalk.cyan(frames[this.frameIndex % frames.length]);
      } else {
        icon = STATUS_ICONS[task.status];
      }

      let line = `${icon} ${task.title}`;

      // Add progress bar for bar type
      if (task.type === "bar" && task.total && task.total > 0) {
        const percent = task.current! / task.total;
        const barWidth = 20;
        const filled = Math.round(barWidth * percent);
        const empty = barWidth - filled;
        const bar = chalk.cyan("█".repeat(filled)) + chalk.gray("░".repeat(empty));
        line += ` ${bar} ${Math.round(percent * 100)}%`;
      }

      lines.push(line);
    }

    // Clear and write each line
    for (const line of lines) {
      write(`${CLEAR_LINE}${line}\n`, this.stream);
    }

    this.renderedLines = lines.length;
  }
}

/**
 * Handle for controlling an individual task
 */
class TaskHandle {
  constructor(
    private multi: MultiProgress,
    private id: string,
  ) {}

  /** Start the task (set status to running) */
  start(): this {
    this.multi._updateTask(this.id, { status: "running" });
    return this;
  }

  /** Update progress (for bar type) */
  update(current: number): this {
    this.multi._updateTask(this.id, { current });
    return this;
  }

  /** Mark task as completed */
  complete(title?: string): this {
    const updates: Partial<TaskState> = { status: "completed" };
    if (title) updates.title = title;
    this.multi._updateTask(this.id, updates);
    return this;
  }

  /** Mark task as failed */
  fail(title?: string): this {
    const updates: Partial<TaskState> = { status: "failed" };
    if (title) updates.title = title;
    this.multi._updateTask(this.id, updates);
    return this;
  }

  /** Mark task as skipped */
  skip(title?: string): this {
    const updates: Partial<TaskState> = { status: "skipped" };
    if (title) updates.title = title;
    this.multi._updateTask(this.id, updates);
    return this;
  }

  /** Update task title */
  setTitle(title: string): this {
    this.multi._updateTask(this.id, { title });
    return this;
  }

  /** Get current status */
  get status(): TaskStatus {
    return this.multi._getTask(this.id)?.status ?? "pending";
  }
}

export type { TaskHandle };
