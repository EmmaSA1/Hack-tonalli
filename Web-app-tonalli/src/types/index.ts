export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  totalXp?: number;
  streak: number;
  xlmEarned: number;
  lessonsCompleted: number;
  city: string;
  role: 'admin' | 'user' | 'designer';
  plan: 'free' | 'pro' | 'max';
  walletAddress?: string;
  externalWalletAddress?: string | null;
  walletType?: 'custodial' | 'external' | 'hybrid';
  avatarUrl?: string;
  character?: string;
  stripeSubscriptionStatus?: string | null;
  nftCertificates: NFTCertificate[];
  isFirstLogin?: boolean;
  companion?: string;
  avatarType?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  content?: string;
  moduleTag?: string;
  order: number;
  published: boolean;
  coverImage?: string;
  estimatedMinutes?: number;
  xpReward: number;
  releaseWeek?: string;
  requiredPlan?: 'free' | 'pro' | 'max';
  modules?: ChapterModuleData[];
  createdAt: string;
  updatedAt: string;
  accessible?: boolean;
  lockedReason?: string | null;
  currentWeek?: string;
}

export interface ModuleSections {
  info: { completed: boolean; hasContent: boolean };
  video: { completed: boolean; progress: number; hasVideo: boolean };
  quiz: { completed: boolean; score: number; attempts: number };
}

export interface ChapterModuleData {
  id: string;
  type: 'lesson' | 'final_exam';
  order: number;
  title: string;
  xpReward: number;
  unlocked: boolean;
  completed: boolean;
  sections?: ModuleSections;
  score: number;
  attempts: number;
  livesRemaining: number;
  lockedUntil: string | null;
}

export interface ChapterWithProgress {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  moduleTag?: string;
  xpReward: number;
  releaseWeek?: string;
  requiredPlan?: 'free' | 'pro' | 'max';
  modules: ChapterModuleData[];
  completionPercent: number;
  plan: 'free' | 'pro' | 'max';
  accessible?: boolean;
  lockedReason?: string | null;
}

export interface NFTCertificate {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  txHash: string;
  earnedAt: string;
  moduleId: string;
}

export interface ActaCertificateData {
  id: string;
  chapterId: string;
  chapterTitle: string;
  actaVcId: string;
  txHash: string;
  examScore: number;
  status: 'pending' | 'issued' | 'failed';
  type: 'official' | 'achievement';
  issuedAt: string;
  stellarExplorerUrl?: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  xpReward: number;
  xlmReward: number;
  order: number;
  type: 'lesson' | 'quiz' | 'challenge';
  status: 'locked' | 'available' | 'completed';
  content: LessonContent[];
  estimatedMinutes: number;
}

export interface LessonContent {
  id: string;
  type: 'text' | 'highlight' | 'image' | 'tip';
  content: string;
  highlight?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  lessons: Lesson[];
  order: number;
  status: 'locked' | 'available' | 'completed';
  xpRequired: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex?: number;
  explanation?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName?: string;
  city: string;
  xp: number;
  level?: number;
  streak: number;
  character?: string;
  plan?: 'free' | 'pro' | 'max';
  isCurrentUser?: boolean;
}

export interface WeeklyLeaderboard {
  week: string;
  rewards: { first: number; second: number; third: number };
  rankings: Array<LeaderboardEntry & {
    totalScore: number;
    chaptersCompleted: number;
    avgExamScore: number;
    activeDays: number;
  }>;
}

export interface PodiumNFT {
  id: string;
  week: string;
  position: number;
  rewardUsd: number;
  rewardXlm: string;
  txHash: string;
  nftTxHash: string | null;
  createdAt: string;
  stellarExplorerUrl: string | null;
}

export interface RewardHistoryEntry {
  lessonId: string;
  amount: number;
  timestamp: number;
}

export interface WalletBalance {
  custodialAddress: string | null;
  externalAddress: string | null;
  walletType: string;
  xlmBalance: string;
  tnlBalance: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, city: string, dateOfBirth?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export interface ProgressState {
  completedLessons: string[];
  currentLesson: Lesson | null;
  modules: Module[];
  dailyStreak: number;
  lastActivity: string | null;
  markLessonComplete: (lessonId: string) => void;
  setCurrentLesson: (lesson: Lesson | null) => void;
  loadModules: () => void;
}
