/** Questionnaire navigation — keyboard-safe fixed step bar + focus scroll (all viewports). */

export function isMobileNav() {
  return true;
}

export function refreshQuestionnaireMobileNavLayout(stepNavEl) {
  if (!stepNavEl) return;
  const height = Math.ceil(stepNavEl.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--q-step-nav-height', `${height}px`);
}

function syncKeyboardInset() {
  const vv = window.visualViewport;
  if (!vv) {
    document.documentElement.style.setProperty('--keyboard-inset', '0px');
    return;
  }

  const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  document.documentElement.style.setProperty('--keyboard-inset', `${inset}px`);
  document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
}

export function scrollFieldIntoView(field, stepNavEl) {
  if (!field) return;

  const scrollParent = field.closest('.q-form');
  if (!scrollParent) return;

  const navHeight = stepNavEl?.getBoundingClientRect().height || 0;
  const padding = 12;
  const vv = window.visualViewport;
  const viewportTop = vv?.offsetTop ?? 0;
  const viewportHeight = vv?.height ?? window.innerHeight;
  const fieldRect = field.getBoundingClientRect();
  const safeTop = viewportTop + padding;
  const safeBottom = viewportTop + viewportHeight - navHeight - padding;

  if (fieldRect.top < safeTop) {
    scrollParent.scrollTop -= safeTop - fieldRect.top;
  } else if (fieldRect.bottom > safeBottom) {
    scrollParent.scrollTop += fieldRect.bottom - safeBottom;
  }
}

/**
 * @param {{ stepNavEl?: HTMLElement, formEl?: HTMLElement }} options
 * @returns {() => void} teardown
 */
export function initQuestionnaireMobileNav({ stepNavEl, formEl } = {}) {
  if (!stepNavEl || !formEl) return () => {};

  const onViewportChange = () => {
    syncKeyboardInset();
    refreshQuestionnaireMobileNavLayout(stepNavEl);
    const focused = formEl.querySelector('input:focus, textarea:focus, select:focus');
    if (focused instanceof HTMLElement) {
      scrollFieldIntoView(focused, stepNavEl);
    }
  };

  const onFocusIn = (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.matches('input, textarea, select')) return;

    document.body.classList.add('q-keyboard-open');
    requestAnimationFrame(() => {
      onViewportChange();
      scrollFieldIntoView(target, stepNavEl);
    });
  };

  const onFocusOut = (event) => {
    const related = event.relatedTarget;
    if (related instanceof HTMLElement && related.matches('input, textarea, select')) return;

    window.setTimeout(() => {
      if (formEl.querySelector('input:focus, textarea:focus, select:focus')) return;
      document.body.classList.remove('q-keyboard-open');
      syncKeyboardInset();
    }, 100);
  };

  refreshQuestionnaireMobileNavLayout(stepNavEl);
  syncKeyboardInset();

  const vv = window.visualViewport;
  vv?.addEventListener('resize', onViewportChange);
  vv?.addEventListener('scroll', onViewportChange);
  window.addEventListener('resize', onViewportChange);
  formEl.addEventListener('focusin', onFocusIn);
  formEl.addEventListener('focusout', onFocusOut);

  return () => {
    vv?.removeEventListener('resize', onViewportChange);
    vv?.removeEventListener('scroll', onViewportChange);
    window.removeEventListener('resize', onViewportChange);
    formEl.removeEventListener('focusin', onFocusIn);
    formEl.removeEventListener('focusout', onFocusOut);
    document.body.classList.remove('q-keyboard-open');
    document.documentElement.style.removeProperty('--q-step-nav-height');
    document.documentElement.style.removeProperty('--keyboard-inset');
    document.documentElement.style.removeProperty('--visual-viewport-height');
  };
}
