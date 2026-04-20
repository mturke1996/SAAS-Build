/**
 * Motion tokens — UI-only, 150–300ms. NEVER exceed for component motion.
 * Page reveals may use up to 400ms for the wrapper but stagger children
 * within the 150–300ms budget.
 */
export const motion = {
  duration: {
    instant: 0.08,  // 80ms
    fast: 0.15,     // 150ms — micro interactions
    base: 0.22,     // 220ms — buttons, hovers
    slow: 0.3,      // 300ms — panels, dialogs
    page: 0.4,      // 400ms — whole-view intros (use sparingly)
  },
  ease: {
    /** Default productivity ease (Material standard). */
    standard: [0.4, 0, 0.2, 1] as [number, number, number, number],
    /** Decelerate (enter). */
    out: [0, 0, 0.2, 1] as [number, number, number, number],
    /** Accelerate (exit). */
    in: [0.4, 0, 1, 1] as [number, number, number, number],
    /** Spring-ish snap for playful micro-interactions. */
    snap: [0.34, 1.2, 0.64, 1] as [number, number, number, number],
  },
  stagger: {
    tight: 0.04,    // 40ms between items
    base: 0.06,     // 60ms
    loose: 0.1,
  },
} as const;

export type MotionDuration = keyof typeof motion.duration;
export type MotionEase = keyof typeof motion.ease;
