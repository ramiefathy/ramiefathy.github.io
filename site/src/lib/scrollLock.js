/**
 * Reference-counted body-scroll lock.
 *
 * Header's mobile drawer and CommandPalette can each want the page pinned in
 * place. If both track their own "previous overflow" independently, closing
 * one while the other is still open can restore the wrong value and strand
 * the page locked. A shared counter means the lock only lifts once every
 * consumer has released it.
 */

let lockCount = 0;
let previousOverflow = '';

export function lockScroll() {
  if (lockCount === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

export function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = previousOverflow;
  }
}
