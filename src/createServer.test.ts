import { describe, test, expect } from "vitest";
import { createServer } from "./createServer.js";

describe("createServer", () => {
  test("returns a Server with a connect method", () => {
    const server = createServer("/tmp/fake-vault");
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe("function");
  });

  test("accepts custom name and version options", () => {
    const server = createServer("/tmp/fake-vault", {
      name: "custom-server",
      version: "1.2.3",
    });
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe("function");
  });

  test("works with default options (no options argument)", () => {
    const server = createServer("/tmp/fake-vault");
    expect(server).toBeDefined();
  });
});
