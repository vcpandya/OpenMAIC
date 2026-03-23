# Changelog

## [0.2.0] - 2026-03-23

### Security
- **SSRF hardening**: Removed production-only gate on SSRF validation — now runs in all environments (9 routes)
- **SSRF IPv6 fix**: Fixed false positives (`fdic.gov` blocked) and false negatives (`::ffff:127.0.0.1` allowed) in IPv6 address handling
- **File size limits**: Added 50MB PDF and 25MB audio upload limits before reading into memory
- **Chat message limit**: Max 200 messages per request to prevent DoS
- **Error sanitization**: Replaced `error.message` with generic messages in ~20 API routes to prevent info leakage
- **Security headers**: Added `X-Content-Type-Options: nosniff` to media proxy and classroom media routes
- **Prompt injection defense**: Sanitize all user profile fields (nickname, bio, background, career) before LLM prompt injection — strips markdown heading markers, backticks, and enforces length limits
- **Class profile sanitization**: Bound class profile imports to 50 max, with field length limits and character stripping
- **XSS prevention**: Validate LLM-generated tool URLs are `https?://` only — blocks `javascript:` and `data:` schemes
- **ElevenLabs API key**: Removed non-null assertion, use safe fallback

### Bug Fixes
- **Parser state index bug**: Fixed `result.ordered.push()` creating invalid index when text delta is empty (`stateless-generate.ts`)
- **Whiteboard element IDs**: Generate fallback IDs via `generateId('wb')` instead of empty string — fixes `wb_delete` failures
- **Object URL memory leak**: `markDone` now revokes previous object URLs before setting new ones on media regeneration
- **Race condition: processNext() re-entry**: Added `isProcessing` guard with queued drain to prevent concurrent execution skipping actions
- **Race condition: speech timer overlap**: Added mode check in `.then()`/`.catch()` callbacks before scheduling reading timer
- **Race condition: double-resolve in video wait**: Added `resolved` flag to prevent TOCTOU double-unsubscribe in subscribe/check pattern
- **Missing wb_draw_line**: Added to playback engine switch statement — was silently skipping line-drawing actions
- **JSON.parse safety**: Wrapped `generateRecommendedTools` JSON parsing in try/catch with graceful fallback

### Performance
- **structuredClone**: Replaced 9 `JSON.parse(JSON.stringify())` calls with `structuredClone()` in canvas operations
- **Video element cleanup**: Added cleanup helper for success/error/timeout paths in PPTX export video frame capture
- **FileReader cleanup**: Null out event handlers after promise resolves in 3 PPTX export locations
- **StreamBuffer timer safety**: Clear existing interval before creating new one in `start()`

### New Features

#### Slide Entrance Animations
- Elements appear progressively with fade+slide animation as the teacher explains them
- New `reveal_element` fire-and-forget action type
- Spotlight actions auto-reveal their target element
- `revealedElementIds` state in canvas store with scene-lifecycle management
- Sparkles toggle button in toolbar — students can switch between animated and normal view

#### Spotlight Redesign
- Replaced heavy 70% black overlay with subtle 15% dimming
- Soft indigo glow border (`rgba(99,102,241,0.45)`) with SVG feGaussianBlur halo
- Removed backdrop-blur; increased cutout padding for breathing room
- Non-distracting attention guidance instead of dramatic spotlight

#### Personalization System
- **Accent colors**: 8 presets (purple, blue, indigo, rose, emerald, amber, teal, slate) via CSS `data-accent` attribute
- **UI font**: 4 options (Inter, System UI, Monospace, Serif) via CSS `data-ui-font` attribute
- **Appearance settings**: Color dot picker + font grid in General Settings panel
- Persisted to localStorage, restored on page load via ThemeProvider

#### Explanation Depth Modes
- 3 modes: **ELI5** (beginner), **Standard** (default), **Pro** (advanced)
- GraduationCap pill in generation toolbar cycles through modes
- Flows through entire pipeline: UserRequirements → outline generator → scene content → quiz → interactive → actions
- All 7 prompt templates include `{{explanationDepth}}` guidance for text density, terminology, and difficulty

#### Career & Background Profile
- New `background` and `careerAspiration` fields in user profile store
- Textarea inputs in profile card UI
- Flows into all content generation prompts via `{{userProfile}}` template variable
- Location-aware: if background mentions a region, LLM uses local companies, events, and case studies
- Career-aligned: activities, projects, and simulations designed for student's professional context

#### Class Profiles for Custom Agents
- `ClassProfile` type (name, personality, background, avatar) in user profile store
- "Add Student" form in agent settings with name + personality inputs
- Import/remove class profiles persisted to localStorage
- When class profiles exist, agent generation uses them instead of random personas

#### Session Learning Journey
- Horizontal breadcrumb bar at top of classroom showing scene progress
- Numbered pills with titles, click to navigate
- Current scene highlighted with accent color, completed scenes show checkmark
- Mobile: collapses to numbered dots only
- Auto-scrolls to keep current scene visible

#### Expandable Discussion Section
- Discussion area auto-expands (192px → 400px) when entering live discussion mode
- Auto-collapses when lecture playback resumes
- Chevron toggle button for manual expand/collapse
- Smooth 500ms height transition

#### Whiteboard Writing Animation
- Text elements now appear with typewriter-style `clipPath` reveal (0.8s)
- Non-text elements retain existing scale+blur entrance animation
- Clear animation unchanged

#### Curated Tools & Resources
- LLM generates 5-8 relevant tools per course (open-source, SaaS, learning resources)
- URL validation ensures only safe `https://` links
- `RecommendedTools` component with category icons (GitHub/Cloud/BookOpen) and color coding
- Displayed after the roundtable area in classroom view

### Mobile & Responsive
- **Viewport meta**: Added `export const viewport` with device-width and viewport-fit cover
- **Dynamic viewport height**: `h-screen` → `h-[100dvh]` on classroom page (fixes iOS Safari)
- **Header**: Responsive padding `px-3 sm:px-5 md:px-8`, smaller height on mobile `h-14 md:h-20`
- **Chat bubbles**: `max-w-[90%] md:max-w-[65%]`, `min-w-[120px] md:min-w-[200px]`
- **Agent sidebar**: `w-[60px] md:w-[90px]`
- **Toolbar buttons**: `w-9 h-9 md:w-7 md:h-7` (44px touch targets on mobile)
- **Settings dialog**: Full-screen on mobile `h-[100vh] sm:h-[85vh]`, sidebar hidden on small screens
- **Chat area**: Full-width on mobile, drag-resize disabled on mobile
- **Text sizing**: Interactive text bumped from 9-10px to 11px on mobile

### Whiteboard
- **Border clipping fix**: Added 4px stroke padding for non-line elements in bounds calculation
- **Auto-fit padding**: Increased from 24px to 32px for better breathing room

### i18n
- Added Chinese + English strings for: entrance animations toggle, explanation depth tooltip, accent color/font labels, background/career placeholders, class profile management
