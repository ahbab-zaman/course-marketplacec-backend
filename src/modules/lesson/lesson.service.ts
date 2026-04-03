import { CourseStatus, Prisma, Role } from "@prisma/client";
import ApiError from "../../shared/errors/api-error";
import { courseRepository } from "../course/course.repository";
import { CreateLessonDTO, UpdateLessonDTO } from "./lesson.types";
import { lessonRepository } from "./lesson.repository";

type AuthenticatedUser = {
  id: string;
  role: Role;
};

export class LessonService {
  private async getManagedCourse(courseId: string) {
    const course = await courseRepository.findManagedById(courseId);

    if (!course || course.deletedAt) {
      throw new ApiError(404, "Course not found");
    }

    return course;
  }

  private ensureCourseOwner(course: { instructorId: string }, user: AuthenticatedUser) {
    if (user.role === Role.ADMIN) {
      return;
    }

    if (course.instructorId !== user.id) {
      throw new ApiError(403, "You can only manage lessons for your own courses");
    }
  }

  private ensureCourseMutable(status: CourseStatus) {
    const mutableStatuses: CourseStatus[] = [
      CourseStatus.DRAFT,
      CourseStatus.REJECTED,
    ];

    if (!mutableStatuses.includes(status)) {
      throw new ApiError(
        409,
        "Lessons can only be managed while the course is in draft or rejected status",
      );
    }
  }

  private async ensureUniqueOrderIndex(
    courseId: string,
    orderIndex: number,
    excludeLessonId?: string,
  ) {
    const existing = await lessonRepository.findByCourseAndOrderIndex(
      courseId,
      orderIndex,
    );

    if (existing && existing.id !== excludeLessonId) {
      throw new ApiError(409, "Lesson order index already exists for this course");
    }
  }

  async createLesson(user: AuthenticatedUser, courseId: string, payload: CreateLessonDTO) {
    const course = await this.getManagedCourse(courseId);
    this.ensureCourseOwner(course, user);
    if (user.role !== Role.ADMIN) {
      this.ensureCourseMutable(course.status);
    }

    await this.ensureUniqueOrderIndex(course.id, payload.orderIndex);

    return lessonRepository.create({
      title: payload.title,
      summary: payload.summary ?? null,
      orderIndex: payload.orderIndex,
      videoProvider: payload.videoProvider,
      providerAssetId: payload.providerAssetId,
      providerPlaybackRef: payload.providerPlaybackRef ?? null,
      durationSeconds: payload.durationSeconds ?? 0,
      isPreview: payload.isPreview ?? false,
      course: {
        connect: { id: course.id },
      },
    });
  }

  async getCourseLessons(courseId: string, user?: AuthenticatedUser) {
    const course = await this.getManagedCourse(courseId);

    if (user && (user.role === Role.ADMIN || user.id === course.instructorId)) {
      return {
        lessons: await lessonRepository.findByCourseId(courseId),
        visibility: "managed",
      };
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ApiError(404, "Course not found");
    }

    return {
      lessons: await lessonRepository.findPublicPreviewByCourseId(courseId),
      visibility: "preview",
    };
  }

  async updateLesson(user: AuthenticatedUser, lessonId: string, payload: UpdateLessonDTO) {
    const lesson = await lessonRepository.findById(lessonId);

    if (!lesson) {
      throw new ApiError(404, "Lesson not found");
    }

    const course = await this.getManagedCourse(lesson.courseId);
    this.ensureCourseOwner(course, user);
    if (user.role !== Role.ADMIN) {
      this.ensureCourseMutable(course.status);
    }

    if (
      payload.orderIndex !== undefined &&
      payload.orderIndex !== lesson.orderIndex
    ) {
      await this.ensureUniqueOrderIndex(lesson.courseId, payload.orderIndex, lesson.id);
    }

    const data: Prisma.LessonUpdateInput = {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.summary !== undefined ? { summary: payload.summary } : {}),
      ...(payload.orderIndex !== undefined
        ? { orderIndex: payload.orderIndex }
        : {}),
      ...(payload.videoProvider !== undefined
        ? { videoProvider: payload.videoProvider }
        : {}),
      ...(payload.providerAssetId !== undefined
        ? { providerAssetId: payload.providerAssetId }
        : {}),
      ...(payload.providerPlaybackRef !== undefined
        ? { providerPlaybackRef: payload.providerPlaybackRef }
        : {}),
      ...(payload.durationSeconds !== undefined
        ? { durationSeconds: payload.durationSeconds }
        : {}),
      ...(payload.isPreview !== undefined ? { isPreview: payload.isPreview } : {}),
    };

    return lessonRepository.update(lessonId, data);
  }

  async deleteLesson(user: AuthenticatedUser, lessonId: string) {
    const lesson = await lessonRepository.findById(lessonId);

    if (!lesson) {
      throw new ApiError(404, "Lesson not found");
    }

    const course = await this.getManagedCourse(lesson.courseId);
    this.ensureCourseOwner(course, user);
    if (user.role !== Role.ADMIN) {
      this.ensureCourseMutable(course.status);
    }

    return lessonRepository.delete(lessonId);
  }

  async getPlayback(user: AuthenticatedUser | undefined, lessonId: string) {
    const lesson = await lessonRepository.findPlaybackById(lessonId);

    if (!lesson || lesson.course.deletedAt) {
      throw new ApiError(404, "Lesson not found");
    }

    const isOwnerOrAdmin = !!user &&
      (user.role === Role.ADMIN || user.id === lesson.course.instructorId);

    const isPublishedPreview =
      lesson.course.status === CourseStatus.PUBLISHED && lesson.isPreview;

    let hasEnrollment = false;
    if (user && !isOwnerOrAdmin) {
      const enrollment = await lessonRepository.findActiveEnrollment(
        user.id,
        lesson.courseId,
      );
      hasEnrollment = lessonRepository.isEnrollmentActive(enrollment?.status);
    }

    if (!isOwnerOrAdmin && !isPublishedPreview && !hasEnrollment) {
      throw new ApiError(403, "You do not have access to this lesson playback");
    }

    if (
      !isOwnerOrAdmin &&
      lesson.course.status !== CourseStatus.PUBLISHED &&
      !hasEnrollment
    ) {
      throw new ApiError(404, "Lesson not found");
    }

    if (!lesson.providerPlaybackRef) {
      throw new ApiError(
        409,
        "Lesson playback is not ready because no playback reference is configured",
      );
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        summary: lesson.summary,
        orderIndex: lesson.orderIndex,
        durationSeconds: lesson.durationSeconds,
        isPreview: lesson.isPreview,
      },
      course: {
        id: lesson.course.id,
        title: lesson.course.title,
      },
      playback: {
        provider: lesson.videoProvider,
        playbackRef: lesson.providerPlaybackRef,
        expiresAt,
        accessType: isOwnerOrAdmin ? "owner" : hasEnrollment ? "enrolled" : "preview",
      },
    };
  }
}

export const lessonService = new LessonService();
