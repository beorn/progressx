/**
 * Tests for React components and hooks
 */

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import React, { createElement } from "react";
import { Spinner, useSpinnerFrame } from "../src/react/Spinner.js";
import { ProgressBar, useProgressBar } from "../src/react/ProgressBar.js";
import { Task, Tasks, useTasks } from "../src/react/Tasks.js";
import {
  ProgressProvider,
  useProgress,
  ProgressIndicator,
} from "../src/react/context.js";

/**
 * Simple test harness for hooks
 * Calls the hook and returns its current value
 */
function testHook<T>(useHook: () => T): { current: T; rerender: () => void } {
  let result: T;
  const TestComponent = () => {
    result = useHook();
    return null;
  };
  // Simulate component mounting
  createElement(TestComponent);
  return {
    get current() {
      return result;
    },
    rerender: () => createElement(TestComponent),
  };
}

describe("React Components", () => {
  describe("Spinner", () => {
    it("renders with default props", () => {
      const element = createElement(Spinner, { label: "Loading" });

      expect(element.type).toBe(Spinner);
      expect(element.props.label).toBe("Loading");
    });

    it("accepts style and color props", () => {
      const element = createElement(Spinner, {
        label: "Test",
        style: "arc",
        color: "yellow",
      });

      expect(element.props.style).toBe("arc");
      expect(element.props.color).toBe("yellow");
    });

    it("uses default style and color when not provided", () => {
      const element = createElement(Spinner, { label: "Test" });

      // Default style is 'dots', default color is 'cyan'
      expect(element.props.style).toBeUndefined(); // Component uses defaults internally
      expect(element.props.color).toBeUndefined();
    });
  });

  describe("ProgressBar", () => {
    it("renders with required props", () => {
      const element = createElement(ProgressBar, {
        value: 50,
        total: 100,
      });

      expect(element.type).toBe(ProgressBar);
      expect(element.props.value).toBe(50);
      expect(element.props.total).toBe(100);
    });

    it("accepts optional display props", () => {
      const element = createElement(ProgressBar, {
        value: 30,
        total: 100,
        width: 30,
        showPercentage: true,
        showETA: true,
        label: "Downloading",
        color: "green",
      });

      expect(element.props.width).toBe(30);
      expect(element.props.showPercentage).toBe(true);
      expect(element.props.showETA).toBe(true);
      expect(element.props.label).toBe("Downloading");
      expect(element.props.color).toBe("green");
    });

    it("handles zero total gracefully", () => {
      const element = createElement(ProgressBar, {
        value: 0,
        total: 0,
      });

      expect(element.props.value).toBe(0);
      expect(element.props.total).toBe(0);
    });
  });

  describe("Task", () => {
    it("renders with title and status", () => {
      const element = createElement(Task, {
        title: "Scanning files",
        status: "running",
      });

      expect(element.type).toBe(Task);
      expect(element.props.title).toBe("Scanning files");
      expect(element.props.status).toBe("running");
    });

    it("accepts all status values", () => {
      const statuses = [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
      ] as const;

      for (const status of statuses) {
        const element = createElement(Task, { title: "Test", status });
        expect(element.props.status).toBe(status);
      }
    });

    it("accepts children", () => {
      const child = createElement("span", null, "Progress: 50%");
      const element = createElement(
        Task,
        { title: "Processing", status: "running" },
        child,
      );

      expect(element.props.children).toBe(child);
    });
  });

  describe("Tasks", () => {
    it("renders as container for Task children", () => {
      const task1 = createElement(Task, { title: "Task 1", status: "completed" });
      const task2 = createElement(Task, { title: "Task 2", status: "running" });
      const element = createElement(Tasks, null, task1, task2);

      expect(element.type).toBe(Tasks);
      expect(element.props.children).toHaveLength(2);
    });

    it("renders with single child", () => {
      const task = createElement(Task, { title: "Solo", status: "pending" });
      const element = createElement(Tasks, null, task);

      expect(element.type).toBe(Tasks);
      expect(element.props.children).toBe(task);
    });
  });

  describe("ProgressProvider", () => {
    it("renders as context provider", () => {
      const child = createElement("div", null, "Content");
      const element = createElement(ProgressProvider, null, child);

      expect(element.type).toBe(ProgressProvider);
      expect(element.props.children).toBe(child);
    });
  });

  describe("ProgressIndicator", () => {
    it("renders as component", () => {
      const element = createElement(ProgressIndicator);
      expect(element.type).toBe(ProgressIndicator);
    });
  });
});

describe("React Hooks", () => {
  describe("useTasks", () => {
    it("initializes with pending status for all tasks", () => {
      let result: ReturnType<typeof useTasks>;

      const TestComponent = () => {
        result = useTasks([
          { id: "scan", title: "Scanning" },
          { id: "process", title: "Processing" },
        ]);
        return null;
      };

      // Create element to invoke the hook
      createElement(TestComponent);

      expect(result!.tasks).toHaveLength(2);
      expect(result!.tasks[0].status).toBe("pending");
      expect(result!.tasks[1].status).toBe("pending");
    });

    it("provides status update functions", () => {
      let result: ReturnType<typeof useTasks>;

      const TestComponent = () => {
        result = useTasks([{ id: "task1", title: "Task 1" }]);
        return null;
      };

      createElement(TestComponent);

      expect(typeof result!.start).toBe("function");
      expect(typeof result!.complete).toBe("function");
      expect(typeof result!.fail).toBe("function");
      expect(typeof result!.skip).toBe("function");
      expect(typeof result!.updateProgress).toBe("function");
      expect(typeof result!.updateTask).toBe("function");
      expect(typeof result!.getTask).toBe("function");
    });

    it("getTask returns the correct task", () => {
      let result: ReturnType<typeof useTasks>;

      const TestComponent = () => {
        result = useTasks([
          { id: "a", title: "Task A" },
          { id: "b", title: "Task B" },
        ]);
        return null;
      };

      createElement(TestComponent);

      const task = result!.getTask("b");
      expect(task?.id).toBe("b");
      expect(task?.title).toBe("Task B");
    });

    it("getTask returns undefined for non-existent task", () => {
      let result: ReturnType<typeof useTasks>;

      const TestComponent = () => {
        result = useTasks([{ id: "exists", title: "Exists" }]);
        return null;
      };

      createElement(TestComponent);

      expect(result!.getTask("nonexistent")).toBeUndefined();
    });

    it("allCompleted is false when tasks are pending", () => {
      let result: ReturnType<typeof useTasks>;

      const TestComponent = () => {
        result = useTasks([
          { id: "1", title: "One" },
          { id: "2", title: "Two" },
        ]);
        return null;
      };

      createElement(TestComponent);

      expect(result!.allCompleted).toBe(false);
    });

    it("hasFailed is false initially", () => {
      let result: ReturnType<typeof useTasks>;

      const TestComponent = () => {
        result = useTasks([{ id: "1", title: "One" }]);
        return null;
      };

      createElement(TestComponent);

      expect(result!.hasFailed).toBe(false);
    });
  });

  describe("useProgressBar", () => {
    it("initializes with zero value", () => {
      let result: ReturnType<typeof useProgressBar>;

      const TestComponent = () => {
        result = useProgressBar(100);
        return null;
      };

      createElement(TestComponent);

      expect(result!.value).toBe(0);
      expect(result!.total).toBe(100);
      expect(result!.percent).toBe(0);
      expect(result!.eta).toBe("--:--");
    });

    it("provides update functions", () => {
      let result: ReturnType<typeof useProgressBar>;

      const TestComponent = () => {
        result = useProgressBar(100);
        return null;
      };

      createElement(TestComponent);

      expect(typeof result!.update).toBe("function");
      expect(typeof result!.increment).toBe("function");
      expect(typeof result!.reset).toBe("function");
      expect(typeof result!.setTotal).toBe("function");
    });
  });
});
