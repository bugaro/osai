---
name: Autonomous Operations Interface
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c4c7c9'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8e9193'
  outline-variant: '#444749'
  surface-tint: '#c4c7c9'
  primary: '#ffffff'
  on-primary: '#2d3133'
  primary-container: '#e0e3e5'
  on-primary-container: '#626567'
  inverse-primary: '#5c5f61'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffffff'
  on-tertiary: '#68000a'
  tertiary-container: '#ffdad7'
  on-tertiary-container: '#c22229'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e0e3e5'
  primary-fixed-dim: '#c4c7c9'
  on-primary-fixed: '#191c1e'
  on-primary-fixed-variant: '#444749'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  mono-data:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '450'
    lineHeight: 16px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
  code-block:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap: 12px
  grid-gutter: 16px
  sidebar-width: 240px
---

## Brand & Style

The design system is engineered for high-stakes autonomous AI financial environments. It prioritizes information density, technical clarity, and rapid decision-making for operators. The aesthetic is **Brutalist-lite**: a lean, engineering-focused philosophy that favors structural integrity over decorative flourish.

The visual language communicates authority and precision. It avoids soft gradients and rounded abstractions in favor of crisp edges, monospaced data visualization, and a high-contrast utilitarian palette. The emotional response is one of controlled power—a "mission control" atmosphere where every pixel serves a functional purpose in monitoring the OSAI compensation engine.

## Colors

The palette is anchored in a deep, nocturnal range of slates and zincs to reduce eye strain during prolonged monitoring. 

- **Primary:** White/Slate-50 is used strictly for high-priority text and primary actions.
- **Secondary (Emerald):** Reserved for "Safe" flows, successful autonomous transactions, and active engine states.
- **Tertiary (Red):** Used exclusively for security guardrail violations, interrupted compensation cycles, and critical system failures.
- **Neutral:** A tiered system of dark blues defines the spatial hierarchy, moving from a near-black canvas to lighter zinc surfaces for interactive elements.

## Typography

Typography is treated as a functional tool for data parsing. **Inter** provides high legibility for UI controls and navigation. **JetBrains Mono** is the primary typeface for all quantitative data, JSON payloads, and system logs, ensuring that numerical alignment remains consistent across vertical scans.

Text sizes are deliberately compact to accommodate high information density. Uppercase monospaced labels are used for metadata and table headers to distinguish them from actionable content.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system optimized for widescreen operator consoles. It employs a 12-column grid with tight gutters to maximize screen real estate. 

- **Density:** Elements are packed tightly using a 4px baseline shift. 
- **Structure:** A fixed left sidebar contains navigation, while the main viewport is divided into modular "widgets" or panes. 
- **Reflow:** On smaller screens (tablets), the 12-column layout collapses to a single-column scroll; however, the primary target is desktop environments where multiple data streams are visible simultaneously.

## Elevation & Depth

In line with the Brutalist-lite aesthetic, this design system eschews soft shadows and blurs. Depth is communicated through **Tonal Layering** and **High-Contrast Outlines**:

- **Level 0 (Canvas):** The darkest shade (#020617), representing the base environment.
- **Level 1 (Surface):** Elevated panels and cards use #0f172a with a 1px solid border (#334155).
- **Level 2 (Overlay):** Modals and popovers use #1e293b with a more prominent border (#64748b).

Interactive states are indicated by border color shifts (e.g., a primary button gaining a white border) rather than shadow expansion.

## Shapes

The shape language is rigid and architectural. A subtle **0.25rem (4px)** radius is applied to cards and buttons to prevent the UI from feeling overly aggressive, while maintaining a sharp, precision-machined look. 

Data cells, status indicators, and terminal inputs should remain strictly square-edged (0px) to reinforce the engineering focus.

## Components

### Buttons & Inputs
Buttons follow a "ghost-to-solid" logic. Secondary actions are transparent with a subtle border. Primary actions use high-contrast fills (Emerald for execution, White for standard). Inputs are inset with #020617 backgrounds and monospaced text.

### Cards & Badges
Cards are the primary container unit, featuring a 1px border and a required header section for titles. Badges (Chips) use monospaced text and low-opacity fills of their status color (e.g., 10% Emerald fill for "Active").

### Data Grids
Tables are the heart of the system. They use zebra-striping with a 2% lighter zinc variance. Every cell containing a number or ID must use **JetBrains Mono**.

### Log Viewers
A specialized component for JSON and system logs. It features a dark-black background, line numbers, and syntax highlighting using the Emerald and Red functional colors for keys and values.