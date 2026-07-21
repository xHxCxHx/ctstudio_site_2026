# CTS Design System

## Core Rule

Mobile-first. Every layout must work from phone to wide desktop.

## Breakpoints

- Mobile: default / below 640px
- Tablet: 640px+
- Desktop: 1024px+
- Wide: 1440px+

## Layout Rules

- Do not use `100vw`
- Use `width: 100%`
- Use `max-width` containers
- Use `clamp()` for typography
- Use responsive spacing
- Use `overflow-x: hidden` on `html`, `body`, and `#root`
- Media must be constrained with `max-width`, `height: auto`, `object-fit`, and aspect-ratio when needed

## Visual Direction

CTS should feel:
- cinematic
- premium
- technical
- minimal
- interactive
- high-end but not overloaded

## Homepage Style

Landing page should be lighter than project pages:
- text
- images
- selected motion/video previews
- links to deeper systems

## Project Page Style

Each project page can have its own visual identity:
- different color accents
- different menu behavior
- different layout system
- different experience style

But responsive rules always stay global.