import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const authSession = await getServerSession(authOptions);
  const userRole = (authSession?.user as any)?.role;
  const mockRoleHeader = req.headers.get("x-mock-role");

  const effectiveRole = userRole || (process.env.NODE_ENV !== "production" ? mockRoleHeader : null);

  if (effectiveRole !== "reviewer" && effectiveRole !== "admin") {
    return apiError("FORBIDDEN", "Reviewer or admin role required", 403);
  }

  // 1. Fetch pending survey suggestions
  const pendingSuggestions = await db.surveySuggestion.findMany({
    where: { status: "PENDING" },
    include: {
      subcategory: {
        include: {
          category: true,
          topics: true,
        },
      },
      topic: true,
    },
    orderBy: { sessionId: "asc" },
    take: 50,
  });

  // 2. Fetch pending items (from CSV imports or pending user submissions)
  const pendingItems = await db.item.findMany({
    where: { status: "PENDING" },
    include: {
      category: true,
      subcategory: true,
      topic: true,
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  // 3. Compute subcategory coverage toward the target of >= 10 approved items per subcategory
  const allSubcategories = await db.subcategory.findMany({
    include: {
      category: true,
      _count: {
        select: {
          items: {
            where: { status: "APPROVED" },
          },
        },
      },
    },
    orderBy: [{ category: { sort: "asc" } }, { sort: "asc" }],
  });

  const coverage = allSubcategories.map((sub) => ({
    subcategoryId: sub.id,
    subcategoryName: sub.name,
    categoryName: sub.category.name,
    approvedCount: sub._count.items,
    target: 10,
    targetMet: sub._count.items >= 10,
  }));

  const totalApproved = coverage.reduce((acc, c) => acc + c.approvedCount, 0);
  const totalSubcategories = coverage.length;
  const metSubcategories = coverage.filter((c) => c.targetMet).length;

  return apiSuccess(
    {
      pendingSuggestions,
      pendingItems,
      coverage,
      summary: {
        totalApproved,
        totalSubcategories,
        metSubcategories,
        percentComplete: Math.round((metSubcategories / totalSubcategories) * 100),
      },
    },
    200
  );
}
