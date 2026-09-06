# Image-first builds with scroll-driven animation

Third walkthrough supplied by Angel, Sept 2026. The most complete of the three,
and the one that solves a problem the other two leave open: how to be inspired
by other sites without copying one.

## The originality step

The other two workflows point the build at an existing site. This one adds a
synthesis stage first:

1. Collect 4-6 screenshots of sites you like (Pinterest, Dribbble, Awwwards,
   collectui, mobbin).
2. Feed ALL of them to an image model at once, with a prompt naming the section
   and the business -- "design a hero for a premium architectural studio using
   these reference images for visual inspiration". 16:9.
3. The output is a blend of all six. It resembles none of them individually.
4. Save it as `reference/reference.png`.
5. Build THAT image in HTML/CSS.

The generated image becomes the single source of truth. The design is genuinely
new before any code exists, which is the difference between "inspired by" and
"copied".

## Build discipline

**Back up before every change.** Stated as a grounding rule at the start of the
session, not remembered later.

**Two phases.** Static page first, matched to the reference image. Animation
only once the page is right. Doing both at once burns tokens and leaves the page
wrong in two dimensions simultaneously.

**Headless-browser self-verification.** The agent screenshots its own build and
compares it against the reference image rather than assuming it matched.

**Reviewer sub-agent, hard-capped.** A reviewer with fresh eyes compares build
to reference and returns specifics. Stop on "pass" OR after N rounds (3-5).
Without the cap the reviewer always finds something and it never terminates.
Close is the goal; pixel-identical is not.

**Scope your corrections.** Name the two or three things that matter and say to
ignore everything else. Unbounded feedback wastes a round.

## The prompt-polishing trick

Write rough feedback in your own words, hand it to an AI to rewrite as a precise
prompt, then send the polished version to the building agent. The rewrite adds
the specificity a build agent needs -- exact location, exact colour, exact
element -- that rough feedback lacks.

Worth using whenever you can see the problem but cannot phrase it.

## Exploded views: the axis lesson

The default failure is parts **scattering** -- tumbling and fanning out in
arbitrary directions. It looks chaotic rather than engineered.

What reads as designed is each component travelling along **its own mounting
axis**: the direction that part would actually be removed in. A watch crystal
lifts straight up off the face; a wheel pulls straight out sideways.

Note the trap: asking for everything to move along "the same axis" is also
wrong, and produces a flat sliding motion. The correct instruction is *each
part along its own axis*.

## Cost control

**Iterate at 480p, encode once at 1080p.** Animations need many rounds. Doing
every round at full resolution multiplies the spend for no benefit, since what
is being judged is timing and direction, not fidelity.

**Loading animation.** A short loader lets heavy assets preload so the first
scroll is smooth rather than stuttering.

**Effort setting.** Higher effort means more research and more self-checking.
Match it to task complexity rather than defaulting low.

## Mobile

These pages are desktop-first by nature. Shrink the animation for mobile so it
fits the viewport rather than trying to preserve the desktop composition.
