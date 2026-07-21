# Oleocon Section 5 Option A

Drop this ZIP into your project root.

It replaces only:

- src/pages/Work/Oleocon/OleoconPage.tsx
- src/pages/Work/Oleocon/OleoconPage.css

What changed:

- Section 5 now has a real responsive visual target area.
- The 3D model still stays inside the existing fixed Three.js world.
- The model is positioned by the Section 5 visual area, not by blind full-screen x/y numbers.
- Desktop: model area + text area side by side.
- Tablet/mobile: model area stacks above text.
- Section 4 is not redesigned.

Test:

1. npm run dev
2. Open /work/Oleocon#model
3. In Chrome: F12 -> Toggle device toolbar
4. Test 1366x768, 820x1180, 390x844
