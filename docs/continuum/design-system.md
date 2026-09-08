# AFDA Continuum — Design System

## Intent

The Continuum design system supports high-density operational work while retaining a restrained AFDA relationship. Its visual direction is primarily black, white and red with one controlled teal operational accent. The branding is provisional and the text lockup is not presented as an official AFDA logo.

## Package

`packages/continuum-ui` provides the reusable shell and primitives consumed by `apps/continuum`:

- application frame, sidebar and mobile navigation;
- page headers and structured sections;
- actions, inputs, selects and dialogs;
- responsive data tables;
- status, source and integration indicators;
- alerts, empty and loading states;
- demo-mode banner and module deep-link treatment.

The CSS establishes semantic colours, typography, spacing, focus, selection, scrollbar and responsive table behaviour. Controls use a minimum 44-pixel interactive target and tables expose captions, column headers and labelled mobile records.

## Usage rules

- Prefer structured lists and tables over interchangeable cards.
- Label the source and state of cross-system records.
- Put one clear next action near the information it affects.
- Treat red as an institutional/action signal, not decoration.
- Use teal for controlled lineage or operational emphasis.
- Do not use gradients, glassmorphism, fake analytics or invented claims.
- Never represent fixtures as live institutional data.

## Accessibility baseline

- Keyboard-visible focus is required on every interactive element.
- Colour never carries status alone; text labels accompany every state.
- Page hierarchy remains semantic and zoom-tolerant.
- Data tables retain their meaning on narrow screens.
- Loading, missing configuration and permission restrictions use explicit language.

## Maintenance

Token and primitive changes belong in `packages/continuum-ui`; product-specific layout remains in `apps/continuum`. A shared change requires package type-checking and a Continuum production build before release. Official brand assets, when supplied, require a deliberate design review rather than silent token replacement.
