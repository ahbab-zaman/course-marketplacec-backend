import { EnrollmentStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

const instructorLessonSelect = {
  id: true,
  courseId: true,
  title: true,
  summary: true,
  orderIndex: true,
  videoProvider: true,
  providerAssetId: true,
  providerPlaybackRef: true,
  durationSeconds: true,
  isPreview: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LessonSelect;

const publicLessonSelect = {
  id: true,
  courseId: true,
  title: true,
  summary: true,
  orderIndex: true,
  durationSeconds: true,
  isPreview: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LessonSelect;

const playbackLessonSelect = {
  id: true,
  courseId: true,
  title: true,
  summary: true,
  orderIndex: true,
  videoProvider: true,
  providerPlaybackRef: true,
  durationSeconds: true,
  isPreview: true,
  course: {
    select: {
      id: true,
      instructorId: true,
      status: true,
      deletedAt: true,
      title: true,
    },
  },
} satisfies Prisma.LessonSelect;

export class LessonRepository {
  findByCourseAndOrderIndex(courseId: string, orderIndex: number) {
    return prisma.lesson.findUnique({
      where: {
        courseId_orderIndex: {
          courseId,
          orderIndex,
        },
      },
      select: {
        id: true,
        courseId: true,
        orderIndex: true,
      },
    });
  }

  findById(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      select: instructorLessonSelect,
    });
  }

  findPlaybackById(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      select: playbackLessonSelect,
    });
  }

  findByCourseId(courseId: string) {
    return prisma.lesson.findMany({
      where: { courseId },
      orderBy: { orderIndex: "asc" },
      select: instructorLessonSelect,
    });
  }

  findPublicPreviewByCourseId(courseId: string) {
    return prisma.lesson.findMany({
      where: {
        courseId,
        isPreview: true,
      },
      orderBy: { orderIndex: "asc" },
      select: publicLessonSelect,
    });
  }

  create(data: Prisma.LessonCreateInput) {
    return prisma.lesson.create({
      data,
      select: instructorLessonSelect,
    });
  }

  update(id: string, data: Prisma.LessonUpdateInput) {
    return prisma.lesson.update({
      where: { id },
      data,
      select: instructorLessonSelect,
    });
  }

  delete(id: string) {
    return prisma.lesson.delete({
      where: { id },
      select: instructorLessonSelect,
    });
  }

  findActiveEnrollment(userId: string, courseId: string) {
    return prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });
  }

  isEnrollmentActive(status?: EnrollmentStatus) {
    return status === EnrollmentStatus.ACTIVE;
  }
}

export const lessonRepository = new LessonRepository();
