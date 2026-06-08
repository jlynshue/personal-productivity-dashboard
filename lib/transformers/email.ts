import { readFile } from "fs/promises";
import { join } from "path";
import { PATHS } from "@/lib/config";
import type { Email, EmailAccount } from "@/lib/data";

const DEFAULT_ACCOUNTS: EmailAccount[] = [
  {
    id: "anuba",
    label: "jonathan@anubatechnologies.com",
    lane: "anuba",
    kind: "work",
    unread: 0,
    urgent: [],
  },
  {
    id: "personal",
    label: "jonathan.lynshue@gmail.com",
    lane: "personal",
    kind: "personal",
    unread: 0,
    urgent: [],
  },
  {
    id: "consulting",
    label: "jonathan@denmother.io",
    lane: "consulting",
    kind: "clients",
    unread: 0,
    urgent: [],
  },
];

export async function loadEmail(): Promise<Email> {
  try {
    const raw = await readFile(
      join(PATHS.dashLive, "email.json"),
      "utf-8"
    );
    const accounts: EmailAccount[] = JSON.parse(raw);
    return { accounts };
  } catch {
    return { accounts: DEFAULT_ACCOUNTS };
  }
}
