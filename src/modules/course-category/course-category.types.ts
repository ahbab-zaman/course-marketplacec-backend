export type CourseCategoryQuery = {
  page?: number;
  limit?: number;
};

export type CreateCourseCategoryDTO = {
  name: string;
  slug: string;
};

export type UpdateCourseCategoryDTO = {
  name?: string;
  slug?: string;
  isActive?: boolean;
};
