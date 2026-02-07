# SaaS Design System
## Modern Design System for VIK Group Platform

---

## 1. Typography

### Font Families

**Headings & Display**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- Weight Range: 600–800
- Modern, clean, and highly legible geometric sans-serif

**Body & Interface**
- Primary: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- Weight Range: 400–500
- Consistent with headings for cohesive design

**Monospace (Code & Data)**
- `'JetBrains Mono', 'Fira Code', 'Consolas', monospace`
- For code snippets, logs, and technical data

### Type Scale

| Level | Size | Line Height | Weight | Letter Spacing | Usage |
|-------|------|-------------|--------|----------------|-------|
| **Display XL** | 60px | 72px | 700 | -0.02em | Hero sections |
| **Display L** | 48px | 60px | 700 | -0.01em | Page titles |
| **H1** | 36px | 44px | 600 | -0.01em | Section headers |
| **H2** | 30px | 38px | 600 | -0.005em | Subsection headers |
| **H3** | 24px | 32px | 600 | 0 | Card headers |
| **H4** | 20px | 28px | 600 | 0 | Small headers |
| **H5** | 18px | 26px | 500 | 0 | Labels, overlines |
| **Body L** | 16px | 24px | 400 | 0 | Primary body text |
| **Body M** | 14px | 21px | 400 | 0 | Secondary body text |
| **Body S** | 13px | 19px | 400 | 0 | Captions, metadata |
| **Body XS** | 12px | 18px | 400 | 0.01em | Fine print |

---

## 2. Color System

### Primary Colors

**Navy Blue (Brand Primary)**
```
Primary 900: #0f1835 - Main brand color, headers, primary text
Primary 800: #1a2444
Primary 700: #253054
Primary 600: #304063
Primary 500: #3b5073
```

**Coral Red (Accent)**
```
Accent 600: #e25a4a - Primary actions, alerts
Accent 500: #fa6e5b - Hover states, highlights
Accent 400: #fb8575
Accent 300: #fc9d8f
Accent 200: #fdb5a9
```

### Neutral Colors

**Grays (Interface)**
```
Gray 900: #0f1835 - Headings, primary text
Gray 800: #333333 - Body text
Gray 700: #555555 - Secondary text
Gray 600: #5d6272 - Muted text
Gray 500: #999999 - Disabled text
Gray 400: #afb2bd - Placeholder text
Gray 300: #cccccc - Borders
Gray 200: #e8ecf2 - Dividers
Gray 100: #f4f6fa - Backgrounds
Gray 50: #f8f9fa - Surface backgrounds
```

### Semantic Colors

**Success**
```
Success 700: #0a7c42
Success 600: #0d9e54
Success 500: #10b866
Success 400: #3ec97d
```

**Warning**
```
Warning 700: #c17200
Warning 600: #e88700
Warning 500: #ff9500
Warning 400: #ffaa33
```

**Error**
```
Error 700: #c42a1f
Error 600: #e25a4a
Error 500: #fa6e5b
Error 400: #fb8575
```

**Info**
```
Info 700: #0558d6
Info 600: #066de8
Info 500: #1e88e5
Info 400: #4aa3f0
```

### Gradient

**Primary Gradient**
```css
background: linear-gradient(156deg, #ff7265 0%, #7ac3ff 100%);
```
- Use for premium features, CTAs, and highlight elements

---

## 3. Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `space-0` | 0px | Reset/None |
| `space-1` | 4px | Tight spacing |
| `space-2` | 8px | Component padding |
| `space-3` | 12px | Small gaps |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Medium gaps |
| `space-6` | 24px | Large padding |
| `space-7` | 28px | Section spacing |
| `space-8` | 32px | Large gaps |
| `space-10` | 40px | XL spacing |
| `space-12` | 48px | Section margins |
| `space-16` | 64px | Page sections |
| `space-20` | 80px | Hero spacing |
| `space-24` | 96px | Large sections |

### Component Spacing Guidelines

**Cards & Containers**
- Padding: `space-4` (16px) to `space-6` (24px)
- Gap between items: `space-3` (12px) to `space-4` (16px)

**Forms**
- Field spacing: `space-4` (16px)
- Label to input: `space-2` (8px)
- Form sections: `space-6` (24px)

**Lists**
- Item padding: `space-3` (12px) to `space-4` (16px)
- Item gap: `space-2` (8px)

---

## 4. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | 0px | Sharp edges |
| `radius-sm` | 4px | Buttons, inputs, small cards |
| `radius-md` | 8px | Cards, modals |
| `radius-lg` | 12px | Large cards, panels |
| `radius-xl` | 16px | Feature cards |
| `radius-2xl` | 24px | Hero sections |
| `radius-full` | 9999px | Pills, avatars, badges |

---

## 5. Shadows

### Elevation System

```css
/* Shadow 1 - Subtle */
box-shadow: 0 1px 2px rgba(15, 24, 53, 0.05);

/* Shadow 2 - Card */
box-shadow: 0 1px 3px rgba(15, 24, 53, 0.1),
            0 1px 2px rgba(15, 24, 53, 0.06);

/* Shadow 3 - Raised */
box-shadow: 0 4px 6px rgba(15, 24, 53, 0.07),
            0 2px 4px rgba(15, 24, 53, 0.06);

/* Shadow 4 - Modal */
box-shadow: 0 10px 15px rgba(15, 24, 53, 0.1),
            0 4px 6px rgba(15, 24, 53, 0.05);

/* Shadow 5 - Popover */
box-shadow: 0 20px 25px rgba(15, 24, 53, 0.15),
            0 10px 10px rgba(15, 24, 53, 0.04);

/* Shadow 6 - Large Modal */
box-shadow: 0 25px 50px rgba(15, 24, 53, 0.25);
```

---

## 6. Effects & Transitions

### Transitions

```css
/* Standard */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Fast */
transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

/* Slow */
transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);

/* Bounce */
transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Hover States

**Opacity**
- Default: `opacity: 1`
- Hover: `opacity: 0.85`
- Disabled: `opacity: 0.5`

**Grayscale (Inactive States)**
```css
filter: grayscale(0.3);
opacity: 0.75;
```

---

## 7. Components

### Buttons

**Primary Button**
```css
background: #e25a4a;
color: #ffffff;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;
font-size: 14px;
transition: all 200ms ease;

/* Hover */
background: #fa6e5b;
box-shadow: 0 4px 6px rgba(226, 90, 74, 0.25);
```

**Secondary Button**
```css
background: transparent;
color: #0f1835;
border: 1px solid #e8ecf2;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;
font-size: 14px;

/* Hover */
background: #f8f9fa;
border-color: #cccccc;
```

**Ghost Button**
```css
background: transparent;
color: #5d6272;
padding: 12px 24px;
border-radius: 8px;
font-weight: 500;
font-size: 14px;

/* Hover */
background: #f4f6fa;
color: #0f1835;
```

### Input Fields

```css
background: #ffffff;
border: 1px solid #e8ecf2;
border-radius: 8px;
padding: 10px 14px;
font-size: 14px;
color: #0f1835;
transition: all 200ms ease;

/* Focus */
border-color: #e25a4a;
box-shadow: 0 0 0 3px rgba(226, 90, 74, 0.1);

/* Error */
border-color: #fa6e5b;

/* Disabled */
background: #f8f9fa;
color: #afb2bd;
cursor: not-allowed;
```

### Cards

```css
background: #ffffff;
border: 1px solid #e8ecf2;
border-radius: 12px;
padding: 24px;
box-shadow: 0 1px 3px rgba(15, 24, 53, 0.1);
transition: all 200ms ease;

/* Hover */
box-shadow: 0 4px 6px rgba(15, 24, 53, 0.07);
border-color: #cccccc;
```

### Avatars

**Sizes**
- XS: 24px
- SM: 32px
- MD: 40px
- LG: 48px
- XL: 64px
- 2XL: 96px

```css
border-radius: 9999px;
background: linear-gradient(156deg, #ff7265 0%, #7ac3ff 100%);
```

### Badges

```css
padding: 4px 10px;
border-radius: 9999px;
font-size: 12px;
font-weight: 500;
letter-spacing: 0.01em;

/* Status variants */
/* Active */
background: #e7f7ef;
color: #0a7c42;

/* Pending */
background: #fff4e5;
color: #c17200;

/* Error */
background: #fee;
color: #c42a1f;
```

---

## 8. Layout Grid

### Container

```css
max-width: 1280px;
margin: 0 auto;
padding: 0 24px;

/* Responsive */
@media (max-width: 768px) {
  padding: 0 16px;
}
```

### Grid System

**12-Column Grid**
```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 24px;

/* Responsive */
@media (max-width: 1024px) {
  gap: 16px;
}

@media (max-width: 768px) {
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
```

---

## 9. Iconography

### Size System

| Size | Pixels | Usage |
|------|--------|-------|
| XS | 12px | Inline icons |
| SM | 16px | Buttons, labels |
| MD | 20px | Navigation |
| LG | 24px | Headers |
| XL | 32px | Features |
| 2XL | 48px | Empty states |

### Icon Style
- Line weight: 1.5px to 2px
- Style: Outlined/Stroke
- Corner radius: Slightly rounded

---

## 10. Responsive Breakpoints

```css
/* Mobile */
@media (min-width: 320px) { }

/* Mobile Large */
@media (min-width: 428px) { }

/* Tablet */
@media (min-width: 768px) { }

/* Desktop Small */
@media (min-width: 1024px) { }

/* Desktop */
@media (min-width: 1280px) { }

/* Desktop Large */
@media (min-width: 1536px) { }
```

---

## 11. Accessibility

### Color Contrast Ratios

- **Normal Text**: Minimum 4.5:1
- **Large Text (18px+)**: Minimum 3:1
- **UI Components**: Minimum 3:1

### Focus States

```css
outline: 2px solid #e25a4a;
outline-offset: 2px;
border-radius: 8px;
```

### Animation Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 12. Component States

### Interactive States

**Default → Hover → Active → Focus → Disabled**

| State | Background | Border | Opacity | Transform |
|-------|------------|--------|---------|-----------|
| Default | Base color | Base | 1 | none |
| Hover | +5% darker | +10% darker | 1 | scale(1.01) |
| Active | +10% darker | +15% darker | 1 | scale(0.98) |
| Focus | Base | Accent | 1 | none |
| Disabled | Gray-100 | Gray-300 | 0.5 | none |

---

## 13. Usage Guidelines

### Do's ✅

- Use Inter for all text to maintain consistency
- Maintain 4px spacing increments
- Use semantic colors for feedback (success, error, warning)
- Apply elevation shadows to create hierarchy
- Ensure 4.5:1 contrast ratio for text
- Use the primary gradient sparingly for premium features

### Don'ts ❌

- Don't mix multiple font families
- Don't use arbitrary spacing values
- Don't use color alone to convey information
- Don't stack multiple shadows
- Don't use decorative animations on functional elements
- Don't override focus states for accessibility

---

## 14. Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary-900: #0f1835;
  --color-primary-800: #1a2444;
  --color-accent-600: #e25a4a;
  --color-accent-500: #fa6e5b;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  
  /* Typography */
  --font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-size-body-m: 14px;
  --line-height-body-m: 21px;
  
  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(15, 24, 53, 0.05);
  --shadow-md: 0 4px 6px rgba(15, 24, 53, 0.07);
  
  /* Transitions */
  --transition-base: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained by**: Design Team
