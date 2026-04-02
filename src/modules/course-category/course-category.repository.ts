import { Prisma } from "@prisma/client";
import { prisma } from "../../database/prisma";

const courseCategorySelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      courses: true,
    },
  },
} satisfies Prisma.CourseCategorySelect;

export class CourseCategoryRepository {
  findMany(skip: number, take: number, includeInactive: boolean) {
    return prisma.courseCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: "asc" },
      skip,
      take,
      select: courseCategorySelect,
    });
  }

  count(includeInactive: boolean) {
    return prisma.courseCategory.count({
      where: includeInactive ? {} : { isActive: true },
    });
  }

  findById(id: string) {
    return prisma.courseCategory.findUnique({
      where: { id },
      select: courseCategorySelect,
    });
  }

  findBySlug(slug: string) {
    return prisma.courseCategory.findUnique({
      where: { slug },
      select: courseCategorySelect,
    });
  }

  create(data: Prisma.CourseCategoryCreateInput) {
    return prisma.courseCategory.create({
      data,
      select: courseCategorySelect,
    });
  }

  update(id: string, data: Prisma.CourseCategoryUpdateInput) {
    return prisma.courseCategory.update({
      where: { id },
      data,
      select: courseCategorySelect,
    });
  }
}

export const courseCategoryRepository = new CourseCategoryRepository();
