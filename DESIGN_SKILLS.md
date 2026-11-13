---
name: Fresh & Fold Washday
description: Calm, practical, and warm design system for a laundry shop team managing orders, customers, services, staff, and daily activity.

colors:
  primary: "#2e694f"          # forest-green brand
  primary-hover: "#255641"    # derived, darker step for hover/pressed
  primary-soft: "#e6efe9"     # derived, tinted surface for selected rows and badges
  accent: "#e8833a"           # small orange accent (confirm exact hex against the Tailwind theme)
  background: "#f6f6f2"       # soft neutral page background
  surface: "#ffffff"          # white work surfaces
  border: "#e2e2dc"           # derived neutral divider
  text-primary: "#1f2a24"     # derived, near-black with green undertone
  text-secondary: "#5d6a63"   # derived, metadata and helper text
  focus: "#2e694f"            # visible focus ring uses the brand color
  success: "#2e694f"
  warning: "#b26a00"          # derived
  error: "#b42318"            # derived

typography:
  display:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  heading:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: DM Sans
    fontSize: 14px    
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: DM Sans
    fontSize: 12px           
    fontWeight: 400
    lineHeight: 1.4

rounded:
  sm: 6px
  md: 10px
  lg: 14px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  page-gutter: 16px           # mobile; 24px and up on desktop

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 10px 16px
    typography: "{typography.label}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 10px 16px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 16px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 10px 12px
---

## Overview

Fresh & Fold Washday is a practical back-office tool for a laundry shop team. It should feel calm, warm, and clear, the way a well-run counter feels. Screens prioritize the task at hand: finding an order, updating a customer, checking staff or daily activity. Decoration stays minimal. The brand's forest green anchors the interface, and small orange accents mark attention without shouting.

Copy is direct and specific to the shop. It uses real app language ("Ready for pickup," "Add service," "Mark as collected") and avoids marketing phrasing, slogans, and filler labels. Sample data is realistic and honest. The backend is not running, so demo-only behavior is labeled where users need to know.

## Colors

- **Primary (`#2e694f`):** Primary actions, active navigation, selected states, focus rings, and key status text. Use it sparingly so it keeps its meaning.
- **Background (`#f6f6f2`):** The page canvas behind the shell and content.
- **Surface (`#ffffff`):** Cards, tables, forms, and panels that hold work.
- **Accent (orange):** Small highlights such as a new-order indicator or a single attention marker. Never use it for primary buttons or long text.
- **Text:** Primary text for content, secondary text for metadata. Keep contrast at WCAG AA or better on both surfaces.
- **Status colors:** Success, warning, and error appear as tinted badges or inline messages, always paired with a text label so color is never the only signal.

## Typography

- **Manrope** for display and section headings. It gives page titles a steady, friendly presence.
- **DM Sans** for body text, labels, tables, and form controls.
- Primary content and form controls are 14px or larger. Captions at 12px are for secondary metadata only.
- One clear page heading per screen, followed by a concise description when it helps the task.

## Layout and Spacing

- Keep the shared app shell: sidebar, top bar, and established navigation. Do not change them unless the request asks.
- Each route is a distinct page built for its task. The orders page is not a template for other routes.
- Use a 4px base grid. Common gaps are 8, 16, 24, and 32px.
- Group related information with spacing and dividers. Avoid cards nested inside cards.
- Design mobile first, then expand for desktop. Tables collapse into stacked rows or scroll horizontally inside their container. Important content is never clipped.
- Each page has one visible primary action, placed in the page header on desktop and at the bottom of forms on mobile.

## Elevation and Depth

- Depth is flat by default. Use a 1px `border` for separation.
- Use a soft shadow only for overlays such as menus, dialogs, and toasts.
- Do not stack shadows or add decorative gradients.

## Shapes

- Buttons and inputs use `md` (10px) corners.
- Cards and panels use `lg` (14px) corners.
- Badges and avatars use `full` pill or circle shapes.
- Icons come from `lucide-react`. Never use emoji or text glyphs as interface icons.

## Components

- **Primary button:** Brand green fill, white label. One per view or form.
- **Secondary button:** White surface, green label and border. For cancel or alternate actions.
- **Icon button:** Requires an accessible name (`aria-label`) and a visible focus state.
- **Inputs:** Always paired with a visible label. Show helper or error text below the field. Disabled fields look disabled and explain why when that is not obvious.
- **Tables:** Sticky header, sortable columns where useful, row hover in `primary-soft`. Empty tables show a short message and the action to add the first record.
- **Badges:** Status labels such as "Washing," "Ready," or "Collected," with text and a tinted background.
- **Feedback:** Use Sonner for transient success, error, and info feedback, including form validation. Do not use browser `alert()` dialogs or hand-built notice banners for transient action feedback. Keep persistent shop notifications in the Notifications page.
- **Empty states:** Name what is missing and give one next step ("No customers yet. Add your first customer.").
- **Demo indicators:** Where an action only updates frontend state, label it as demo data so users are not misled.

## Accessibility

- Use semantic HTML: headings in order, `button` for actions, `a` for navigation, `label` for every input.
- All controls are keyboard operable with a visible focus ring in `focus`.
- Icon-only controls have accessible names.
- Respect reduced-motion preferences. Keep motion brief and purposeful.

## Authentication

- Sign-in uses email or phone plus password only.
- Do not add social sign-in options.

## Do's and Don'ts

**Do**
- Use the brand green for primary actions and active states.
- Keep copy short, specific, and in the language the shop team already uses.
- Show empty, loading, disabled, and error states where the task needs them.
- Test every visible control for its named action.
- Reuse existing components before creating new ones.

**Don't**
- Don't use orange for primary buttons or body text.
- Don't use emoji or text glyphs as icons.
- Don't add decorative cards inside cards or heavy shadows.
- Don't invent metrics, testimonials, or marketing claims.
- Don't reuse one route's layout as a placeholder for another.
- Don't add social sign-in.
