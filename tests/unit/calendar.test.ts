import { describe, it, expect, beforeEach, vi } from "vitest";
import { db } from "@/lib/db";

const testUserId = "test_calendar_user_1";

vi.mock("@/lib/session", () => ({
  getSessionContext: vi.fn().mockResolvedValue({
    userId: testUserId,
    anonToken: "test_token",
    owner: testUserId,
    isAuthenticated: true,
  }),
}));

describe("Calendar Endpoints & Standards Compliance (Phase 3)", () => {
  beforeEach(async () => {
    // Ensure test user exists
    await db.user.upsert({
      where: { id: testUserId },
      create: {
        id: testUserId,
        email: "test_calendar@rada.example",
      },
      update: {},
    });

    // Clean up test events
    await db.calendarEvent.deleteMany({ where: { userId: testUserId } });
  });

  it("handles event creation, listing, updating, and source date-change notice (D12)", async () => {
    // 1. Create a dated source item
    const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const approvedItem = await db.item.findFirst({
      where: { status: "APPROVED" },
    });
    expect(approvedItem).toBeDefined();
    if (!approvedItem) return;

    // Set item startsAt
    await db.item.update({
      where: { id: approvedItem.id },
      data: { startsAt: futureDate },
    });

    // 2. Create calendar event linked to source item
    const { POST, GET } = await import("@/app/api/calendar/events/route");
    const createReq = new Request("http://localhost:3000/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Linked Event Test",
        startsAt: futureDate.toISOString(),
        sourceItemId: approvedItem.id,
      }),
    });

    const createRes = await POST(createReq as any);
    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    const eventId = createData.event.id;
    expect(eventId).toBeDefined();

    // 3. GET events - initially dateChangeNotice should be null
    const getReq1 = new Request("http://localhost:3000/api/calendar/events");
    const getRes1 = await GET(getReq1 as any);
    expect(getRes1.status).toBe(200);
    const getData1 = await getRes1.json();
    expect(getData1.events[0].dateChangeNotice).toBeNull();

    // 4. Simulate Decision D12: Organizer changes source item start date
    const updatedSourceDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    await db.item.update({
      where: { id: approvedItem.id },
      data: { startsAt: updatedSourceDate },
    });

    // 5. GET events again: notice must be emitted without altering user's event
    const getReq2 = new Request("http://localhost:3000/api/calendar/events");
    const getRes2 = await GET(getReq2 as any);
    const getData2 = await getRes2.json();
    const eventWithNotice = getData2.events[0];

    expect(eventWithNotice.dateChangeNotice).not.toBeNull();
    expect(eventWithNotice.dateChangeNotice.hasChanged).toBe(true);
    expect(eventWithNotice.dateChangeNotice.message).toContain("organizer updated the date");

    // 6. PATCH: Mark event done
    const { PATCH } = await import("@/app/api/calendar/events/[id]/route");
    const patchReq = new Request(`http://localhost:3000/api/calendar/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: true }),
    });

    const patchRes = await PATCH(patchReq as any, { params: { id: eventId } });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.event.doneAt).toBeDefined();
  });

  it("exports valid RFC 5545 iCalendar format via GET /api/calendar.ics", async () => {
    // Create an event
    const eventDate = new Date("2026-12-01T15:00:00Z");
    await db.calendarEvent.create({
      data: {
        userId: testUserId,
        title: "iCal Export Verification Event",
        startsAt: eventDate,
        timezone: "UTC",
        notes: "Detailed notes with commas, and newlines\ntest",
      },
    });

    const { GET } = await import("@/app/api/calendar.ics/route");
    const req = new Request("http://localhost:3000/api/calendar.ics");
    const res = await GET(req as any);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/calendar");

    const text = await res.text();

    // Verify mandatory RFC 5545 properties
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("VERSION:2.0");
    expect(text).toContain("PRODID:-//Rada//Discovery Calendar//EN");
    expect(text).toContain("BEGIN:VEVENT");
    expect(text).toContain("SUMMARY:iCal Export Verification Event");
    expect(text).toContain("DTSTART:20261201T150000Z");
    expect(text).toContain("END:VEVENT");
    expect(text).toContain("END:VCALENDAR");
    // Verify CRLF line endings
    expect(text).toContain("\r\n");
  });
});
