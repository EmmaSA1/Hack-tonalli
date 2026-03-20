export interface User {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  xlmEarned: number;
  lessonsCompleted: number;
  city: string;
  role: 'admin' | 'user';
  walletAddress?: string;
  avatarUrl?: string;
  nftCertificates: NFTCertificate[];
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
  createdAt: string;
  updatedAt: string;
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
  lessonId: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  city: string;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser?: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, city: string) => Promise<void>;
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
