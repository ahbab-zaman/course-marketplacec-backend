import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  role: true,
  isEmailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class UserRepository {
  findProfileById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: userProfileSelect,
    });
  }

  updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: userProfileSelect,
    });
  }

  getLearningSummary(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        status: true,
        completionPercentage: true,
        accessGrantedAt: true,
        lastAccessedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
          },
        },
        lastLesson: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
