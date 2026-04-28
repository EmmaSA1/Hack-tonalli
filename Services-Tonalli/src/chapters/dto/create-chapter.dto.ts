export class CreateChapterDto {
  title: string;
  description?: string;
  content?: string;
  moduleTag?: string;
  order?: number;
  published?: boolean;
  coverImage?: string;
  estimatedMinutes?: number;
  xpReward?: number;
  releaseWeek?: string;
  requiredPlan?: 'free' | 'pro' | 'max';
}
