import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

import { readFile } from "fs/promises";
import { loadEmail } from "@/lib/transformers/email";

const mockedReadFile = vi.mocked(readFile);

describe("email transformer — loadEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses email accounts from JSON when file exists", async () => {
    const emailData = [
      {
        id: "work",
        label: "jon@anuba.dev",
        lane: "anuba",
        kind: "work",
        unread: 14,
        urgent: [
          { from: "Investor", subject: "Follow up on deck", days: 3, need: "reply" },
        ],
      },
      {
        id: "personal",
        label: "jon@gmail.com",
        lane: "personal",
        kind: "personal",
        unread: 42,
        urgent: [],
      },
    ];
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(emailData));

    const result = await loadEmail();
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts[0].id).toBe("work");
    expect(result.accounts[0].unread).toBe(14);
    expect(result.accounts[0].urgent).toHaveLength(1);
    expect(result.accounts[0].urgent[0].need).toBe("reply");
    expect(result.accounts[1].unread).toBe(42);
  });

  it("returns default accounts when file read fails", async () => {
    mockedReadFile.mockRejectedValueOnce(new Error("ENOENT: no such file"));

    const result = await loadEmail();
    expect(result.accounts).toHaveLength(3);
    // Default accounts should have zero unread and empty urgent arrays
    for (const account of result.accounts) {
      expect(account.unread).toBe(0);
      expect(account.urgent).toHaveLength(0);
    }
  });

  it("returns default accounts when JSON is malformed", async () => {
    mockedReadFile.mockResolvedValueOnce("{ invalid json [}");

    const result = await loadEmail();
    // JSON.parse will throw, caught by the try/catch
    expect(result.accounts).toHaveLength(3);
    expect(result.accounts[0].id).toBe("anuba");
  });

  it("preserves urgent item structure with all required fields", async () => {
    const emailData = [
      {
        id: "consulting",
        label: "jon@lynshue.co",
        lane: "consulting",
        kind: "clients",
        unread: 5,
        urgent: [
          { from: "Client A", subject: "Invoice overdue", days: 14, need: "send" },
          { from: "Client B", subject: "SOW review", days: 2, need: "decide" },
        ],
      },
    ];
    mockedReadFile.mockResolvedValueOnce(JSON.stringify(emailData));

    const result = await loadEmail();
    const urgent = result.accounts[0].urgent;
    expect(urgent).toHaveLength(2);
    expect(urgent[0]).toEqual({
      from: "Client A",
      subject: "Invoice overdue",
      days: 14,
      need: "send",
    });
    expect(urgent[1].need).toBe("decide");
  });

  it("handles empty accounts array in JSON", async () => {
    mockedReadFile.mockResolvedValueOnce(JSON.stringify([]));

    const result = await loadEmail();
    expect(result.accounts).toHaveLength(0);
  });
});
