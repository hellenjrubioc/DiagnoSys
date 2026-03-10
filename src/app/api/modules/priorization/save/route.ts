import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { resolveScopedUserForDiagnostics, ScopedUserError } from "@/lib/consultant-scope";

interface BaseItemInput {
  name: string;
}

interface SaveRequestBody {
  highPriority?: BaseItemInput[];
  mediumPriority?: BaseItemInput[];
  lowPriority?: BaseItemInput[];
  mediumPriority2?: BaseItemInput[]; // segundo grupo "Medium priority"
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

    const [lastHigh, lastMedium, lastLow, lastMedium2] = await Promise.all([
      prisma.highPriority.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.mediumPriority.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.lowPriority.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.mediumPriority2.findFirst({
        where: { userId: scopedUser.targetUserId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const latestDate = [
      lastHigh?.createdAt,
      lastMedium?.createdAt,
      lastLow?.createdAt,
      lastMedium2?.createdAt,
    ]
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0];

    if (!latestDate) {
      return NextResponse.json({
        hasData: false,
        highPriority: [],
        mediumPriority: [],
        lowPriority: [],
        mediumPriority2: [],
      });
    }

    const { startOfDay, endOfDay } = getDayRange(latestDate);

    const [highPriority, mediumPriority, lowPriority, mediumPriority2] =
      await Promise.all([
        prisma.highPriority.findMany({
          where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          orderBy: { id: "asc" },
          select: { name: true },
        }),
        prisma.mediumPriority.findMany({
          where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          orderBy: { id: "asc" },
          select: { name: true },
        }),
        prisma.lowPriority.findMany({
          where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          orderBy: { id: "asc" },
          select: { name: true },
        }),
        prisma.mediumPriority2.findMany({
          where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          orderBy: { id: "asc" },
          select: { name: true },
        }),
      ]);

    return NextResponse.json({
      hasData: true,
      savedAt: latestDate,
      highPriority,
      mediumPriority,
      lowPriority,
      mediumPriority2,
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
    const {
      highPriority,
      mediumPriority,
      lowPriority,
      mediumPriority2,
      forceUpdate = false,
    } = body;

    const { startOfDay, endOfDay } = getDayRange(new Date());

    const [highToday, mediumToday, lowToday, medium2Today] = await Promise.all([
      prisma.highPriority.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.mediumPriority.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.lowPriority.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
      prisma.mediumPriority2.count({
        where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
      }),
    ]);

    const hasTodayData = highToday + mediumToday + lowToday + medium2Today > 0;

    if (hasTodayData && !forceUpdate) {
      return NextResponse.json(
        {
          error: "You already saved prioritization data today.",
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    const cleanNames = (items?: BaseItemInput[]) =>
      (items ?? [])
        .map((item) => ({ name: item.name?.trim() ?? "" }))
        .filter((item) => item.name.length > 0);

    const cleanHighPriority = cleanNames(highPriority);
    const cleanMediumPriority = cleanNames(mediumPriority);
    const cleanLowPriority = cleanNames(lowPriority);
    const cleanMediumPriority2 = cleanNames(mediumPriority2);

    await prisma.$transaction(async (tx) => {
      if (hasTodayData) {
        await Promise.all([
          tx.highPriority.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.mediumPriority.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.lowPriority.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
          tx.mediumPriority2.deleteMany({
            where: { userId: scopedUser.targetUserId, createdAt: { gte: startOfDay, lt: endOfDay } },
          }),
        ]);
      }

      if (cleanHighPriority.length) {
        await tx.highPriority.createMany({
          data: cleanHighPriority.map((item) => ({
            name: item.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }

      if (cleanMediumPriority.length) {
        await tx.mediumPriority.createMany({
          data: cleanMediumPriority.map((item) => ({
            name: item.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }

      if (cleanLowPriority.length) {
        await tx.lowPriority.createMany({
          data: cleanLowPriority.map((item) => ({
            name: item.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }

      if (cleanMediumPriority2.length) {
        await tx.mediumPriority2.createMany({
          data: cleanMediumPriority2.map((item) => ({
            name: item.name,
            userId: scopedUser.targetUserId,
          })),
        });
      }
    });

    return NextResponse.json({
      message: hasTodayData
        ? "Prioritization data updated successfully"
        : "Prioritization data saved successfully",
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
