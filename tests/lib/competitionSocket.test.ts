import { describe, expect, it, vi, beforeEach } from "vitest";

// vi.mock is hoisted above the module body, so the spy has to be created inside
// vi.hoisted to exist by the time the factory runs.
const { ioMock } = vi.hoisted(() => ({
  ioMock: vi.fn<(url: string, opts: Record<string, unknown>) => { connected: boolean }>(() => ({
    connected: false,
  })),
}));
vi.mock("socket.io-client", () => ({ io: ioMock }));

import { createCompetitionSocket } from "@/lib/competition/socket";

describe("createCompetitionSocket", () => {
  beforeEach(() => ioMock.mockClear());

  it("targets the Flask API origin", () => {
    createCompetitionSocket();
    expect(ioMock).toHaveBeenCalledTimes(1);
    expect(ioMock.mock.calls[0]?.[0]).toBe("http://localhost:5000");
  });

  // The socket handlers authenticate through Flask-Login's session cookie, which
  // only rides a cross-origin connection when withCredentials is set.
  it("sends credentials so the session cookie authenticates the socket", () => {
    createCompetitionSocket();
    expect(ioMock.mock.calls[0]?.[1]).toMatchObject({ withCredentials: true });
  });

  // The owning hook connects in an effect and disconnects in its cleanup, so the
  // socket must not dial on construction (StrictMode would leak a connection).
  it("does not connect on construction", () => {
    createCompetitionSocket();
    expect(ioMock.mock.calls[0]?.[1]).toMatchObject({ autoConnect: false });
  });
});
