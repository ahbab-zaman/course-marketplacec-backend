import { VideoProvider } from "@prisma/client";

export type CreateLessonDTO = {
  title: string;
  summary?: string | null;
  orderIndex: number;
  videoProvider: VideoProvider;
  providerAssetId: string;
  providerPlaybackRef?: string | null;
  durationSeconds?: number;
  isPreview?: boolean;
};

export type UpdateLessonDTO = {
  title?: string;
  summary?: string | null;
  orderIndex?: number;
  videoProvider?: VideoProvider;
  providerAssetId?: string;
  providerPlaybackRef?: string | null;
  durationSeconds?: number;
  isPreview?: boolean;
};
