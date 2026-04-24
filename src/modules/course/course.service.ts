import { CourseStatus, Prisma, Role } from "@prisma/client";
import ApiError from "../../shared/errors/api-error.js";
import { getPagination } from "../../shared/utils/pagination.js";
import { courseCategoryRepository } from "../course-category/course-category.repository.js";
import {
  CourseListQuery,
  CreateCourseDTO,
  MyCourseListQuery,
  UpdateCourseDTO,
} from "./course.types.js";
import { courseRepository } from "./course.repository.js";

type AuthenticatedUser = {
  id: string;
  role: Role;
};

const PUBLIC_SORT_MAP: Record<
  NonNullable<CourseListQuery["sort"]>,
  Prisma.CourseOrderByWithRelationInput[]
> = {
  newest: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  oldest: [{ publishedAt: "asc" }, { createdAt: "asc" }],
  price_asc: [{ price: "asc" }, { createdAt: "desc" }],
  price_desc: [{ price: "desc" }, { createdAt: "desc" }],
  rating_desc: [{ avgRating: "desc" }, { totalReviews: "desc" }],
  popular_desc: [{ enrollmentCount: "desc" }, { createdAt: "desc" }],
};

const MANAGE_SORT_MAP: Record<
  NonNullable<MyCourseListQuery["sort"]>,
  Prisma.CourseOrderByWithRelationInput[]
> = {
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  updated_desc: [{ updatedAt: "desc" }],
  price_asc: [{ price: "asc" }, { createdAt: "desc" }],
  price_desc: [{ price: "desc" }, { createdAt: "desc" }],
};

function slugifyTitle(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "course";
}

export class CourseService {
  private async ensureActiveCategory(categoryId?: string | null) {
    if (!categoryId) {
      return null;
    }

    const category = await courseCategoryRepository.findById(categoryId);
    if (!category || !category.isActive) {
      throw new ApiError(400, "Course category is invalid or inactive");
    }

    return category;
  }

  private async generateUniqueSlug(title: string, excludeCourseId?: string) {
    const baseSlug = slugifyTitle(title);

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
      const existing = await courseRepository.findBySlug(candidate);

      if (!existing || existing.id === excludeCourseId) {
        return candidate;
      }
    }

    throw new ApiError(500, "Unable to generate a unique course slug");
  }

  private ensureCourseOwner(course: { instructorId: string }, user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (course.instructorId !== user.id) {
      throw new ApiError(403, "You can only manage your own courses");
    }
  }

  private ensureInstructorCanMutate(status: CourseStatus, action: "update" | "delete") {
    const mutableStatuses: CourseStatus[] = [
      CourseStatus.DRAFT,
      CourseStatus.REJECTED,
    ];

    if (!mutableStatuses.includes(status)) {
      throw new ApiError(
        409,
        `Course cannot be ${action}d while it is ${status.toLowerCase()}`,
      );
    }
  }

  async createCourse(user: AuthenticatedUser, payload: CreateCourseDTO) {
    await this.ensureActiveCategory(payload.categoryId);
    const slug = await this.generateUniqueSlug(payload.title);

    return courseRepository.create({
      title: payload.title,
      slug,
      shortDescription: payload.shortDescription ?? null,
      description: payload.description,
      thumbnail: payload.thumbnail ?? null,
      price: payload.price,
      instructor: {
        connect: { id: user.id },
      },
      ...(payload.categoryId
        ? {
            category: {
              connect: { id: payload.categoryId },
            },
          }
        : {}),
    });
  }

  async getPublicCourses(query: CourseListQuery) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      status: CourseStatus.PUBLISHED,
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                shortDescription: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.categorySlug
        ? {
            category: {
              slug: query.categorySlug,
              isActive: true,
            },
          }
        : {}),
      ...(query.instructorId ? { instructorId: query.instructorId } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? {
            price: {
              ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
              ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
            },
          }
        : {}),
    };

    const orderBy = PUBLIC_SORT_MAP[query.sort ?? "newest"];
    const [courses, total] = await Promise.all([
      courseRepository.findPublicMany(where, skip, take, orderBy),
      courseRepository.countPublic(where),
    ]);

    return {
      courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicCourseDetail(slugOrId: string) {
    const course = await courseRepository.findPublicBySlugOrId(slugOrId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    return course;
  }

  async getMyCourses(user: AuthenticatedUser, query: MyCourseListQuery) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.CourseWhereInput = {
      deletedAt: null,
      instructorId: user.id,
      ...(query.search
        ? {
            OR: [
              {
                title: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
              {
                description: {
                  contains: query.search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const orderBy = MANAGE_SORT_MAP[query.sort ?? "updated_desc"];
    const [courses, total] = await Promise.all([
      courseRepository.findMine(where, skip, take, orderBy),
      courseRepository.countMine(where),
    ]);

    return {
      courses,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateCourse(user: AuthenticatedUser, courseId: string, payload: UpdateCourseDTO) {
    const course = await courseRepository.findManagedById(courseId);
    if (!course || course.deletedAt) {
      throw new ApiError(404, "Course not found");
    }

    this.ensureCourseOwner(course, user);
    if (user.role !== Role.ADMIN) {
      this.ensureInstructorCanMutate(course.status, "update");
    }

    if (payload.categoryId !== undefined) {
      await this.ensureActiveCategory(payload.categoryId);
    }

    const nextSlug =
      payload.title && payload.title !== course.title
        ? await this.generateUniqueSlug(payload.title, course.id)
        : undefined;

    const data: Prisma.CourseUpdateInput = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(nextSlug ? { slug: nextSlug } : {}),
      ...(payload.shortDescription !== undefined
        ? { shortDescription: payload.shortDescription }
        : {}),
      ...(payload.description !== undefined
        ? { description: payload.description }
        : {}),
      ...(payload.thumbnail !== undefined ? { thumbnail: payload.thumbnail } : {}),
      ...(payload.price !== undefined ? { price: payload.price } : {}),
      ...(payload.categoryId !== undefined
        ? payload.categoryId
          ? {
              category: {
                connect: { id: payload.categoryId },
              },
            }
          : {
              category: {
                disconnect: true,
              },
            }
        : {}),
      ...(user.role !== Role.ADMIN && course.status === CourseStatus.REJECTED
        ? {
            status: CourseStatus.DRAFT,
            rejectionReason: null,
            submittedAt: null,
          }
        : {}),
    };

    return courseRepository.update(courseId, data);
  }

  async deleteCourse(user: AuthenticatedUser, courseId: string) {
    const course = await courseRepository.findManagedById(courseId);
    if (!course || course.deletedAt) {
      throw new ApiError(404, "Course not found");
    }

    this.ensureCourseOwner(course, user);
    if (user.role !== Role.ADMIN) {
      this.ensureInstructorCanMutate(course.status, "delete");
    }

    return courseRepository.update(courseId, {
      deletedAt: new Date(),
    });
  }

  async submitCourseForReview(user: AuthenticatedUser, courseId: string) {
    const course = await courseRepository.findManagedById(courseId);
    if (!course || course.deletedAt) {
      throw new ApiError(404, "Course not found");
    }

    this.ensureCourseOwner(course, user);

    const submittableStatuses: CourseStatus[] = [
      CourseStatus.DRAFT,
      CourseStatus.REJECTED,
    ];

    if (!submittableStatuses.includes(course.status)) {
      throw new ApiError(
        409,
        "Only draft or rejected courses can be submitted for review",
      );
    }

    return courseRepository.update(courseId, {
      status: CourseStatus.PENDING_REVIEW,
      submittedAt: new Date(),
      rejectionReason: null,
    });
  }

  async enrollInCourse(user: AuthenticatedUser, courseId: string) {
    const course = await courseRepository.findByIdForEnrollment(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }
    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ApiError(409, "Only published courses can be enrolled");
    }

    const existing = await courseRepository.findEnrollment(user.id, courseId);
    if (existing) {
      throw new ApiError(409, "You are already enrolled in this course");
    }

    return courseRepository.createEnrollment(user.id, courseId);
  }
}

export const courseService = new CourseService();
