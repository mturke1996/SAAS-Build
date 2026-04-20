import gsap from 'gsap';
import { motion } from '../../design-system/tokens/motion';

/**
 * ============================================================================
 *  GSAP MOTION PRESETS — aligned with GSAP official skills
 * ============================================================================
 *  UI motion stays within the 150–300ms budget (UI/UX Pro Max rule).
 *  Page intros may go 400ms on the wrapper but stagger children within budget.
 *
 *  Every preset:
 *   - respects prefers-reduced-motion (checked at callsite via useReveal)
 *   - uses `autoAlpha` (combined opacity + visibility) where possible
 *   - calls `clearProps: 'transform'` on completion to avoid GPU layers
 *     persisting and blocking subsequent CSS transitions
 *   - prefers transforms over layout props (per GSAP performance skill)
 * ============================================================================
 */

/** Fast opacity + Y intro. 220ms. */
export function fadeInUp(target: gsap.TweenTarget, delay = 0, distance = 10) {
  return gsap.fromTo(
    target,
    { autoAlpha: 0, y: distance },
    {
      autoAlpha: 1,
      y: 0,
      duration: motion.duration.base,
      ease: 'power2.out',
      delay,
      clearProps: 'transform',
    }
  );
}

/** Soft scale-in for modals/popovers. 220ms. */
export function scaleIn(target: gsap.TweenTarget, delay = 0) {
  return gsap.fromTo(
    target,
    { autoAlpha: 0, scale: 0.96 },
    {
      autoAlpha: 1,
      scale: 1,
      duration: motion.duration.base,
      ease: 'power2.out',
      delay,
      clearProps: 'transform',
    }
  );
}

/** Horizontal slide — respects RTL by flipping the axis. */
export function slideIn(
  target: gsap.TweenTarget,
  { dir = 'right', delay = 0, distance = 12 }: { dir?: 'left' | 'right'; delay?: number; distance?: number } = {}
) {
  const rtl = typeof document !== 'undefined' && document.documentElement.getAttribute('dir') === 'rtl';
  const effectiveDir = rtl ? (dir === 'left' ? 'right' : 'left') : dir;
  const from = effectiveDir === 'right' ? distance : -distance;
  return gsap.fromTo(
    target,
    { autoAlpha: 0, x: from },
    { autoAlpha: 1, x: 0, duration: motion.duration.base, ease: 'power2.out', delay, clearProps: 'transform' }
  );
}

/** Stagger direct children. Each child within the 150–300ms budget. */
export function staggerChildren(
  parent: Element | null,
  childSelector: string = '[data-reveal]',
  opts: { duration?: number; stagger?: number; delay?: number } = {}
) {
  if (!parent) return null;
  const { duration = motion.duration.base, stagger = motion.stagger.base, delay = 0 } = opts;
  const children = parent.querySelectorAll(childSelector);
  if (!children.length) return null;
  return gsap.fromTo(
    children,
    { autoAlpha: 0, y: 8 },
    {
      autoAlpha: 1,
      y: 0,
      duration,
      ease: 'power2.out',
      stagger,
      delay,
      clearProps: 'transform',
    }
  );
}

/** Page-wrapper intro. 400ms outer wrapper + staggered children inside budget. */
export function pageIntro(wrapper: Element | null, itemSelector: string = '[data-reveal]') {
  if (!wrapper) return null;
  const tl = gsap.timeline();
  tl.fromTo(
    wrapper,
    { autoAlpha: 0 },
    { autoAlpha: 1, duration: motion.duration.page, ease: 'power2.out' }
  );
  tl.add(() => staggerChildren(wrapper, itemSelector), '-=0.2');
  return tl;
}

/** Pressable micro-interaction: quick scale-down + snap. */
export function press(target: gsap.TweenTarget) {
  return gsap.to(target, {
    scale: 0.97,
    duration: motion.duration.fast,
    ease: 'power2.out',
    yoyo: true,
    repeat: 1,
  });
}

/** Soft hover lift. */
export function hoverLift(target: gsap.TweenTarget, up = true) {
  return gsap.to(target, {
    y: up ? -2 : 0,
    duration: motion.duration.fast,
    ease: 'power2.out',
  });
}

/**
 * Animated number counter — tween a numeric element from 0 to target value.
 * Used for KPI tiles on the dashboard. Keeps the element's own formatting.
 */
export function countUp(
  el: HTMLElement | null,
  to: number,
  { duration = 0.9, format = (n: number) => String(Math.round(n)) }: { duration?: number; format?: (n: number) => string } = {}
) {
  if (!el) return null;
  const state = { val: 0 };
  return gsap.to(state, {
    val: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = format(state.val);
    },
  });
}

/** Brand-tinted pulse — great for "you have notifications" affordances. */
export function pulseRing(target: gsap.TweenTarget) {
  return gsap.fromTo(
    target,
    { boxShadow: '0 0 0 0 rgba(var(--brand-primary-rgb) / 0.4)' },
    {
      boxShadow: '0 0 0 12px rgba(var(--brand-primary-rgb) / 0)',
      duration: 1.4,
      ease: 'power2.out',
      repeat: -1,
    }
  );
}
