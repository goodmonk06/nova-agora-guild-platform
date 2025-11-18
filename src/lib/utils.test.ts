import { describe, it, expect } from "vitest";
import { formatDistanceToNow, slugify } from "./utils";

describe("formatDistanceToNow", () => {
  it("returns 'たった今' for dates less than 60 seconds ago", () => {
    const date = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    expect(formatDistanceToNow(date)).toBe("たった今");
  });

  it("returns minutes for dates less than 60 minutes ago", () => {
    const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago
    expect(formatDistanceToNow(date)).toBe("5分前");
  });

  it("returns hours for dates less than 24 hours ago", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
    expect(formatDistanceToNow(date)).toBe("3時間前");
  });

  it("returns days for dates less than 7 days ago", () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    expect(formatDistanceToNow(date)).toBe("2日前");
  });

  it("returns weeks for dates less than 30 days ago", () => {
    const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
    expect(formatDistanceToNow(date)).toBe("2週間前");
  });

  it("returns months for dates less than 365 days ago", () => {
    const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago
    expect(formatDistanceToNow(date)).toBe("2ヶ月前");
  });

  it("returns years for dates over 365 days ago", () => {
    const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000); // 400 days ago
    expect(formatDistanceToNow(date)).toBe("1年前");
  });
});

describe("slugify", () => {
  it("converts text to lowercase slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("This is a test")).toBe("this-is-a-test");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });

  it("handles multiple consecutive spaces", () => {
    expect(slugify("Multiple   Spaces")).toBe("multiple-spaces");
  });

  it("removes leading and trailing hyphens", () => {
    expect(slugify("  Trimmed  ")).toBe("trimmed");
  });

  it("handles Japanese characters by removing them", () => {
    expect(slugify("こんにちは World")).toBe("world");
  });

  it("handles numbers correctly", () => {
    expect(slugify("Project 123")).toBe("project-123");
  });

  it("returns empty string for non-alphanumeric input", () => {
    expect(slugify("!@#$%")).toBe("");
  });
});
