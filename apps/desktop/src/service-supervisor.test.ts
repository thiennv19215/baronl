import { describe, expect, it, vi } from "vitest";
import { ServiceSupervisor } from "./service-supervisor";
import type { StructuredLogger } from "./logger";

describe("service supervisor", () => {
  it("restarts only after consecutive failed health checks", async () => {
    const restart = vi.fn(async () => undefined);
    let healthy = false;
    const logger = { warn: vi.fn(), error: vi.fn() } as unknown as StructuredLogger;
    const supervisor = new ServiceSupervisor(logger, 60_000, 2);
    supervisor.register({ name: "worker", healthy: () => healthy, restart });

    await supervisor.checkNow();
    expect(restart).not.toHaveBeenCalled();
    await supervisor.checkNow();
    expect(restart).toHaveBeenCalledTimes(1);

    healthy = true;
    await supervisor.checkNow();
    expect(supervisor.snapshot().worker).toMatchObject({ failures: 0, restarts: 1, restarting: false });
  });
});
