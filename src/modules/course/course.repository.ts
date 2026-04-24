import { CourseStatus, Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma.js";

const publicCourseSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnail: true,
  price: true,
  status: true,
  publishedAt: true,
  avgRating: true,
  totalReviews: true,
  enrollmentCount: true,
  createdAt: true,
  updatedAt: true,
  instructor: {
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  _count: {
    select: {
      lessons: true,
      reviews: true,
    },
  },
} satisfies Prisma.CourseSelect;

const managedCourseSelect = {
  id: true,
  instructorId: true,
  title: true,
  slug: true,
  shortDescription: true,
  description: true,
  thumbnail: true,
  price: true,
  status: true,
  submittedAt: true,
  publishedAt: true,
  rejectionReason: true,
  avgRating: true,
  totalReviews: true,
  enrollmentCount: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  instructor: {
    select: {
      id: true,
      name: true,
      avatar: true,
      email: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
  },
  _count: {
    select: {
      lessons: true,
      reviews: true,
      enrollments: true,
    },
  },
} satisfies Prisma.CourseSelect;

export class CourseRepository {
  findPublicMany(where: Prisma.CourseWhereInput, skip: number, take: number, orderBy: Prisma.CourseOrderByWithRelationInput[]) {
    return prisma.course.findMany({
      where,
      skip,
      take,
      orderBy,
      select: publicCourseSelect,
    });
  }

  countPublic(where: Prisma.CourseWhereInput) {
    return prisma.course.count({ where });
  }

  findPublicBySlugOrId(slugOrId: string) {
    return prisma.course.findFirst({
      where: {
        deletedAt: null,
        status: CourseStatus.PUBLISHED,
        OR: [{ id: slugOrId }, { slug: slugOrId }],
      },
      select: publicCourseSelect,
    });
  }

  findManagedById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      select: managedCourseSelect,
    });
  }

  findMine(where: Prisma.CourseWhereInput, skip: number, take: number, orderBy: Prisma.CourseOrderByWithRelationInput[]) {
    return prisma.course.findMany({
      where,
      skip,
      take,
      orderBy,
      select: managedCourseSelect,
    });
  }

  countMine(where: Prisma.CourseWhereInput) {
    return prisma.course.count({ where });
  }

  findBySlug(slug: string) {
    return prisma.course.findFirst({
      where: {
        slug,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
      },
    });
  }

  findByIdForEnrollment(id: string) {
    return prisma.course.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        status: true,
        price: true,
      },
    });
  }

  create(data: Prisma.CourseCreateInput) {
    return prisma.course.create({
      data,
      select: managedCourseSelect,
    });
  }

  update(id: string, data: Prisma.CourseUpdateInput) {
    return prisma.course.update({
      where: { id },
      data,
      select: managedCourseSelect,
    });
  }

  findEnrollment(userId: string, courseId: string) {
    return prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    });
  }

  createEnrollment(userId: string, courseId: string) {
    return prisma.enrollment.create({
      data: {
        userId,
        courseId,
        status: "ACTIVE",
        accessGrantedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        courseId: true,
        status: true,
        accessGrantedAt: true,
      },
    });
  }
}

export const courseRepository = new CourseRepository();
