import ApiError from "../../shared/errors/api-error.js";
import { userRepository } from "./user.repository.js";
import { UpdateUserProfileDTO } from "./user.types.js";

export class UserService {
  async getProfile(userId: string) {
    const profile = await userRepository.findProfileById(userId);
    if (!profile) {
      throw new ApiError(404, "User not found");
    }
    return profile;
  }

  async updateProfile(userId: string, payload: UpdateUserProfileDTO) {
    await this.getProfile(userId);
    return userRepository.updateProfile(userId, payload);
  }

  async getLearningSummary(userId: string) {
    await this.getProfile(userId);
    const courses = await userRepository.getLearningSummary(userId);

    return {
      courses,
      totals: {
        totalEnrollments: courses.length,
        activeEnrollments: courses.filter((item) => item.status === "ACTIVE")
          .length,
        completedCourses: courses.filter(
          (item) => item.completionPercentage >= 100,
        ).length,
      },
    };
  }
}

export const userService = new UserService();
