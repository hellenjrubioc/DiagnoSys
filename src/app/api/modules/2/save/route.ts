import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { resolveScopedUserForDiagnostics, ScopedUserError } from "@/lib/consultant-scope";

interface BaseItemInput {
  name: string;
}

interface SaveRequestBody {
  opportunities?: BaseItemInput[];
  needs?: BaseItemInput[];
  problems?: BaseItemInput[];
  forceUpdate?: boolean;
}

function getDayRange(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return { startOfDay, endOfDay };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = new URL(req.url).searchParams.get("organizationId");
    const scopedUser = await resolveScopedUserForDiagnostics(session.user.id, organizationId);

    const [lastOpportunity, lastNeed, lastProblem] = await Promise.all([
      prisma.opportunity.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.need.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.problem.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const latestDate = [lastOpportunity?.createdAt, lastNeed?.createdAt, lastProblem?.createdAt]
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];

    if (!latestDate) {
      return NextResponse.json({
        hasData: false,
        opportunities: [],
        needs: [],
        problems: [],
      });
    }

    const { startOfDay, endOfDay } = getDayRange(latestDate);

    const [opportunities, needs, problems] = await Promise.all([
      prisma.opportunity.findMany({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
        orderBy: { id: "asc" },
        select: { name: true },
      }),
      prisma.need.findMany({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
        orderBy: { id: "asc" },
        select: { name: true },
      }),
      prisma.problem.findMany({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
        orderBy: { id: "asc" },
        select: { name: true },
      }),
    ]);

    return NextResponse.json({
      hasData: true,
      savedAt: latestDate,
      opportunities,
      needs,
      problems,
    });
  } catch (error) {
    if (error instanceof ScopedUserError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = new URL(req.url).searchParams.get("organizationId");
    const scopedUser = await resolveScopedUserForDiagnostics(session.user.id, organizationId);

    const body: SaveRequestBody = await req.json();
    const { opportunities, needs, problems, forceUpdate = false } = body;

    const { startOfDay, endOfDay } = getDayRange(new Date());

    const [opportunitiesToday, needsToday, problemsToday] = await Promise.all([
      prisma.opportunity.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.need.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.problem.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
    ]);

    const hasTodayData = opportunitiesToday + needsToday + problemsToday > 0;

    if (hasTodayData && !forceUpdate) {
      return NextResponse.json(
        {
          error: "You already saved categorization data today.",
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const cleanNames = (items?: BaseItemInput[]) =>
      (items ?? [])
        .map((item) => ({ name: item.name?.trim() ?? "" }))
        .filter((item) => item.name.length > 0);

    const cleanOpportunities = cleanNames(opportunities);
    const cleanNeeds = cleanNames(needs);
    const cleanProblems = cleanNames(problems);

    await prisma.$transaction(async (tx) => {
      if (hasTodayData) {
        await Promise.all([
          tx.opportunity.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.need.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.problem.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
        ]);
      }

      if (cleanOpportunities.length) {
        await tx.opportunity.createMany({
          data: cleanOpportunities.map((o) => ({
            name: o.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }

      if (cleanNeeds.length) {
        await tx.need.createMany({
          data: cleanNeeds.map((n) => ({
            name: n.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }

      if (cleanProblems.length) {
        await tx.problem.createMany({
          data: cleanProblems.map((p) => ({
            name: p.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }
    });

    return NextResponse.json({
      message: hasTodayData
        ? "Categorization data updated successfully"
        : "Categorization data saved successfully",
      updated: hasTodayData,
    });
  } catch (error) {
    if (error instanceof ScopedUserError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
