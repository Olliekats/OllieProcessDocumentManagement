export const keyboardNavigation = {
  init: () => {
    document.addEventListener('keydown', handleGlobalKeyboard);
  },

  destroy: () => {
    document.removeEventListener('keydown', handleGlobalKeyboard);
  }
};

const handleGlobalKeyboard = (e: KeyboardEvent) => {
  if (e.altKey || e.metaKey || e.ctrlKey) {
    switch (e.key.toLowerCase()) {
      case 'h':
        e.preventDefault();
        navigateToModule('dashboard');
        break;
      case 'n':
        e.preventDefault();
        document.querySelector<HTMLElement>('[aria-label="Notifications"]')?.click();
        break;
      case 's':
        e.preventDefault();
        navigateToModule('settings');
        break;
      case '/':
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
        break;
      case '?':
        e.preventDefault();
        showKeyboardShortcutsModal();
        break;
    }
  }

  if (e.key === 'Escape') {
    closeModals();
    clearFocus();
  }

  if (e.key === 'Tab') {
    ensureFocusVisible();
  }
};

const navigateToModule = (moduleId: string) => {
  const button = document.querySelector<HTMLButtonElement>(
    `[data-module-id="${moduleId}"]`
  );
  button?.click();
};

const closeModals = () => {
  const modals = document.querySelectorAll('[role="dialog"]');
  modals.forEach(modal => {
    const closeButton = modal.querySelector<HTMLElement>('[aria-label="Close"]');
    closeButton?.click();
  });
};

const clearFocus = () => {
  (document.activeElement as HTMLElement)?.blur();
};

const ensureFocusVisible = () => {
  document.body.classList.add('keyboard-navigating');
};

const showKeyboardShortcutsModal = () => {
  const shortcuts = [
    { keys: 'Alt + H', action: 'Go to Dashboard' },
    { keys: 'Alt + N', action: 'Open Notifications' },
    { keys: 'Alt + S', action: 'Open Settings' },
    { keys: 'Alt + /', action: 'Focus Search' },
    { keys: 'Alt + ?', action: 'Show this help' },
    { keys: 'Tab', action: 'Navigate forward' },
    { keys: 'Shift + Tab', action: 'Navigate backward' },
    { keys: 'Enter', action: 'Activate focused element' },
    { keys: 'Escape', action: 'Close dialogs/clear focus' },
    { keys: 'Arrow Keys', action: 'Navigate lists' }
  ];

  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-label', 'Keyboard Shortcuts');
  modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-slate-800">Keyboard Shortcuts</h2>
        <button
          class="p-2 hover:bg-slate-100 rounded-lg"
          aria-label="Close"
          onclick="this.closest('[role=dialog]').remove()"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/>
          </svg>
        </button>
      </div>
      <div class="grid grid-cols-2 gap-4">
        ${shortcuts.map(s => `
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <span class="text-sm text-slate-600">${s.action}</span>
            <kbd class="px-3 py-1 bg-white border border-slate-300 rounded text-sm font-mono text-slate-700">${s.keys}</kbd>
          </div>
        `).join('')}
      </div>
      <p class="text-sm text-slate-500 mt-4">
        Press <kbd class="px-2 py-1 bg-slate-100 rounded text-xs">Esc</kbd> to close this dialog
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  modal.querySelector('button')?.focus();
};

export const addAriaLabels = (element: HTMLElement, label: string, describedBy?: string) => {
  element.setAttribute('aria-label', label);
  if (describedBy) {
    element.setAttribute('aria-describedby', describedBy);
  }
};

export const makeFocusable = (element: HTMLElement, tabIndex: number = 0) => {
  element.setAttribute('tabindex', String(tabIndex));
};

export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcer = document.getElementById('screen-reader-announcer');
  if (announcer) {
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }
};
