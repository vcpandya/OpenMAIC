/**
 * Generation Types - Two-Stage Content Generation System
 *
 * Stage 1: User requirements + documents → Scene Outlines (per-page)
 * Stage 2: Scene Outlines → Full Scenes (slide/quiz/interactive/pbl with actions)
 */

import type { ActionType } from './action';
import type { MediaGenerationRequest } from '@/lib/media/types';

// ==================== PDF Image Types ====================

/**
 * Image extracted from PDF with metadata
 */
export interface PdfImage {
  id: string; // e.g., "img_1", "img_2"
  src: string; // base64 data URL (empty when stored in IndexedDB)
  pageNumber: number; // Page number in PDF
  description?: string; // Optional description for AI context
  storageId?: string; // Reference to IndexedDB (session_xxx_img_1)
  width?: number; // Image width (px or normalized)
  height?: number; // Image height (px or normalized)
}

/**
 * Image mapping for post-processing: image_id → base64 URL
 */
export type ImageMapping = Record<string, string>;

// ==================== Stage 1 Input ====================

export interface AudienceProfile {
  gradeLevel: string; // "K-12", "University", "Professional"
  ageRange?: string; // "6-12", "18-25"
  prerequisites?: string[]; // Required prior knowledge
  learningStyles?: ('visual' | 'auditory' | 'kinesthetic' | 'reading')[];
}

export interface StylePreferences {
  tone: 'formal' | 'casual' | 'engaging' | 'academic';
  visualStyle: 'minimalist' | 'colorful' | 'professional' | 'playful';
  interactivityLevel: 'low' | 'medium' | 'high';
  includeExamples: boolean;
  includePractice: boolean;
  language: string; // 'zh-CN', 'en-US'
}

export interface UploadedDocument {
  id: string;
  name: string; // Original filename
  type: 'pdf' | 'docx' | 'pptx' | 'txt' | 'md' | 'image' | 'other';
  size: number; // Bytes
  uploadedAt: Date;
  contentSummary?: string; // Placeholder for parsing
  extractedTopics?: string[]; // Placeholder for parsing
  pageCount?: number;
  storageRef?: string;
}

/**
 * Simplified user requirements for course generation
 * All details (topic, duration, style, etc.) should be included in the requirement text
 */
export type ExplanationDepth = 'eli5' | 'standard' | 'pro';

/** Supported content generation languages */
export type GenerationLanguage =
  | 'zh-CN' | 'en-US' | 'es' | 'fr' | 'de' | 'ja' | 'ko'
  | 'pt-BR' | 'ru' | 'ar' | 'hi' | 'it'
  | 'gu' | 'bn' | 'ta' | 'te' | 'mr';

/** Language display metadata with regional grouping */
export interface LanguageOption {
  id: GenerationLanguage;
  label: string;
  nativeLabel: string;
  flag: string;
  region: 'popular' | 'indian' | 'european' | 'asian';
}

export const GENERATION_LANGUAGES: LanguageOption[] = [
  // Popular
  { id: 'en-US', label: 'English', nativeLabel: 'English', flag: '🇺🇸', region: 'popular' },
  { id: 'zh-CN', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', region: 'popular' },
  { id: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', region: 'popular' },
  // Indian
  { id: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', region: 'indian' },
  { id: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', flag: '🇮🇳', region: 'indian' },
  { id: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', flag: '🇮🇳', region: 'indian' },
  { id: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳', region: 'indian' },
  { id: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', flag: '🇮🇳', region: 'indian' },
  { id: 'mr', label: 'Marathi', nativeLabel: 'मराठी', flag: '🇮🇳', region: 'indian' },
  // European
  { id: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', region: 'european' },
  { id: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪', region: 'european' },
  { id: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹', region: 'european' },
  { id: 'pt-BR', label: 'Portuguese', nativeLabel: 'Português', flag: '🇧🇷', region: 'european' },
  { id: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺', region: 'european' },
  // Asian & Middle East
  { id: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', region: 'asian' },
  { id: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷', region: 'asian' },
  { id: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', region: 'asian' },
];

/** Region labels for grouped display */
export const LANGUAGE_REGIONS: Record<string, string> = {
  popular: 'Popular',
  indian: 'Indian Languages',
  european: 'European',
  asian: 'Asian & Middle East',
};

export interface UserRequirements {
  requirement: string; // Single free-form text for all user input
  language: GenerationLanguage; // Course language - critical for generation
  userNickname?: string; // Student nickname for personalization
  userBio?: string; // Student background for personalization
  userBackground?: string; // Professional/educational background
  userCareerAspiration?: string; // Career goal for content customization
  webSearch?: boolean; // Enable web search for richer context
  explanationDepth?: ExplanationDepth; // Content complexity: eli5, standard, pro
}

/**
 * @deprecated Use UserRequirements instead
 * Legacy structured requirements - kept for backward compatibility
 */
export interface LegacyUserRequirements {
  topic: string;
  description?: string;
  learningObjectives: string[];
  audience: AudienceProfile;
  durationMinutes: number;
  style: StylePreferences;
  documents?: UploadedDocument[];
  additionalNotes?: string;
}

// ==================== Stage 1 Output: Scene Outlines (Simplified) ====================

/**
 * Simplified scene outline
 * Gives AI more freedom, only requiring intent description and key points
 */
export interface SceneOutline {
  id: string;
  type: 'slide' | 'quiz' | 'interactive' | 'pbl';
  title: string;
  description: string; // 1-2 sentences describing the purpose
  keyPoints: string[]; // 3-5 core key points
  teachingObjective?: string;
  estimatedDuration?: number; // seconds
  order: number;
  language?: GenerationLanguage; // Generation language (inherited from requirements)
  explanationDepth?: ExplanationDepth; // Content depth (inherited from requirements)
  // Suggested image IDs (from PDF-extracted images)
  suggestedImageIds?: string[]; // e.g., ["img_1", "img_3"]
  // AI-generated media requests (when PDF images are insufficient)
  mediaGenerations?: MediaGenerationRequest[]; // e.g., [{ type: 'image', prompt: '...', elementId: 'gen_img_1' }]
  // Quiz-specific config
  quizConfig?: {
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard';
    questionTypes: ('single' | 'multiple' | 'text')[];
  };
  // Interactive-specific config
  interactiveConfig?: {
    conceptName: string;
    conceptOverview: string;
    designIdea: string;
    subject?: string;
  };
  // PBL-specific config
  pblConfig?: {
    projectTopic: string;
    projectDescription: string;
    targetSkills: string[];
    issueCount?: number;
    language: GenerationLanguage;
  };
}

// ==================== Stage 3 Output: Generated Content ====================

import type { PPTElement, SlideBackground } from './slides';
import type { QuizQuestion } from './stage';

/**
 * AI-generated slide content
 */
export interface GeneratedSlideContent {
  elements: PPTElement[];
  background?: SlideBackground;
  remark?: string;
}

/**
 * AI-generated quiz content
 */
export interface GeneratedQuizContent {
  questions: QuizQuestion[];
}

// ==================== PBL Generation Types ====================

import type { PBLProjectConfig } from '@/lib/pbl/types';

/**
 * AI-generated PBL content
 */
export interface GeneratedPBLContent {
  projectConfig: PBLProjectConfig;
}

// ==================== Interactive Generation Types ====================

/**
 * Scientific model output from scientific modeling stage
 */
export interface ScientificModel {
  core_formulas: string[];
  mechanism: string[];
  constraints: string[];
  forbidden_errors: string[];
}

/**
 * AI-generated interactive content
 */
export interface GeneratedInteractiveContent {
  html: string;
  scientificModel?: ScientificModel;
}

// ==================== Legacy Types (for compatibility) ====================

export interface SuggestedSlideElement {
  type: 'text' | 'image' | 'shape' | 'chart' | 'latex' | 'line';
  purpose: 'title' | 'subtitle' | 'content' | 'example' | 'diagram' | 'formula' | 'highlight';
  contentHint: string;
  position?: 'top' | 'center' | 'bottom' | 'left' | 'right';
  chartType?: 'bar' | 'line' | 'pie' | 'radar';
  textOutline?: string[];
}

export interface SuggestedQuizQuestion {
  type: 'single' | 'multiple' | 'short_answer';
  questionOutline: string;
  suggestedOptions?: string[];
  targetConceptId?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SuggestedAction {
  type: ActionType;
  description: string;
  timing?: 'start' | 'middle' | 'end' | 'after-content';
}

// ==================== Generation Session ====================

export interface GenerationProgress {
  currentStage: 1 | 2 | 3;
  overallProgress: number; // 0-100
  stageProgress: number; // 0-100
  statusMessage: string;
  scenesGenerated: number;
  totalScenes: number;
  errors?: string[];
}

export interface GenerationSession {
  id: string;
  requirements: UserRequirements;
  sceneOutlines?: SceneOutline[];
  progress: GenerationProgress;
  startedAt: Date;
  completedAt?: Date;
  generatedStageId?: string;
}
