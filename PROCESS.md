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

A course dashboard replacing the guestbook starter: one home page that pulls
every enrolled course's due assessments and lectures into a single list and a
calendar, plus a per-course page (Overview / This week / Assessments /
Lectures / Readings & materials). Assessments are split by role — a mock,
unauthenticated "teacher mode" sets them up, students turn work in against
them — instead of one page that was write-access for everyone.

## How I got here

so i started by giving some ideas about what id like to change about the general layout and stucturing of canvas, because I feel like canvas is lacking some uniformality in terms of how specificly courses are set up. this differs between the coureses and is a little annoying to me right now.

That idea became the home page's calendar and due list: every course's
deadlines gathered in one place instead of three differently-organised course
pages, which is the line the dashboard's own hero copy still uses. The base
dashboard — courses/assessments/resources schema, seeded with three demo
courses, the home page, and one shared course template with an add-assessment
form open to anyone — landed first:
[`40a2354`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-oldecker/commit/40a2354).

Looking at that first draft raised the obvious problem: the add-assessment
form was a lecturer action sitting on the page every visitor saw, with no
distinction between managing a course and taking one. Fix, in short: a
"Teacher mode" link to a mock staff page carrying the add-assessment form,
the regular course page made read-only for assessments, and students able to
turn work in — text and/or a file — against a specific assessment instead of
into an unstructured upload area:

[`ab80fac`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-oldecker/commit/ab80fac)
— new `submissions` table, `CourseBody.astro` extracted so the student and
teacher pages render through one shared template and can't drift apart, a
submissions API route plus file-download route, and the course page split
into `/courses/CODE/` and `/courses/CODE/teacher/`.

That still left the parts that didn't hold up under a second look:

> it doesnt make any sense that you can select a percentage in the teacher
> session from the beginning when you setup the assignment. there should be a
> mini calender for all sorts of assignments and exams coming up. also the
> courses should have some mock lectures as well. the individual mock
> assignemnts should contain some more detailed information about what should
> be done. make the whole page look more like the page for 4020 that you know
> also from the last crit. that looked pretty cool. you can also generate some
> nice images

[`7df9d12`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-oldecker/commit/7df9d12)
answers all but the last clause: assessments now carry a `kind`
(assignment/exam) and a `description` of what's actually required; the
weight field's ceiling is "100% minus what this course's assessments already
total" instead of a flat 0-100% range, checked both in the form and in the
API route so a course can't be typed past 100% one assessment at a time; the
home page gained a six-week Mon-Sun calendar (`WeekCalendar.astro`) pulling
every course's due assessments into one grid; each course got a full 12-week
mock lecture schedule split out from its other resources; and the whole page
was restyled around a riso-print palette (paper/teal/gold/copper) modelled on
the real COMP4020 course site, via the `frontend-design` skill.

The one clause that isn't real generated imagery: this environment has no
`STRPROXY_KEY` set for the image proxy, and reusing the Claude Code session's
own credential for it is exactly the kind of thing the harness's own
permission model is there to stop, so I didn't route around it. The hero band
uses a halftone CSS background and a hand-built SVG "registration mark"
instead of a photo — a deliberate substitution, not a silent downgrade, and
one I'd swap for a real generated image given a key.

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
