---
name: Kohar Music
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c4c7c8'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8e9192'
  outline-variant: '#444748'
  surface-tint: '#c6c6c7'
  primary: '#ffffff'
  on-primary: '#2f3131'
  primary-container: '#e2e2e2'
  on-primary-container: '#636565'
  inverse-primary: '#5d5f5f'
  secondary: '#ffb4ab'
  on-secondary: '#690005'
  secondary-container: '#ad0311'
  on-secondary-container: '#ffb8b0'
  tertiary: '#ffffff'
  on-tertiary: '#482900'
  tertiary-container: '#ffddbb'
  on-tertiary-container: '#875b27'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c7'
  on-primary-fixed: '#1a1c1c'
  on-primary-fixed-variant: '#454747'
  secondary-fixed: '#ffdad6'
  secondary-fixed-dim: '#ffb4ab'
  on-secondary-fixed: '#410002'
  on-secondary-fixed-variant: '#93000b'
  tertiary-fixed: '#ffddbb'
  tertiary-fixed-dim: '#f5bc7e'
  on-tertiary-fixed: '#2b1700'
  on-tertiary-fixed-variant: '#653e0b'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  surface-base: '#111111'
  surface-raised: '#181818'
  surface-overlay: '#222222'
  border-subtle: '#2A2A2A'
  border-prominent: '#404040'
  text-muted: '#808080'
  signal-crimson: '#D62C29'
  accent-amber: '#E0A96D'
typography:
  headline-xl:
    fontFamily: Vollkorn
    fontSize: 48px
    fontWeight: '600'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Vollkorn
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Vollkorn
    fontSize: 36px
    fontWeight: '500'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Vollkorn
    fontSize: 26px
    fontWeight: '500'
    lineHeight: 34px
    letterSpacing: 0em
  headline-md:
    fontFamily: Vollkorn
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: 0em
  headline-sm:
    fontFamily: Vollkorn
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
  code-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.04em
spacing:
  gutter: 1rem
  gutter-tablet: 1.25rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 2rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

This design system channels the underground sonic culture of Seoul's indie scene, drawing direct inspiration from avant-garde archive spaces like Maansun. It treats digital music streaming and distribution not as algorithmic utility, but as a disciplined, print-inspired listening archive and cultural curatorium.

### Personality & Tone
- **Curatorial & Monastic:** Uncluttered, silent, and deliberate. Space exists to frame raw audio works and physical release art without decorative distraction.
- **Underground & Avant-Garde:** High editorial rigor balanced with sharp, utilitarian precision. It respects the lineage of tape labels, vinyl pressings, and basement live spaces.
- **Tactile Minimalism:** Monochromatic foundational surfaces grounded with hairline borders, typographic tension, and quiet cinematic warmth.

### Visual Style
The design blends **Minimalism** with an **Editorial Archive** approach:
- Deep charcoal base layers (`#111111`) with structural dividing hairlines.
- Stark literary serif headlines paired with ultra-legible, mechanical sans-serif numerals and metadata.
- Unrounded geometric discipline throughout; elements mimic physical publication spreads, gallery placard typography, and modular audio rack units.

## Colors

The color architecture is uncompromisingly dark and architectural, keeping visual fatigue low while directing full luminance toward album jackets, archival liner notes, and playback metrics.

### Roles & Application
- **Primary (`#F1F1F1`):** Applied to core typography, high-priority interactive states, active play heads, and track titles. It delivers crisp, readable contrast against deep black surfaces without harsh blue-white glare.
- **Secondary (`#D62C29` / Signal Crimson):** Reserved strictly for active states, live indicators, streaming status markers, record labels, and critical interactive moments (e.g., live broadcast badge, exclusive drop flag).
- **Tertiary (`#E0A96D` / Soft Amber):** An analog tube-amplifier accent used for curation badges, patron-tier highlights, and physical release stock indicators.
- **Neutral / Surface Tones (`#111111`, `#181818`, `#222222`):** Defines background hierarchy. Never use pure `#000000` for cards; reserve `#111111` for canvas backing, `#181818` for track lists and editorial panels, and `#2A2A2A` for single-pixel hairline grid dividers.

## Typography

The typographic strategy pairs the literary weight of **Vollkorn** with the disciplined, structural neutrality of **Inter**.

### Usage Guidelines
- **Vollkorn:** Applied to editorial headlines, release titles, artist spotlights, essay fragments, and exhibition quotes. It provides the intellectual gravity of print culture. Keep weights restrained (`500` and `600`) to maintain sharp digital rendering.
- **Inter:** The functional spine. Assigned to tracklists, timestamps, catalog identifiers (e.g., `KHR-089`), playback technical specs (e.g., `24-bit / 96kHz FLAC`), and UI controls.
- **Uppercase Labels:** Micro-labels, metadata markers, and track durations must leverage `label-sm` with upper casing and `0.08em` tracking to evoke engineering consoles and index tags.

## Layout & Spacing

The layout is built on a disciplined **12-column fluid grid** for desktop and tablet, collapsing to a high-density 4-column framework on mobile screens.

### Spatial Rhythm
- **Rhythm Multiplier:** Anchored to an 8px rhythm, with 4px fine steps for tight metadata blocks (artist, catalog ID, duration).
- **Margins & Gutters:** Desktop uses wide `3rem` canvas margins to reinforce an art-gallery framing effect, paired with consistent `1.5rem` gutters between column partitions.
- **Grid Density:** High-density album grids adapt from 6 columns on wide viewports (≥1440px), to 4 columns on standard desktop (1024px–1439px), 3 columns on tablet (768px–1023px), and 2 columns on mobile. Artworks maintain a rigid 1:1 aspect ratio.
- **Reflow & Alignment:** Borders demarcating sections run edge-to-edge across the column framework, anchoring the content visually without rounded separation cards.

## Elevation & Depth

This design system rejects dropshadows and skeuomorphic blur stacks. Depth is achieved purely through **structural surface tiers, tonal shifts, and precision hairlines**.

### Surface Tiers
1. **Base Floor (`#111111`):** The primary view canvas for catalog browsing and longform reading.
2. **Raised Layer (`#181818`):** Editorial highlight cards, drawer sidebars, and track hover rows.
3. **Floating Layer (`#141414` / 95% opacity with `backdrop-filter: blur(12px)`):** Sticky elements, specifically the persistent master audio player docked to the viewport bottom and top-level index filters.

### Outlines and Borders
- **Hairlines (`1px solid #2A2A2A`):** Used deliberately on all cards, header separations, tracklist partitions, and grid cells.
- **Active Focus / Selection:** An element in focus gains a `1px solid #F1F1F1` border. Never apply diffuse glow halos.

## Shapes

The shape system is strictly **Sharp (`0`)**. Every container, button, album tile, input field, and dialogue adheres to `0px` border-radius.

### Architectural Rationale
- Radii are eliminated to honor physical print publications, vinyl slipcases, cassette J-cards, and audio hardware interfaces.
- The stark, rectilinear geometry reinforces the uncompromising, underground tone of the archive.
- The sole organic curves within the interface are the waveforms and the circular geometry of spinning media graphics or audio knobs.

## Components

### Buttons & Controls
- **Primary Button:** Rectangular, background `#F1F1F1`, text `#111111`, `Inter` Medium, `12px` uppercase, `0.06em` tracking. Zero border-radius. Hover state shifts background to `#D62C29` with `#F1F1F1` text.
- **Secondary / Ghost Button:** Rectangular, background transparent, border `1px solid #2A2A2A`, text `#F1F1F1`. Hover switches border to `#F1F1F1`.
- **Icon Controls (Play, Pause, Skip):** Minimal hairline icon glyphs, strictly monochrome (`#F1F1F1`), scaling up 10% on hover with zero bounce easing.

### Chips & Filter Tags
- Flat rectangular tags enclosed in `1px solid #2A2A2A`. Typography is `label-sm` in `#808080`.
- When active, fills with `#F1F1F1`, and text shifts to `#111111` with a `1px solid #F1F1F1` outline.

### Tracklist Rows
- Height: `44px`. Border bottom: `1px solid #1E1E1E`.
- Columns: Track index (monospace/sans, `#808080`), Track Title (Inter, Regular, `#F1F1F1`), Artist (Inter, `#808080`), Duration / Waveform preview, Action trigger.
- Hover state: Row background transitions to `#181818`; active track number swaps to a 3-bar animated frequency visualizer in `#D62C29`.

### Input Fields & Search
- Background: `#181818`. Border: `1px solid #2A2A2A`. Padding: `10px 14px`. Typography: `Inter 14px` in `#F1F1F1`.
- Focus state: Border becomes `1px solid #F1F1F1` with zero drop shadow.

### Cards (Editorial & Catalog)
- **Album Grid Tile:** Square 1:1 image container framed in `1px solid #2A2A2A`. Underneath, metadata is stacked tightly: Release Title in `Vollkorn 14px`, Artist in `Inter 12px #808080`, Release Year/Catalog ID in `Inter 11px #808080`.
- **Editorial Magazine Card:** Horizontal or tall portrait container with `#181818` background and `1px solid #2A2A2A`. Features a `Vollkorn` headline, publication timestamp, curator tag, and excerpt in `Inter 14px`.

### Sticky Master Audio Player
- Fixed to bottom viewport edge, `height: 72px`, background `#141414` with a backdrop blur and a top border `1px solid #2A2A2A`.
- Houses running timecodes, scrubbing scrubber bar (`2px` track in `#2A2A2A` with `#F1F1F1` elapsed fill and red `#D62C29` playhead cursor), track metadata, and lossy/lossless audio format tag (`FLAC 24bit`).