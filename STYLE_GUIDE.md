# STYLE_GUIDE.md — Reusable Design System

**Version:** 1.0  
**Source Project:** Hex 2048  
**Last Updated:** 2024

---

## 1. Color Palette

### 1.1 Background Colors

```css
/* Primary Background */
--bg-primary: #9a8a76;        /* Warm beige-gray (main background) */
--bg-secondary: #faf8ef;      /* Light cream (modals, cards) */
--bg-tertiary: #bbada0;       /* Medium beige (score boxes, panels) */
```

### 1.2 Text Colors

```css
/* Primary Text */
--text-primary: #776e65;       /* Dark brown-gray (headings, body) */
--text-secondary: #f9f6f2;    /* Light cream (text on dark) */
--text-white: #ffffff;         /* Pure white (high contrast) */
--text-light: #eee4da;        /* Light beige (labels, secondary text) */
```

### 1.3 UI Element Colors

```css
/* Buttons */
--btn-primary: #8f7a66;        /* Dark brown (default buttons) */
--btn-primary-hover: #9f8a76; /* Lighter brown (hover state) */
--btn-accent: #edc22e;         /* Golden yellow (primary actions) */
--btn-accent-hover: #f4d03f;  /* Brighter yellow (hover state) */

/* Borders & Strokes */
--border-light: rgba(120, 110, 100, 0.3);    /* Light border */
--border-medium: rgba(120, 110, 100, 0.4);   /* Medium border */
--border-dark: rgba(120, 110, 100, 0.5);     /* Dark border */
```

### 1.4 Tile/Value Colors (Gradient System)

**Low Values (2-4):**
```css
--tile-2: #eee4da;    /* Light beige */
--tile-4: #eee4da;    /* Light beige */
```

**Medium Values (8-128):**
```css
--tile-8: #f2b179;     /* Peach */
--tile-16: #f59563;   /* Orange-peach */
--tile-32: #f67c5f;   /* Coral */
--tile-64: #f65e3b;   /* Red-orange */
--tile-128: #edcf72;  /* Light yellow */
```

**High Values (256-1024):**
```css
--tile-256: #edcc61;  /* Yellow-gold */
--tile-512: #edc850;  /* Golden yellow */
--tile-1024: #edc22e; /* Bright gold */
```

**Very High Values (2048+):**
```css
--tile-2048: #f0d4a0;   /* Light cream-gold */
--tile-4096: #e8d4b8;  /* Cream-beige */
--tile-8192: #d8c8b8;  /* Gray-beige */
--tile-16384: #c8b8a8; /* Medium gray-beige */
--tile-32768: #b8a898; /* Dark gray-beige */
```

### 1.5 Text Color Rules for Tiles

```css
/* Dark text (on light backgrounds) */
--text-on-light: #776e65;  /* For values 2-4, 2048-8192 */

/* Light text (on dark backgrounds) */
--text-on-dark: #f9f6f2;   /* For values 8-1024, 16384+ */
```

**Text Color Logic:**
- Values 2-4: Dark text (`#776e65`)
- Values 8-1024: Light text (`#f9f6f2`)
- Values 2048-8192: Dark text (`#776e65`)
- Values 16384+: Light text (`#f9f6f2`)

### 1.6 Overlay & Modal Colors

```css
--overlay: rgba(0, 0, 0, 0.5);  /* Modal backdrop */
--shadow: rgba(0, 0, 0, 0.3);   /* Box shadows */
```

### 1.7 Grid/Cell Colors

```css
--cell-fill: rgba(238, 228, 218, 0.35);      /* Cell background */
--cell-stroke: rgba(120, 110, 100, 0.4);    /* Cell border */
```

---

## 2. Typography

### 2.1 Font Families

```css
/* Primary Font Stack */
font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif;

/* System Font Fallback */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

### 2.2 Font Smoothing

```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

### 2.3 Font Sizes

```css
/* Headings */
--font-size-h1: 64px;        /* Desktop main heading */
--font-size-h1-mobile: 36px; /* Mobile main heading */
--font-size-h2: 48px;        /* Desktop section heading */
--font-size-h2-mobile: 32px; /* Mobile section heading */

/* Body Text */
--font-size-body: 18px;      /* Desktop body */
--font-size-body-mobile: 16px; /* Mobile body */
--font-size-small: 14px;     /* Desktop small text */
--font-size-small-mobile: 12px; /* Mobile small text */
--font-size-tiny: 13px;      /* Labels, captions */
--font-size-tiny-mobile: 11px; /* Mobile labels */

/* UI Elements */
--font-size-button: 16px;    /* Desktop buttons */
--font-size-button-mobile: 14px; /* Mobile buttons */
--font-size-score: 24px;     /* Desktop score values */
--font-size-score-mobile: 20px; /* Mobile score values */
```

### 2.4 Font Weights

```css
--font-weight-normal: 400;
--font-weight-bold: bold;    /* Headings, buttons, scores */
```

### 2.5 Text Transform

```css
text-transform: uppercase;  /* Labels (score, radius, etc.) */
```

---

## 3. Spacing

### 3.1 Padding

```css
/* Component Padding */
--padding-xs: 6px;
--padding-sm: 8px;
--padding-md: 12px;
--padding-lg: 16px;
--padding-xl: 20px;
--padding-2xl: 24px;
--padding-3xl: 32px;

/* Button Padding */
--btn-padding-y: 12px;       /* Desktop vertical */
--btn-padding-y-mobile: 10px; /* Mobile vertical */
--btn-padding-x: 24px;       /* Desktop horizontal */
--btn-padding-x-mobile: 20px; /* Mobile horizontal */
--btn-padding-icon: 16px;     /* Icon-only buttons */
--btn-padding-icon-mobile: 12px; /* Mobile icon buttons */
```

### 3.2 Margins

```css
--margin-xs: 4px;
--margin-sm: 8px;
--margin-md: 12px;
--margin-lg: 16px;
--margin-xl: 20px;
--margin-2xl: 24px;
```

### 3.3 Gaps

```css
--gap-xs: 8px;
--gap-sm: 12px;
--gap-md: 16px;
--gap-lg: 20px;
```

---

## 4. Border Radius

```css
--radius-sm: 6px;   /* Buttons, score boxes, small elements */
--radius-md: 12px;  /* Modals, cards, larger containers */
--radius-lg: 16px;  /* Extra large containers (if needed) */
```

---

## 5. Shadows

```css
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 20px rgba(0, 0, 0, 0.3);  /* Modals */
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
```

---

## 6. Transitions & Animations

### 6.1 Transitions

```css
/* Standard Transitions */
--transition-fast: 0.15s ease-out;    /* Tile movement, quick changes */
--transition-normal: 0.2s ease;        /* Button hover, general UI */
--transition-slow: 0.3s ease;          /* Background color changes */
```

### 6.2 Animation Durations

```css
--anim-fast: 0.2s;      /* Slide animations */
--anim-normal: 0.35s;   /* Merge animations */
--anim-slow: 0.8s;      /* Spawn animations */
```

### 6.3 Animation Easing

```css
ease-out;  /* Standard easing for most animations */
```

### 6.4 Transform Effects

```css
/* Hover Effects */
transform: scale(0.98);  /* Button active state */

/* Animation Keyframes */
/* Merge: scale 1 → 1.08 → 1, brightness 1 → 1.12 → 1 */
/* Spawn: scale 0 → 1.05 → 1, opacity 0 → 1 */
/* Value Bounce: scale 1 → 1.15 → 1 */
```

---

## 7. Responsive Breakpoints

```css
/* Mobile Breakpoint */
@media (max-width: 768px) {
  /* Mobile-specific styles */
}
```

**Breakpoint Strategy:**
- Desktop: Default styles (no media query)
- Mobile: `max-width: 768px` (tablets and phones)

---

## 8. Z-Index Layers

```css
--z-base: 10;        /* Tiles */
--z-elevated: 12;    /* Spawning tiles */
--z-high: 15;        /* Merging tiles */
--z-modal: 1000;     /* Modals, overlays */
```

---

## 9. Component-Specific Styles

### 9.1 Buttons

```css
/* Default Button */
background: var(--btn-primary);
color: var(--text-secondary);
border: none;
border-radius: var(--radius-sm);
padding: var(--btn-padding-y) var(--btn-padding-x);
font-size: var(--font-size-button);
font-weight: var(--font-weight-bold);
cursor: pointer;
transition: background var(--transition-normal);

/* Hover */
background: var(--btn-primary-hover);

/* Active */
transform: scale(0.98);

/* Primary/Accent Button */
background: var(--btn-accent);
color: var(--text-secondary);

/* Primary Hover */
background: var(--btn-accent-hover);
```

### 9.2 Score Boxes / Panels

```css
background: var(--bg-tertiary);
border-radius: var(--radius-sm);
padding: var(--padding-sm) var(--padding-lg);
min-width: 100px;
text-align: center;
```

### 9.3 Modals

```css
/* Overlay */
background: var(--overlay);
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
z-index: var(--z-modal);

/* Content */
background: var(--bg-secondary);
border-radius: var(--radius-md);
padding: var(--padding-3xl);
box-shadow: var(--shadow-md);
```

### 9.4 Grid Cells

```css
fill: var(--cell-fill);
stroke: var(--cell-stroke);
stroke-width: 1;
```

---

## 10. CSS Variables (Complete Set)

For easy reuse, here's a complete CSS variables file:

```css
:root {
  /* Backgrounds */
  --bg-primary: #9a8a76;
  --bg-secondary: #faf8ef;
  --bg-tertiary: #bbada0;
  
  /* Text */
  --text-primary: #776e65;
  --text-secondary: #f9f6f2;
  --text-white: #ffffff;
  --text-light: #eee4da;
  --text-on-light: #776e65;
  --text-on-dark: #f9f6f2;
  
  /* Buttons */
  --btn-primary: #8f7a66;
  --btn-primary-hover: #9f8a76;
  --btn-accent: #edc22e;
  --btn-accent-hover: #f4d03f;
  
  /* Borders */
  --border-light: rgba(120, 110, 100, 0.3);
  --border-medium: rgba(120, 110, 100, 0.4);
  --border-dark: rgba(120, 110, 100, 0.5);
  
  /* Overlays & Shadows */
  --overlay: rgba(0, 0, 0, 0.5);
  --shadow: rgba(0, 0, 0, 0.3);
  
  /* Grid */
  --cell-fill: rgba(238, 228, 218, 0.35);
  --cell-stroke: rgba(120, 110, 100, 0.4);
  
  /* Spacing */
  --padding-xs: 6px;
  --padding-sm: 8px;
  --padding-md: 12px;
  --padding-lg: 16px;
  --padding-xl: 20px;
  --padding-2xl: 24px;
  --padding-3xl: 32px;
  
  --margin-xs: 4px;
  --margin-sm: 8px;
  --margin-md: 12px;
  --margin-lg: 16px;
  --margin-xl: 20px;
  --margin-2xl: 24px;
  
  --gap-xs: 8px;
  --gap-sm: 12px;
  --gap-md: 16px;
  --gap-lg: 20px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  
  /* Shadows */
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  
  /* Transitions */
  --transition-fast: 0.15s ease-out;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;
  
  /* Z-Index */
  --z-base: 10;
  --z-elevated: 12;
  --z-high: 15;
  --z-modal: 1000;
}
```

---

## 11. Usage Examples

### 11.1 Button Component

```css
.button {
  background: var(--btn-primary);
  color: var(--text-secondary);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--btn-padding-y) var(--btn-padding-x);
  font-size: var(--font-size-button);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: background var(--transition-normal);
}

.button:hover {
  background: var(--btn-primary-hover);
}

.button:active {
  transform: scale(0.98);
}

.button.primary {
  background: var(--btn-accent);
}

.button.primary:hover {
  background: var(--btn-accent-hover);
}
```

### 11.2 Card/Panel Component

```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--padding-3xl);
  box-shadow: var(--shadow-md);
  color: var(--text-primary);
}
```

### 11.3 Modal Component

```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--padding-3xl);
  box-shadow: var(--shadow-md);
  color: var(--text-primary);
}
```

---

## 12. Design Principles

### 12.1 Color Philosophy

- **Warm, earthy tones** — Beige, brown, cream create a cozy, approachable feel
- **High contrast** — Text is always readable (dark on light, light on dark)
- **Progressive intensity** — Tile colors get more saturated as values increase
- **Subtle borders** — Low-opacity strokes for definition without harshness

### 12.2 Typography Philosophy

- **Clear, readable fonts** — System fonts for performance, Clear Sans when available
- **Bold headings** — Strong visual hierarchy
- **Responsive sizing** — Scales appropriately on mobile
- **Uppercase labels** — Small text uses uppercase for emphasis

### 12.3 Spacing Philosophy

- **Consistent rhythm** — Multiples of 4px (4, 8, 12, 16, 20, 24, 32)
- **Generous padding** — Comfortable touch targets and breathing room
- **Flexible gaps** — Use flexbox gap for consistent spacing

### 12.4 Animation Philosophy

- **Fast and responsive** — Quick transitions (0.15-0.2s) for immediate feedback
- **Smooth easing** — `ease-out` for natural deceleration
- **Subtle transforms** — Scale effects for tactile feedback
- **Purposeful motion** — Animations enhance understanding, not decoration

---

## 13. Accessibility Notes

- **Color contrast** — All text meets WCAG AA standards
- **Touch targets** — Minimum 44px on mobile
- **Focus states** — Ensure visible focus indicators
- **Font sizes** — Minimum 12px for readability

---

## 14. Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties (CSS variables) supported
- Flexbox and Grid supported
- CSS transforms and transitions supported

---

## 15. Notes for Implementation

1. **Import CSS variables** — Add the `:root` variables to your global CSS
2. **Use semantic names** — Prefer `--btn-primary` over `--color-brown`
3. **Mobile-first** — Define desktop styles, override with mobile media queries
4. **Test contrast** — Verify text readability on all backgrounds
5. **Consistent spacing** — Stick to the spacing scale (multiples of 4px)

---

**This style guide is designed to be portable across projects. Copy the CSS variables section and adapt component styles as needed.**

