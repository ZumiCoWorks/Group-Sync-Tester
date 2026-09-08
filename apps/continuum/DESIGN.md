---
name: AFDA Continuum
description: A precise production ledger connecting operational activity to academic authority.
colors:
  afda-red: "#c8202f"
  production-black: "#101010"
  ledger-ink: "#1d1d1b"
  paper: "#f4f2ed"
  white: "#ffffff"
  rule-line: "#d8d4cc"
  muted-ink: "#68655f"
  source-signal: "#008f8f"
  positive: "#167a4b"
  warning: "#8a5900"
  critical: "#b42318"
typography:
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2rem, 4vw, 4rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Georgia, 'Times New Roman', serif"
    fontSize: "1.55rem"
    fontWeight: 400
  body:
    fontFamily: "Inter, Arial, Helvetica, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, Arial, Helvetica, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 800
    letterSpacing: "0.08em"
rounded:
  square: "0px"
  control: "2px"
spacing:
  xs: "0.35rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "2rem"
  section: "2.5rem"
components:
  button-primary:
    backgroundColor: "{colors.ledger-ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.afda-red}"
    textColor: "{colors.white}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.control}"
    padding: "0.7rem 1rem"
    height: "44px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.square}"
    padding: "0.65rem 0.75rem"
    height: "44px"
  panel:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ledger-ink}"
    rounded: "{rounded.square}"
    padding: "{spacing.lg}"
  status:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    rounded: "{rounded.square}"
    padding: "0.2rem 0.45rem"
    height: "26px"
---

# Design System: AFDA Continuum

## Overview

**Creative North Star: “The Production Ledger”**

Continuum combines the decisiveness of an institutional record with the energy of creative production. Its base is a pale paper field ruled by black structure, with AFDA red used as a scarce identifying signal. Editorial serif headlines establish hierarchy; compact sans-serif labels, tables and controls carry operational work.

The owner-supplied CARS screenshot informs the black, white and red relationship and the sense that AFDA is both creative and accountable. Continuum is a refined relative, not a visual copy: illustration may eventually appear as a restrained watermark or transitional accent, but never behind dense operational data. The interface stays flat, legible and explicit about source, status and next action.

**Key Characteristics:**

- Editorial headings over disciplined operational typography.
- Paper, ink and rule-line surfaces with almost no decorative elevation.
- AFDA red for identity and consequential emphasis, not routine status.
- Teal source signals and semantic green, amber and red states with text labels.
- Dense information structured through borders, spacing and alignment.

## Colors

The palette is institutional black and paper with a committed AFDA red accent, supported by a separate provenance signal and semantic operational states.

### Primary

- **AFDA Signal Red:** Identifies the product, active navigation, timeline markers and decisive hover states.

### Secondary

- **Source Teal:** Marks provenance, connected-source concepts, demo banners and keyboard focus without competing with the AFDA identity.

### Tertiary

- **Operational Green, Amber and Critical Red:** Communicate positive, caution and blocking states. They always appear with text, never as colour-only meaning.

### Neutral

- **Production Black:** Anchors the permanent navigation rail and the strongest brand field.
- **Ledger Ink:** Carries body text, structural borders and primary controls.
- **Paper:** Forms the application canvas and supports long operational sessions.
- **Rule Line:** Separates records and regions without introducing raised cards.
- **Muted Ink:** Carries supporting copy, metadata and labels.
- **White:** Distinguishes data surfaces, fields and panels from the paper canvas.

### Named Rules

**The Red Is a Signature Rule.** AFDA red identifies and prioritises; it does not become a generic background for every card or status.

**The Meaning Has Words Rule.** Every semantic colour is paired with a readable label or message.

## Typography

**Display Font:** Georgia, with Times New Roman and serif fallbacks.

**Body Font:** Inter, with Arial, Helvetica and sans-serif fallbacks.

**Label/Mono Font:** Inter for labels; the system monospace stack is reserved for identifiers.

**Character:** The serif voice gives Ventures and milestones an editorial, authored quality. The sans-serif voice is direct and compact for scanning records, controls and operational metadata.

### Hierarchy

- **Display** (400, fluid 2–4rem, 1 line-height): Page titles only, with tight tracking and a maximum readable width.
- **Headline** (400, 1.55rem): Section titles that divide the ledger into clear operational chapters.
- **Body** (400, 1rem base, 1.6 line-height): Explanations and page-level context, normally held below 720px.
- **Operational body** (400, approximately 0.875rem): Tables, panels and workflow detail where density is valuable.
- **Label** (800, 0.72rem, expanded tracking, uppercase): Source metadata, table headings and short state labels.

### Named Rules

**The Two Voices Rule.** Serif type names the work; sans-serif type explains, controls and records it.

## Layout

Desktop uses a fixed 244px black navigation rail beside a fluid workspace. Main content is capped at 1440px and uses responsive horizontal padding between 1.25rem and 4rem. Pages follow a strong vertical ledger rhythm: page header, explicit demo state, then sections separated by 2.5rem.

Two-column grids support paired operational summaries; four-column grids are limited to compact metrics. At 980px the navigation becomes a horizontally scrollable top rail and metric grids reduce to two columns. At 640px, content padding tightens, grids become single-column, page actions stack and composite callouts become vertical. Tables transform into labelled record rows so narrow screens preserve every header/value relationship without requiring horizontal discovery.

## Elevation & Depth

The system is flat by default and has no general shadow vocabulary. Depth comes from tonal contrast between paper and white, strong top rules, fine borders and the permanent black navigation field. The native dialog backdrop is the only deliberately overlaid plane.

### Named Rules

**The Ledger Stays Flat Rule.** Do not add ambient card shadows; use rules, tone and spacing to express hierarchy.

## Shapes

The form language is square and precise. Fields, dialogs, status chips, panels and tables use zero radius. Primary and secondary buttons use only a 2px softening. Small dots and loading indicators may be circular because they communicate signal or motion rather than container shape.

Illustrative patterning from the CARS reference is not a container shape. If an approved asset becomes available, confine it to low-information identity moments and maintain strong text contrast.

## Components

### Buttons

- **Shape:** Near-square with a 2px radius and a 44px minimum height.
- **Primary:** Ledger Ink with white text and compact 0.7rem × 1rem padding.
- **Hover / Focus:** Hover commits to AFDA red; keyboard focus uses a 3px Source Teal outline with a 3px offset.
- **Secondary:** Transparent with an ink border; hover inverts to the same AFDA red treatment.

### Status Chips

- **Style:** Square, bordered and uppercase with compact tracking.
- **State:** Neutral, positive, warning, critical and source-accent variants combine border, pale tint and explicit text.

### Cards / Containers

- **Corner Style:** Square.
- **Background:** White over the Paper canvas.
- **Shadow Strategy:** None; see the flat-ledger rule.
- **Border:** One-pixel Rule Line, with a stronger top rule when the component starts an operational record.
- **Internal Padding:** Usually 1rem or 1.25rem.

### Inputs / Fields

- **Style:** White field, square corner, 1px neutral stroke and 44px minimum height.
- **Focus:** Shared 3px Source Teal focus outline with visible offset.
- **Labels:** Uppercase, weight 800 and separated from the control by 0.35rem.

### Navigation

Desktop navigation is white on Production Black, numbered to support orientation, and marked active with a darker black field plus a red left rule. Below 980px it becomes a horizontally scrolling rail with a red bottom rule for the active item. Navigation labels remain single-line and do not collapse into an unlabeled icon system.

### Demo and Source Signals

The demo banner combines a warm neutral fill, a Source Teal left rule and explicit “POC · DEMO MODE” language. Source badges use a small teal square plus uppercase text. These patterns prevent fictional or disconnected data from reading as live institutional truth.

### Data Tables

Tables use white rows, warm-grey uppercase headers, a 2px ink top rule and 1px horizontal row separators. Non-interactive rows do not use hover styling. At narrow widths, each cell exposes its column label and rows become stacked ledger records.

## Do's and Don'ts

### Do:

- **Do** expose source, state, authority and next action wherever a record changes hands.
- **Do** use AFDA red sparingly for identity, active location and consequential interaction.
- **Do** preserve square geometry, fine rules and a consistent 1rem–1.25rem component inset.
- **Do** label fictional, disconnected and imported data in words.
- **Do** keep dense tables readable through alignment, whitespace and horizontal scrolling.

### Don't:

- **Don't** reproduce the CARS full-screen illustration behind operational content.
- **Don't** use gradients, glass effects, floating shadow stacks or heavily rounded dashboard cards.
- **Don't** present the text lockup as an official AFDA logo or redraw the CARS logo from a screenshot.
- **Don't** use red for ordinary success, warning and provenance states.
- **Don't** hide application destinations behind unlabeled icons or embed existing modules in iframes.
