import { describe, expect, it } from "vitest";
import { isNotificationChannel } from "@/lib/notification-domain";

describe("notification domain boundaries", () => {
  it("accepts only supported delivery channels", () => {
    expect(isNotificationChannel("IN_APP")).toBe(true);
    expect(isNotificationChannel("EMAIL")).toBe(true);
    expect(isNotificationChannel("carrier-pigeon")).toBe(false);
  });

  it("keeps marketing preference separate from transactional channels", () => {
    expect(isNotificationChannel("SMS")).toBe(true);
    expect(isNotificationChannel("PUSH")).toBe(true);
    expect(isNotificationChannel("MARKETING")).toBe(false);
  });
});
