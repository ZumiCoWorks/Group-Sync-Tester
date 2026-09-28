---
name: AFDA Continuum Conference Prototype
description: A learning-led orchestration prototype that makes every output traceable to an explicit input and source owner.
colors:
  afda-red: "#ed1c24"
  afda-red-deep: "#c70f1a"
  ink: "#17161b"
  canvas: "#f3f2f6"
  journey-rail: "#ebeaf0"
  paper: "#ffffff"
  soft-surface: "#f7f6f9"
  rule: "#dfdde5"
  muted-ink: "#696773"
  ready-green: "#168b68"
  warning-amber: "#8b5d00"
  focus-teal: "#008f8f"
typography:
  display:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "36px"
    fontWeight: 720
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist, Arial, Helvetica, sans-serif"
    fontSize: "11px"
    fontWeight: 800
    letterSpacing: "0.04em"
rounded:
  surface: "22px"
  panel: "14px"
  control: "10px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "34px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 17px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 17px"
    height: "42px"
  trace-card:
    backgroundColor: "rgba(255, 255, 255, 0.7)"
    rounded: "{rounded.panel}"
    padding: "12px"
---

# Design System: AFDA Continuum Conference Prototype

## Overview

**Creative North Star: “A governed learning journey.”**

Continuum should feel like a coherent learning product while retaining the clarity and control of an orchestration console. The reference pattern is a course journey: a stable product bar, a visible sequence on the left and a focused learning surface on the right. The interface must explain how configured inputs become governed outputs; it must never skip directly to a dashboard result.

The supplied AFDA Continuum SVG lockups are the product identity. White and pale lilac establish a calm learning environment, black creates focused summary surfaces and AFDA red marks the current step or significant action.

## Product hierarchy

Use the validated hierarchy only:

`Continuum → School workspace → Enabled service → Service workflow/data → Scoped user access`

BCom is the configured pilot workspace. Other schools may receive access to established services without implying their academic models have been configured.

## Input-to-output rule

Every result must answer three questions:

1. What input produced this?
2. Which school or service owns the source record or rule?
3. What did Continuum expose, coordinate or govern?

The first demo step is always **Pilot inputs**. Its editable local values are saved in browser state and drive the institution, BCom, assessment and role-preview screens. If a service is not exposed, dependent records and context must say so rather than showing a hard-coded result.

Source-trace cards use three recurring categories: orchestrator input, existing-service record and school-owned rule. These cards sit before the result they explain.

## Colors

AFDA red is directional rather than decorative. Use it for the active journey step, small source icons, progress and selected controls. Black is reserved for expected-output panels, major summaries and primary actions. Green, amber and blue-grey communicate named states; color never carries meaning alone.

## Typography

Geist is bundled locally through `next/font/local`, with Arial and Helvetica fallbacks. Headings are compact and bold; working copy is neutral and readable. Uppercase labels are reserved for form labels, source categories and metadata.

Conference projection is a hard constraint: primary body copy remains around 13–14px on desktop and never depends on tiny explanatory footnotes.

## Layout

Desktop uses a white 76px product bar, a 310px pale journey rail and a fluid workspace capped at 1240px. The journey rail presents the five-minute narrative as named steps with durations and completion state. The workspace uses generous whitespace, rounded learning surfaces and focused split panels.

The setup surface pairs an editable form with a dark live expected-output panel. Subsequent screens use source-trace cards before their derived result. Tables remain appropriate for assessment activity and audit history, but they are supporting structures rather than the product’s visual identity.

Below 1120px, multi-column content stacks. Below 780px, the journey becomes a horizontally scrollable strip with visible step names, the product bar keeps the fictional-data disclosure and forms become single-column.

## Shapes and depth

Large learning surfaces use 22–24px radii; panels and trace cards use 14–16px radii; controls use 10px or full pills. Soft shadows may separate a primary learning surface from the lilac canvas. Tables and repeated rows rely on borders rather than individual shadows.

## Components

### Product bar

Use the supplied horizontal AFDA Continuum SVG. Keep the conference-deck link, fictional-data label and orchestrator identity visible on desktop. On mobile, preserve the logo, fictional-data label and identity avatar.

### Journey navigation

Each destination has an icon, name and explanation. The active step is a white card with a red circular marker. Completed steps show a check. Mobile navigation must preserve visible names and accessible labels.

### Pilot configuration

Inputs are real controlled fields in local demo state. The expected-output panel updates before submission. The submit action applies the configuration and moves to the derived institution result. Always retain the statement that the prototype creates no migration or institutional connection.

### Source trace

Place source-trace cards above the result they explain. Copy must name provenance or non-exposure explicitly—for example, “Group Sync output” or “Not exposed by the saved pilot configuration.”

### Buttons and focus

Primary buttons are black pills that may turn AFDA red on hover. Secondary controls are white outlined pills. All interactive elements use a three-pixel teal focus ring with a three-pixel offset and maintain adequate touch targets.

### Experience preview

Preview is framed inside the orchestrator session and always states that identity and permissions have not changed. Period, schedule, team and space details derive from the saved pilot configuration.

### Conference deck

The deck is a separate 16:9 browser route. It uses the same real logos, pale canvas, white slide surfaces, black focus blocks and red step markers. Slide controls have at least 28px pointer targets, work with arrow/Page/Home/End keys and do not intercept Space while an interactive element is focused.

## Do’s and don’ts

### Do

- Begin with the inputs before showing institution or workspace results.
- Persist demo inputs locally and derive all dependent labels and visibility from them.
- Name source ownership and preserve school/service boundaries.
- Use “venture,” “business” and school-neutral “team” language instead of a film-only production model.
- Label fictional data, local state, disconnected integrations and controlled testing clearly.

### Don’t

- Don’t lead with aggregate dashboard cards or unexplained metrics.
- Don’t show a venue, schedule or roster when its source service was not exposed.
- Don’t imply live CARS, Microsoft 365 or Supabase integration.
- Don’t invent institution-wide programme structures, marks, analytics or school experiences.
- Don’t treat BCom as the whole Continuum LMS or present the pilot as institutionally approved production behavior.
