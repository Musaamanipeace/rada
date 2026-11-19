import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionContext } from "@/lib/session";

/**
 * Formats a Date object into an RFC 5545 iCalendar UTC date-time string: YYYYMMDDTHHMMSSZ
 */
function formatIcsDateTime(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/**
 * Escapes characters per RFC 5545 Section 3.3.11
 */
function escapeIcsText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * GET /api/calendar.ics
 * Exports the authenticated user's calendar events as a standard RFC 5545 iCalendar stream.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionContext();
  const userId = session.userId;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const events = await db.calendarEvent.findMany({
    where: { userId },
    include: {
      sourceItem: {
        select: {
          url: true,
          sourceName: true,
        },
      },
    },
    orderBy: { startsAt: "asc" },
  });

  const nowIcs = formatIcsDateTime(new Date());

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rada//Discovery Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Rada Calendar",
    "X-WR-TIMEZONE:UTC",
  ];

  for (const event of events) {
    const dtStamp = formatIcsDateTime(event.createdAt);
    const dtStart = formatIcsDateTime(event.startsAt);
    const dtEnd = event.endsAt
      ? formatIcsDateTime(event.endsAt)
      : formatIcsDateTime(new Date(event.startsAt.getTime() + 60 * 60 * 1000)); // Default 1hr duration

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@rada.example`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);

    let description = event.notes || "";
    if (event.sourceItem?.url) {
      description += (description ? "\\n\\n" : "") + `Link: ${event.sourceItem.url}`;
    }
    if (description) {
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    }

    if (event.sourceItem?.url) {
      lines.push(`URL:${event.sourceItem.url}`);
    }

    if (event.doneAt) {
      lines.push("STATUS:COMPLETED");
    } else {
      lines.push("STATUS:CONFIRMED");
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 specifies CRLF line endings
  const icsBody = lines.join("\r\n") + "\r\n";

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rada-calendar.ics"',
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}
