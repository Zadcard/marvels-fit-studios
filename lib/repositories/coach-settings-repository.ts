import "server-only";

import type { CoachSettingsRecord } from "@/lib/mocks/coach-settings";
import { getPrisma } from "@/lib/prisma";

function toCoachSpecializationLabel(
  specialization: "STRENGTH" | "CONDITIONING" | "MOBILITY" | "PRIVATE_COACHING"
) {
  switch (specialization) {
    case "CONDITIONING":
      return "Conditioning";
    case "MOBILITY":
      return "Mobility";
    case "PRIVATE_COACHING":
      return "Private Coaching";
    default:
      return "Strength";
  }
}

export class CoachSettingsRepository {
  private prisma = getPrisma();

  async getByUserId(userId: string): Promise<CoachSettingsRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        coachProfile: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            specialization: true,
          },
        },
      },
    });

    if (!user?.coachProfile) {
      return null;
    }

    return {
      fullName: user.coachProfile.fullName,
      roleLabel: "Coach",
      email: user.email ?? "No email",
      phone: user.coachProfile.phone ?? "No phone",
      bio: "Coach profile details are now persisted through your main account fields.",
      specialization: toCoachSpecializationLabel(user.coachProfile.specialization),
      preferredView: "Sessions list",
      reminderLeadTime: "30 minutes",
      availabilityNote: "Availability is currently coordinated through assigned sessions and schedules.",
      mobileAlerts: true,
      clientCheckIns: true,
      waitlistFlags: true,
    };
  }
}

export const coachSettingsRepository = new CoachSettingsRepository();
