# Process overview

Written by you, for a reader: how you got from the brief to the harness and
agentic workflow behind this submission. Markers read this file and follow its
citations; they don't trawl the repo for evidence you didn't point at.

This file is the shape; the course site's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
is the requirement, and its
[word counts](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#word-counts)
cover every deliverable.

## What I built

A course dashboard replacing the guestbook starter: one home page pulling
every enrolled course's assessments and lectures into a single due list and
calendar, plus a per-course page split by role — a mock "teacher mode" sets
assessments, students turn work in against them, read-only otherwise.

## How I got here

so i started by giving some ideas about what id like to change about the general layout and stucturing of canvas, because I feel like canvas is lacking some uniformality in terms of how specificly courses are set up. this differs between the coureses and is a little annoying to me right now.

The base dashboard (schema, seed data, home page, one shared course template
with an open add-assessment form) landed first:
[`40a2354`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-oldecker/commit/40a2354).
That form was a lecturer action on a page every visitor saw, with no
distinction between managing a course and taking one. Fixed in
[`ab80fac`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-oldecker/commit/ab80fac):
a mock `/teacher/` page carrying that form, the student page made read-only
for assessments, and a submissions table + API so students turn text or a
file in against a specific assessment.

Next round of feedback: "you can select a percentage from the beginning
[...] there should be a mini calender [...] mock lectures as well [...]
make it look more like the page for 4020 [...] generate some nice images."

[`7df9d12`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-oldecker/commit/7df9d12)
answers all but the last clause: weight now caps at "100% minus what this
course already totals"; a six-week calendar pulls every course's deadlines
into one grid; each course got a 12-week lecture schedule; and the page was
restyled around a riso-print palette from the real COMP4020 site. No
generated images — no `STRPROXY_KEY` here, and reusing the coding session's
own credential for that proxy was blocked as misuse, so the hero uses
CSS/SVG instead.

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
