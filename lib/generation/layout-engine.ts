/**
 * Professional Slide Layout Engine
 *
 * Post-processes LLM-generated slide elements to enforce professional layout
 * rules: grid alignment, minimum margins, consistent sizing, balanced whitespace.
 *
 * Applied after content generation, before action generation.
 */

import { createLogger } from '@/lib/logger';

const log = createLogger('LayoutEngine');

// ==================== Constants ====================

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 562; // 16:9

// Margins and grid
const MARGIN = 40;
const _TITLE_ZONE = { x: MARGIN, y: 30, w: CANVAS_WIDTH - MARGIN * 2, h: 80 };
const _BODY_ZONE = { x: MARGIN, y: 120, w: CANVAS_WIDTH - MARGIN * 2, h: CANVAS_HEIGHT - 120 - MARGIN };

// Font size standards (used by getLayoutGuidance)
const _FONT_SIZES = {
  title: { min: 26, max: 36, default: 30 },
  subtitle: { min: 18, max: 24, default: 20 },
  body: { min: 14, max: 20, default: 16 },
  caption: { min: 11, max: 14, default: 12 },
};

// Layout presets
export type LayoutPreset = 'corporate' | 'academic' | 'creative' | 'dashboard';

const PRESET_CONFIGS: Record<LayoutPreset, {
  titleFontSize: number;
  bodyFontSize: number;
  marginScale: number;
  maxContentWidth: number; // % of canvas width
  accentBar: boolean;
}> = {
  corporate: {
    titleFontSize: 30,
    bodyFontSize: 16,
    marginScale: 1.2,
    maxContentWidth: 85,
    accentBar: true,
  },
  academic: {
    titleFontSize: 28,
    bodyFontSize: 15,
    marginScale: 0.9,
    maxContentWidth: 90,
    accentBar: false,
  },
  creative: {
    titleFontSize: 36,
    bodyFontSize: 18,
    marginScale: 1.5,
    maxContentWidth: 75,
    accentBar: false,
  },
  dashboard: {
    titleFontSize: 26,
    bodyFontSize: 14,
    marginScale: 0.8,
    maxContentWidth: 95,
    accentBar: false,
  },
};

// ==================== Types ====================

interface ElementLike {
  id: string;
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

// ==================== Layout Rules ====================

/**
 * Apply professional layout rules to generated slide elements.
 * Non-destructive: adjusts positioning and sizing while preserving content.
 */
export function applyLayoutRules(
  elements: ElementLike[],
  preset: LayoutPreset = 'corporate',
): ElementLike[] {
  if (elements.length === 0) return elements;

  const config = PRESET_CONFIGS[preset];
  const margin = MARGIN * config.marginScale;

  const result = elements.map((el) => ({ ...el }));

  for (const el of result) {
    // Rule 1: Enforce minimum margins — no element should touch the edge
    if (el.left < margin) {
      el.width = Math.max(el.width - (margin - el.left), 100);
      el.left = margin;
    }
    if (el.top < 20) {
      el.top = 20;
    }
    if (el.left + el.width > CANVAS_WIDTH - margin) {
      el.width = CANVAS_WIDTH - margin - el.left;
    }
    if (el.top + el.height > CANVAS_HEIGHT - 20) {
      el.height = CANVAS_HEIGHT - 20 - el.top;
    }

    // Rule 2: Snap to grid (8px grid for clean alignment)
    el.left = Math.round(el.left / 8) * 8;
    el.top = Math.round(el.top / 8) * 8;
    el.width = Math.round(el.width / 8) * 8;
    el.height = Math.round(el.height / 8) * 8;

    // Rule 3: Minimum element sizes
    if (el.width < 80) el.width = 80;
    if (el.height < 32) el.height = 32;

    // Rule 4: Max content width (prevent elements from spanning full width)
    const maxWidth = (CANVAS_WIDTH * config.maxContentWidth) / 100;
    if (el.width > maxWidth) {
      el.left = (CANVAS_WIDTH - maxWidth) / 2;
      el.width = maxWidth;
    }
  }

  // Rule 5: Detect and fix overlapping elements
  fixOverlaps(result);

  log.debug(`Layout applied: ${preset} preset, ${result.length} elements adjusted`);

  return result;
}

/**
 * Detect overlapping elements and push them apart vertically.
 */
function fixOverlaps(elements: ElementLike[]): void {
  // Sort by vertical position
  elements.sort((a, b) => a.top - b.top);

  for (let i = 1; i < elements.length; i++) {
    const prev = elements[i - 1];
    const curr = elements[i];

    // Check vertical overlap
    const prevBottom = prev.top + prev.height;
    if (curr.top < prevBottom + 8) {
      // Push current element down with 8px gap
      curr.top = prevBottom + 8;
    }

    // Ensure element doesn't go off canvas
    if (curr.top + curr.height > CANVAS_HEIGHT - 20) {
      // Scale down height to fit
      curr.height = Math.max(32, CANVAS_HEIGHT - 20 - curr.top);
    }
  }
}

/**
 * Auto-detect the best layout preset based on content characteristics.
 */
export function detectLayoutPreset(
  explanationDepth?: string,
  elementCount?: number,
  hasCharts?: boolean,
): LayoutPreset {
  if (hasCharts || (elementCount && elementCount > 6)) return 'dashboard';
  if (explanationDepth === 'pro') return 'academic';
  if (explanationDepth === 'eli5') return 'creative';
  return 'corporate';
}

/**
 * Get layout guidance text for LLM prompt injection.
 * This instructs the LLM to generate elements following professional layout rules.
 */
export function getLayoutGuidance(preset: LayoutPreset = 'corporate'): string {
  const config = PRESET_CONFIGS[preset];
  const margin = Math.round(MARGIN * config.marginScale);

  return `## Professional Layout Rules (${preset} style)

Follow these positioning rules for a polished, professional slide:

**Margins**: Minimum ${margin}px from all edges. No element should touch the canvas border.
**Grid**: Align element positions and sizes to an 8px grid (e.g., left: 48, 56, 64, not 50, 53, 61).
**Title zone**: Place titles at y=30-40, with fontSize ${config.titleFontSize}px, full width minus margins.
**Body zone**: Main content starts at y=120+. Body text fontSize ${config.bodyFontSize}px.
**Spacing**: Minimum 8px gap between adjacent elements. Use 16-24px for visual grouping.
**Max width**: Content should not exceed ${config.maxContentWidth}% of canvas width (${Math.round(CANVAS_WIDTH * config.maxContentWidth / 100)}px).
**Visual hierarchy**: Title is largest, followed by subtitles, then body text, then captions.
${config.accentBar ? '**Accent bar**: Add a thin colored rectangle (4px height) below the title for visual separation.' : ''}
**Whitespace**: Leave at least 30% of the slide as whitespace for readability.
**Alignment**: Left-align text elements. Center-align titles if they are short (< 40 chars).`;
}
