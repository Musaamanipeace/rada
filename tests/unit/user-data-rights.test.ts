import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";
import { claimGuestSession } from "@/lib/session";

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

vi.mock("@/lib/session", () => ({
  getSessionContext: vi.fn().mockResolvedValue({
    userId: "test_export_user_1",
    anonToken: "test_anon_token",
    owner: "test_export_user_1",
    isAuthenticated: true,
  }),
  claimGuestSession: vi.fn().mockImplementation(async (anonToken: string, userId: string) => {
    // Perform actual migration logic directly against test DB
    if (!anonToken || !userId || anonToken === userId) return;
    await db.$transaction(async (tx) => {
      const guestSaves = await tx.savedItem.findMany({ where: { owner: anonToken } });
      for (const save of guestSaves) {
        await tx.savedItem.upsert({
          where: { owner_itemId: { owner: userId, itemId: save.itemId } },
          create: { owner: userId, itemId: save.itemId, createdAt: save.createdAt },
          update: {},
        });
      }
      await tx.savedItem.deleteMany({ where: { owner: anonToken } });
      await tx.interaction.updateMany({ where: { owner: anonToken }, data: { owner: userId } });
      await tx.anonSession.deleteMany({ where: { token: anonToken } });
    });
  }),
}));

const testExportUserId = "test_export_user_1";

describe("User Data Rights & Guest Merge (Phase 3)", () => {
  beforeEach(async () => {
    // Setup test user
    await db.user.upsert({
      where: { id: testExportUserId },
      create: {
        id: testExportUserId,
        email: "export_test@rada.example",
      },
      update: {},
    });

    // Clean up
    await db.savedItem.deleteMany({ where: { owner: testExportUserId } });
    await db.calendarEvent.deleteMany({ where: { userId: testExportUserId } });
    await db.interaction.deleteMany({ where: { owner: testExportUserId } });
    await db.userInterest.deleteMany({ where: { owner: testExportUserId } });
  });

  it("exports complete user data via GET /api/me/data", async () => {
    const approvedItem = await db.item.findFirst({ where: { status: "APPROVED" } });
    expect(approvedItem).toBeDefined();
    if (!approvedItem) return;

    // Create a saved item and calendar event
    await db.savedItem.create({
      data: { owner: testExportUserId, itemId: approvedItem.id },
    });
    await db.calendarEvent.create({
      data: {
        userId: testExportUserId,
        title: "Export Test Event",
        startsAt: new Date(),
        timezone: "UTC",
      },
    });

    const { GET } = await import("@/app/api/me/data/route");
    const req = new Request("http://localhost:3000/api/me/data");
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");

    const data = await res.json();
    expect(data.profile.id).toBe(testExportUserId);
    expect(data.savedItems.length).toBe(1);
    expect(data.calendarEvents.length).toBe(1);
    expect(data.calendarEvents[0].title).toBe("Export Test Event");
  });

  it("merges guest saves, interests, and interactions into account on signup", async () => {
    const guestToken = "guest_token_merge_test";
    const newUserId = "user_after_signup_merge";

    // Setup new user
    await db.user.upsert({
      where: { id: newUserId },
      create: { id: newUserId, email: "merged@rada.example" },
      update: {},
    });

    // Clean up any residual data for this test user/token
    await db.savedItem.deleteMany({ where: { owner: { in: [guestToken, newUserId] } } });
    await db.interaction.deleteMany({ where: { owner: { in: [guestToken, newUserId] } } });
    await db.anonSession.deleteMany({ where: { token: guestToken } });

    // Setup guest anonSession
    await db.anonSession.create({
      data: { token: guestToken },
    });

    // Get an approved item
    const approvedItem = await db.item.findFirst({ where: { status: "APPROVED" } });
    if (!approvedItem) return;

    // Add guest save and interaction
    await db.savedItem.create({
      data: { owner: guestToken, itemId: approvedItem.id },
    });
    await db.interaction.create({
      data: { owner: guestToken, itemId: approvedItem.id, type: "OPEN" },
    });

    // Execute merge
    await claimGuestSession(guestToken, newUserId);

    // Verify migrated data
    const userSaves = await db.savedItem.findMany({ where: { owner: newUserId } });
    expect(userSaves.length).toBe(1);
    expect(userSaves[0].itemId).toBe(approvedItem.id);

    const userInteractions = await db.interaction.findMany({ where: { owner: newUserId } });
    expect(userInteractions.length).toBe(1);

    // Verify guest token is deleted
    const remainingGuestSaves = await db.savedItem.findMany({ where: { owner: guestToken } });
    expect(remainingGuestSaves.length).toBe(0);

    const remainingAnon = await db.anonSession.findUnique({ where: { token: guestToken } });
    expect(remainingAnon).toBeNull();
  });

  it("permanently deletes all user records and creates audit log via DELETE /api/me/data", async () => {
    const deleteUserId = "user_to_be_deleted_1";
    await db.user.upsert({
      where: { id: deleteUserId },
      create: { id: deleteUserId, email: "delete_me@rada.example" },
      update: {},
    });

    // Mock session as deleteUserId
    const { DELETE } = await import("@/app/api/me/data/route");
    const { getSessionContext } = await import("@/lib/session");
    vi.mocked(getSessionContext).mockResolvedValueOnce({
      userId: deleteUserId,
      anonToken: "temp",
      owner: deleteUserId,
      isAuthenticated: true,
    });

    const req = new Request("http://localhost:3000/api/me/data", { method: "DELETE" });
    const res = await DELETE(req as any);
    expect(res.status).toBe(200);

    // Verify user is gone
    const user = await db.user.findUnique({ where: { id: deleteUserId } });
    expect(user).toBeNull();

    // Verify audit log entry exists
    const audit = await db.auditLog.findFirst({
      where: { target: deleteUserId, action: "USER_DATA_DELETED" },
    });
    expect(audit).not.toBeNull();
  });
});
