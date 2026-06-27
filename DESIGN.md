# PHL·ART — Design System

## Color tokens

### Dark theme (default)
- `--color-bg`: `#0e0a0b`
- `--color-bg-footer`: `#0a0708`
- `--color-text`: `#ffffff`
- `--color-text-body`: `rgba(255,255,255,0.82)`
- `--color-caption`: `rgba(255,255,255,0.5–0.6)`
- `--color-accent`: `#ff3b30`
- `--color-hairline`: `rgba(255,255,255,0.10–0.14)`
- `--color-glass`: `rgba(255,255,255,0.03–0.06)`

### Light theme
- `--color-bg`: `#f4f1f1`
- `--color-bg-footer`: `#ffffff`
- `--color-text`: `#1a1416`
- `--color-caption`: `#797575`
- `--color-accent`: `#ff0000`
- `--color-hairline`: `rgba(0,0,0,0.1)`

## Typography

| Role | Font | Weight | Notes |
|---|---|---|---|
| Display / Titles | Manrope | 700 | lowercase, letter-spacing -0.01 to -0.02em |
| Body | Jost | 200–300 | line-height 1.6–1.72 |
| Nav / Labels | Montserrat | 600–700 | UPPERCASE, letter-spacing 0.06–0.14em |
| Quotes | Lora | italic | editorial warmth |

Scale: display 30–72px (desktop) / 30–34px (mobile H1); body 16–19px; meta/labels 9–13px.

## Spacing
- Base grid: 4px
- Content column centred, desktop margins ~48px, mobile ~20px
- Section stack: 24–40px gap
- Card gap: 16–22px
- Card inner padding: 18–20px

## Components

### Header
- Sticky, z-30
- Logo left (32–42px square), nav centred, search + theme toggle right
- Nav: Montserrat 600 13px UPPERCASE, letter-spacing 0.06em
- Active nav: border-bottom 2px accent colour
- No visible divider below header

### MediaCard (карточка материала)
- glass: `rgba(255,255,255,0.03)` fill + 1px hairline `rgba(255,255,255,0.14)`
- Cover image placeholder: mesh gradient (brand assets in /public/)
- Category label: accent colour, Montserrat 700 11px UPPERCASE
- Title: Manrope 700 22px lowercase, line-height 1.08
- Meta: Montserrat 500 11px UPPERCASE, caption colour
- Hover: translateY(-3px), glass fill → 0.06
- Press: scale(0.98)

### Hero (featured post)
- 2-column grid: text left, cover right
- Padding: ~52px 44px 48px
- Category + tag label: accent, Montserrat 700 12px UPPERCASE, letter-spacing 0.12em
- Title: Manrope 700 52px lowercase, line-height 1.0, letter-spacing -0.015em
- Excerpt: Jost 300 18px, caption colour, line-height 1.6
- Date + read time: Montserrat 500 12px UPPERCASE, letter-spacing 0.07em, caption-faint
- Cover: 1px hairline border, placeholder = gradient-hero-red.png

### Footer
- Background: `--color-bg-footer`
- Text: `powered by PHL·ART© 2026` right-aligned
- No top divider

## Brand assets
- Logo: `/public/logo-white.svg` (dark), `/public/logo-black.svg` (light) — 32–42px
- Gradients: `/public/gradient-1.png` through `/public/gradient-4.png`, `/public/gradient-hero-red.png`, `/public/gradient-red.png`
- Gradient hero red: warm red/burgundy mesh — used as featured post placeholder
