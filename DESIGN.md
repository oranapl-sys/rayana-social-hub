---
name: Rayana Social Hub
description: The Rayana market-stall chalkboard, carried into a phone-first planning hub.
colors:
  board-green: "#1F3B31"
  board-green-hover: "#2A4B3F"
  board-green-deep: "#162C24"
  oxblood: "#5B2024"
  oxblood-tint: "#EAD6D0"
  brass: "#C0A06A"
  chalk-cream: "#F1E8D8"
  chalk-warm: "#EBD5A4"
  chalk-warm-ox: "#EDB9AC"
  sack: "#EDE3CF"
  paper: "#F8F3EA"
  paper-2: "#F2EADB"
  ink: "#1F3B31"
  muted: "#55645C"
  danger: "#8E2A2E"
  dark-sack: "#101E18"
  dark-paper: "#16271F"
  dark-paper-2: "#1B2E25"
  dark-ink: "#ECE2CE"
  dark-muted: "#A3B1A6"
  dark-oxblood: "#7A2E33"
  dark-oxblood-text: "#E2A9A3"
  dark-oxblood-tint: "#3A1D20"
typography:
  chalk-display:
    fontFamily: "Cabin Sketch, Libre Baskerville, Georgia, serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "0.005em"
  chalk-line:
    fontFamily: "Cabin Sketch, Libre Baskerville, Georgia, serif"
    fontSize: "19px"
    fontWeight: 400
    lineHeight: 1.2
  chalk-special:
    fontFamily: "Cabin Sketch, Libre Baskerville, Georgia, serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.3
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.35
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.3
  code:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
    fontFeature: "tnum"
rounded:
  control: "4px"
  note: "6px"
  round: "50%"
spacing:
  xs: "6px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  section: "30px"
  control-height: "44px"
  tabbar: "64px"
  rail: "236px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.chalk-cream}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.board-green-hover}"
  button-ox:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.chalk-cream}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.chalk-cream}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  note:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.note}"
    padding: "12px 14px"
  note-need:
    backgroundColor: "{colors.oxblood-tint}"
  board:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.chalk-cream}"
    rounded: "{rounded.note}"
    padding: "10px 14px 18px"
  post-code:
    textColor: "{colors.muted}"
    typography: "{typography.code}"
    padding: "5px 7px"
  add-button:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.chalk-cream}"
    rounded: "{rounded.round}"
    size: "58px"
  tab-bar:
    backgroundColor: "{colors.board-green}"
    textColor: "{colors.chalk-cream}"
    height: "64px"
---

# Design System: Rayana Social Hub

## Overview

**Creative North Star: "The Market Board"**

The hub is the green A-frame chalkboard at the Rayana market stall. Every screen head is that board: deep green inside a brass frame, lettered in chalk. Below it, the work is paper notes pinned on a sack-cloth ground, each a little crooked, straightening under the hand. The board says what is on this week and names today's special, which is whatever needs Oran. The notes hold the detail.

The system is calm and dense enough for a phone held between market jobs. One text size runs through lists and rank comes from weight, the way a timetable works. Status is a printed mark in a fixed cell, not a coloured pill. Every post carries a short code you can quote in chat. Colour is scarce: green is the board and its furniture, cream is chalk and paper, brass draws the frames and rules, and oxblood appears only where something needs Oran.

The world deliberately turns away from the cream page with a serif title over a list of identical cards, which is what v1 and generic AI planners ship. The founder said v1 "looks really AI". The board, the chalk and the pinned notes exist to answer that.

**Key Characteristics:**
- A green chalkboard in a 3px brass frame heads every screen; chalk lettering lives on boards only.
- Paper notes on a sack ground, tilted -1.4, 1.1 and -0.6 degrees in turn, that straighten on hover, press or focus.
- Oxblood means "needs Oran" and nothing else.
- Status is a 16px printed ring that fills as the post moves along.
- Each post has a code made of ISO week, day and series (47-WED-BB).
- Corners are 4px on controls and 6px on notes and sheets. The round add button is the only exception.
- Light and dark modes. The board stays green in both.

## Colors

The four brand colours are pinned by the client. They are set on a warm sack-and-paper ground, so green carries the structure and oxblood carries the urgency.

### Primary
- **Board Green** (board-green): the chalkboard. Used for screen heads, the bottom tab bar and desktop rail, feed cells, picture-less reference tiles, selected chips and segments, primary buttons, the winning trial column, and toasts. In light mode it is also the ink colour. In dark mode it stays the same green, because the board does not change when the lights go down.
- **Board Green Hover / Deep** (board-green-hover, board-green-deep): the hover state for primary buttons, and the shadow tint.

### Secondary
- **Oxblood** (oxblood): "Needs Oran". It fills the add button, the ox button and error toasts. Its text form (`--ox-text`; dark-oxblood-text in dark mode) marks the ready status ring, today's row in the week, need counts in lane heads, need lines in post metadata, and links inside guides. The tint (oxblood-tint) is mixed at 45% into paper for notes that need him.

### Tertiary
- **Brass** (brass): the frame and the rule. It draws the board's 3px border, the inset line on the tab bar and rail, the active-tab bar, lane-head and guide-heading rules, the dashed market rule, the A/B/C trial boxes, list markers, the focus ring and the inner frame on feed cells and tiles (at 55%). It never fills a surface.

### Neutral
- **Chalk Cream** (chalk-cream): lettering on the board and text on green. Dimmed to 74% for secondary chalk. Warm chalk (chalk-warm) is for today's special, and chalk-warm-ox is for chalked states that need Oran.
- **Sack** (sack): the page ground under everything.
- **Paper / Paper 2** (paper, paper-2): notes, panels, inputs and sheets; paper-2 is used for hover fills, skeletons and table heads.
- **Ink / Muted** (ink, muted): working text and secondary text. Rules are ink at 16% (hairline) and 34% (strong).
- **Danger** (danger): destructive button text and error notice borders only.
- **Dark mode** (dark-*): sack, paper and ink move to deep green-blacks and cream ink. Oxblood deepens for fills and lightens to #E2A9A3 for text so it stays legible.

### Named Rules
**The Needs-Oran Rule.** Oxblood is reserved for what needs Oran: the add button, ready-for-you marks and notes, today's row, need counts. If nothing needs him, nothing on the screen is oxblood. Errors use danger or an oxblood toast, never decoration.

**The Brass Is Line Rule.** Brass draws frames, rules, markers and focus. It is never a fill or a background.

**The Board Stays Green Rule.** Board Green is the same in light and dark mode. Only the ground, paper and ink invert.

## Typography

**Chalk Font:** Cabin Sketch (with Libre Baskerville, Georgia)
**Headline Font:** Libre Baskerville (with Georgia, serif)
**Body Font:** Plus Jakarta Sans (with system-ui)

**Character:** Hand-chalked lettering on the board, a bookish serif for the titles of sheets and guides, and a clear, slightly warm sans for everything you read and tap.

### Hierarchy
- **Chalk Display** (700, 40px; 46px on desktop; 1.02): board titles such as "This week".
- **Chalk Special** (700, 21px, 1.2, warm chalk): today's special on the board.
- **Chalk Line** (400, 19px, 1.2): the chalked day lines, board subtitles and board tabs (18px). Feed-cell codes use chalk at clamp(17px, 4.6vw, 24px), and tile codes use it at 30px.
- **Headline** (400, 20px, 1.3): section titles, sheet titles, the week head and empty-state leads (19px). Guide h2 is 21px, and lane heads are 17px.
- **Body** (400, 15px, 1.5): working text. Guides cap at 68ch.
- **Title** (700, 14px, 1.35): post titles in lists, clamped to two lines. Metadata uses the same 14px at weight 500 in muted: one size, ranked by weight.
- **Label** (700, 13px): field labels. Day marks are 15px at 700, with uppercase date subs at 11px and 0.08em tracking.
- **Code** (700, 12px, 0.1em, uppercase, tabular): post codes in a 1px ruled box.

### Named Rules
**The Chalk Is Board Rule.** Cabin Sketch is used only on a board: the screen-head board, feed cells and picture-less reference tiles, each of which is a small board. It never appears on paper.

**The One Size Rule.** Inside lists, title and metadata share one size (14px) and rank by weight (700 against 500), not by size.

## Layout

Phone-first at 390px. Content sits in one column with 16px gutters. The bottom padding clears the 64px tab bar and the add button. The board sits 8px in from the screen edges, below the safe area. At 900px and up, the tab bar becomes a 236px sticky left rail with the Rayana wordmark, and the add button turns into a full-width rail button. The board centres at max 896px with 24px padding, and main content caps at 960px (pipeline and feed run wide). Notes go to an auto-fill grid of min 260px from 700px up. References use 2 columns, then 3 from 640px and 4 from 1180px. The pipeline uses snap-scrolling lanes (min(86%, 320px)) and becomes a 4-column grid from 1200px. The feed preview is a 3-column grid with 3px gaps and 3:4 cells, reflowing only in whole cells. The week manifest uses a 62px day column (92px on desktop). Spacing steps through 6, 8, 12, 16 and 30px. Controls are 44px tall.

## Elevation & Depth

Depth is physical and soft: paper pinned to a board. The board carries an inner vignette and a low drop. Pinned notes carry a two-layer soft shadow that deepens and lifts 3px on hover. Floating things (the add button, toasts, desktop sheets) share one ambient shadow. Inline panels and cards are flat with a hairline rule.

### Shadow Vocabulary
- **Board** (`box-shadow: inset 0 0 36px rgba(0,0,0,0.28), 0 6px 18px rgba(22,44,36,0.18)`): the chalkboard's worn edge and its lift off the sack.
- **Pinned** (`box-shadow: 0 2px 4px rgba(22,44,36,0.08), 0 8px 18px -10px rgba(22,44,36,0.35)`): notes at rest.
- **Pinned lifted** (`box-shadow: 0 4px 8px rgba(22,44,36,0.1), 0 16px 28px -12px rgba(22,44,36,0.45)`): notes under the pointer.
- **Float** (`box-shadow: 0 10px 28px rgba(22,44,36,0.22)`; dark `rgba(0,0,0,0.45)`): the add button, toasts and desktop sheets.
- **Brass edge** (`inset 0 1px 0 brass`): the top edge of the tab bar, sheets and toasts.

### Named Rules
**The Pinned Note Rule.** Notes rotate from the top centre by turns (-1.4deg, 1.1deg, -0.6deg) and straighten on hover, press or keyboard focus. The founder asked for this. With reduced motion they sit straight.

## Shapes

Corners are small and squared. Controls (buttons, chips, inputs, segments, board tabs, icon buttons, toasts) use 4px. Notes, panels, cards, references, the board and desktop sheets use 6px. The round add button on the phone is the one exception. Lines do structural work: 1px hairline rules between rows, dashed rules for open slots, the drop zone and chalk lines, and brass lines for frames. Feed cells are square-cornered tiles in a tight grid.

## Components

### Buttons
- **Shape:** squared (4px), 44px tall, 0 16px padding, weight 600 at 14.5px.
- **Default:** transparent with a strong-rule border and ink text. Hover fills with paper-2.
- **Primary:** board green with chalk text. Hover uses board-green-hover.
- **Ox:** oxblood with chalk text, only for actions that answer something that needs Oran. Hover brightens it by 12%.
- **Quiet / Link / Small / Danger:** borderless; underlined text; 36px tall; danger text with a 45% danger border.
- **Press:** scale(0.97) over 140ms with ease-out. **Focus:** 2px brass outline, offset 2px.

### Chips
- **Style:** 36px, 4px corners, strong-rule border, transparent, 14px at weight 600, with an optional count at 75%.
- **State:** selected chips fill with board green and chalk text. Press scales to 0.96.

### Cards / Containers
- **Notes:** paper, hairline border, 6px corners, 12px 14px padding, pinned tilt. A note that needs Oran mixes in oxblood tint and takes an oxblood-tinted border.
- **Panels, pipeline cards, references:** paper, hairline border, 6px corners, flat.
- **Open slot:** a dashed strong-rule border on 6px corners in muted text, so an undecided slot looks undecided.

### Inputs / Fields
- **Style:** paper fill, strong-rule border, 4px corners, 44px tall, 16px text, oxblood caret.
- **Focus:** the border shifts to ink, plus a 1px ink ring.

### Navigation
- **Phone:** a green bottom tab bar (64px) with a brass top line and five tabs (Week, Pipeline, Feed, References, Guides). Each tab has a Phosphor icon (23px) over an 11.5px label. The active tab goes full chalk with a bold icon and a 2px brass bar on top.
- **Desktop:** a 236px green rail with a brass right line, the serif "Rayana" wordmark, row tabs with a soft chalk fill and a brass left bar when active, and the add button docked at the bottom.

### The Board (signature)
The board is green inside a 3px brass frame with 6px corners and a faint chalk-dust radial wash. It shows the chalk title, the date and cycle line, one chalked line per day (day, what, state) on dashed chalk rules, and then today's special in warm chalk as an underlined button. Board tabs are dashed chalk outlines that fill with chalk when selected.

### Status Mark (signature)
The status mark is a 16px ring that fills like a clock as a post moves along: planned is empty, scripted is a quarter, filmed is half, rough cut is three quarters, and ready or later is a full dot. Ready marks are oxblood. Open slots get a dashed ring, and dropped posts get a struck ring. The mark always sits in the same fixed cell beside the title.

### Post Code (signature)
The post code is the ISO week, day and series code, for example 47-WED-BB. It is set in 12px uppercase tabular sans, tracked 0.1em, in a 1px ruled box. Tapping it copies the code so it can be quoted in chat.

### Small Boards (feed cells and reference tiles)
A feed cell without a cover, and a reference without a picture, are each a small board: green, with an inset brass hairline frame at 55%, the code or platform chalked in Cabin Sketch, and working text underneath.

### Add Button
The add button is a 58px oxblood circle with a 28px plus, floating 16px above the tab bar with the float shadow. On desktop it becomes a 46px, 4px-cornered button labelled in the rail.

### Sheets
Sheets are bottom drawers on paper with a brass top edge. They slide up over 300ms with cubic-bezier(0.32, 0.72, 0, 1). From 700px they become centred 6px dialogs that scale in from 0.97. Sheet titles use the serif headline style, and the post's code sits beside the title.

## Do's and Don'ts

### Do:
- **Do** head every screen with the green board in its 3px brass frame, and put the screen title on it in chalk.
- **Do** keep oxblood for what needs Oran. A screen with nothing for him has no oxblood.
- **Do** show status as the printed ring mark in its fixed cell beside the title.
- **Do** give every post its code (week-DAY-SERIES) wherever the post appears.
- **Do** pin notes with the rotating tilt and straighten them on hover, press and focus. Keep them straight under reduced motion.
- **Do** use 4px corners on controls and 6px on notes, cards and sheets.
- **Do** use Phosphor icons (regular, with fill or bold for active states).
- **Do** check every new surface in dark mode. The board stays green there.

### Don't:
- **Don't** put Cabin Sketch on paper. Chalk belongs on boards.
- **Don't** use oxblood for decoration, emphasis or branding accents.
- **Don't** fill surfaces with brass. Brass is line.
- **Don't** rank list items by size. Keep one size and rank by weight.
- **Don't** build screens as a cream page with a serif title over identical cards. That is the v1 look the founder rejected.
- **Don't** add pill-shaped status badges or large radii. The round add button is the only round shape.
