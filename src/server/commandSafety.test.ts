import { describe, expect, it } from "vitest";
import { evaluateCommandExecution, inferCommandSafety, maxSafety } from "./commandSafety";

describe("command safety", () => {
  it("classifies read-only commands as SOFT", () => {
    expect(inferCommandSafety("journalctl -n 20")).toBe("SOFT");
    expect(inferCommandSafety("ip addr")).toBe("SOFT");
  });

  it("classifies system-changing commands as MODERATE", () => {
    expect(inferCommandSafety("sudo pacman -S nginx")).toBe("MODERATE");
    expect(inferCommandSafety("systemctl restart NetworkManager")).toBe("MODERATE");
  });

  it("classifies destructive commands as CRITICAL", () => {
    expect(inferCommandSafety("rm -rf /")).toBe("CRITICAL");
    expect(inferCommandSafety("mkfs.ext4 /dev/sda1")).toBe("CRITICAL");
    expect(inferCommandSafety("dd if=/dev/zero of=/dev/sda")).toBe("CRITICAL");
  });

  it("keeps the higher risk level", () => {
    expect(maxSafety("SOFT", "CRITICAL")).toBe("CRITICAL");
    expect(maxSafety("MODERATE", "SOFT")).toBe("MODERATE");
  });

  it("blocks critical commands even if the model claims they are soft", () => {
    const result = evaluateCommandExecution({
      command: "rm -rf /",
      claimedSafety: "SOFT",
      confirmed: true,
    });

    expect(result.allowed).toBe(false);
    expect(result.safety).toBe("CRITICAL");
  });

  it("requires confirmation for moderate commands", () => {
    const result = evaluateCommandExecution({
      command: "systemctl restart NetworkManager",
      claimedSafety: "MODERATE",
      confirmed: false,
    });

    expect(result.allowed).toBe(false);
    expect(result.safety).toBe("MODERATE");
  });
});

