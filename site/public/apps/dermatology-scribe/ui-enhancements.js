// UI Enhancements Module for AI Dermatology Scribe

const safeParseJson = (rawValue, fallbackValue) => {
  if (!rawValue) return fallbackValue
  try {
    return JSON.parse(rawValue)
  } catch (error) {
    console.warn('Failed to parse stored JSON payload, using fallback.', error)
    return fallbackValue
  }
}

// ========== Theme Manager ==========
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('dermascribe.theme') || 'auto';
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.init();
  }

  init() {
    // Create theme toggle button
    this.createThemeToggle();

    // Apply initial theme
    if (this.theme === 'auto') {
      this.applySystemTheme();
      this.mediaQuery.addEventListener('change', () => this.applySystemTheme());
    } else {
      this.applyTheme(this.theme);
    }
  }

  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.innerHTML = `<span class="material-symbols-outlined">${this.getThemeIcon()}</span>`;

    toggle.addEventListener('click', () => this.cycleTheme());
    document.body.appendChild(toggle);

    this.toggleButton = toggle;
  }

  getThemeIcon() {
    const currentTheme = this.getCurrentTheme();
    return currentTheme === 'dark' ? 'dark_mode' : currentTheme === 'light' ? 'light_mode' : 'contrast';
  }

  getCurrentTheme() {
    if (this.theme === 'auto') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return this.theme;
  }

  cycleTheme() {
    const themes = ['light', 'dark', 'auto'];
    const currentIndex = themes.indexOf(this.theme);
    this.theme = themes[(currentIndex + 1) % themes.length];

    localStorage.setItem('dermascribe.theme', this.theme);

    if (this.theme === 'auto') {
      this.applySystemTheme();
    } else {
      this.applyTheme(this.theme);
    }

    // Update icon
    this.toggleButton.querySelector('.material-symbols-outlined').textContent = this.getThemeIcon();

    // Show notification
    this.showThemeNotification(this.theme);
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff');
    }
  }

  applySystemTheme() {
    const systemTheme = this.mediaQuery.matches ? 'dark' : 'light';
    this.applyTheme(systemTheme);
  }

  showThemeNotification(theme) {
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 20px;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideIn 300ms ease;
    `;
    notification.textContent = `Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }
}

// ========== Focus Mode Manager ==========
class FocusMode {
  constructor() {
    this.isActive = false;
    this.previousState = null;
  }

  toggle() {
    if (this.isActive) {
      this.exit();
    } else {
      this.enter();
    }
  }

  enter() {
    this.isActive = true;
    document.body.classList.add('focus-mode');

    // Store previous state
    this.previousState = {
      scrollPosition: window.scrollY
    };

    // Create focus mode controls
    this.createControls();

    // Announce to screen readers
    this.announce('Focus mode activated');
  }

  exit() {
    this.isActive = false;
    document.body.classList.remove('focus-mode');

    // Remove controls
    const controls = document.querySelector('.focus-mode-controls');
    if (controls) controls.remove();

    // Restore previous state
    if (this.previousState) {
      window.scrollTo(0, this.previousState.scrollPosition);
    }

    // Announce to screen readers
    this.announce('Focus mode deactivated');
  }

  createControls() {
    const controls = document.createElement('div');
    controls.className = 'focus-mode-controls';
    const exitButton = document.createElement('button');
    exitButton.type = 'button';
    exitButton.setAttribute('aria-label', 'Exit focus mode');
    exitButton.innerHTML = `
      <span class="material-symbols-outlined">close_fullscreen</span> Exit Focus
    `;
    exitButton.addEventListener('click', () => this.exit());

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.setAttribute('aria-label', 'Save session');
    saveButton.innerHTML = `
      <span class="material-symbols-outlined">save</span> Save
    `;
    saveButton.addEventListener('click', () => {
      // Prefer the header save button if present, otherwise fall back to the global save shortcut.
      document.getElementById('saveSessionBtn')?.click();
    });

    controls.appendChild(exitButton);
    controls.appendChild(saveButton);
    document.body.appendChild(controls);
  }

  announce(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }
}

// ========== Quick Actions Bar ==========
class QuickActionsBar {
  constructor() {
    this.actions = [
      { id: 'capture-image', icon: 'photo_camera', title: 'Capture Image', shortcut: 'Ctrl+I' },
      { id: 'add-diagnosis', icon: 'add_circle', title: 'Add Diagnosis', shortcut: 'Ctrl+D' },
      { id: 'order-labs', icon: 'science', title: 'Order Labs', shortcut: 'Ctrl+L' },
      { id: 'prescribe', icon: 'medication', title: 'Prescribe', shortcut: 'Ctrl+P' },
      { id: 'schedule-followup', icon: 'event', title: 'Schedule Follow-up', shortcut: 'Ctrl+F' },
      { id: 'toggle-focus', icon: 'fullscreen', title: 'Focus Mode', shortcut: 'Ctrl+Shift+F' }
    ];

    this.createBar();
    this.setupKeyboardShortcuts();
    this.setupContextAwareness();
  }

  createBar() {
    const bar = document.createElement('div');
    bar.className = 'quick-actions-bar';
    bar.id = 'quickActionsBar';

    const container = document.createElement('div');
    container.className = 'quick-actions-container';

    // Add action buttons
    this.actions.forEach((action, index) => {
      if (index === 5) {
        // Add separator before focus mode
        const separator = document.createElement('div');
        separator.className = 'qa-separator';
        container.appendChild(separator);
      }

      const btn = document.createElement('button');
      btn.className = 'qa-btn';
      btn.setAttribute('data-action', action.id);
      btn.setAttribute('title', `${action.title} (${action.shortcut})`);
      btn.setAttribute('aria-label', action.title);
      btn.innerHTML = `<span class="material-symbols-outlined">${action.icon}</span>`;

      btn.addEventListener('click', () => this.handleAction(action.id));
      container.appendChild(btn);
    });

    bar.appendChild(container);

    // Make draggable
    this.makeDraggable(bar);

    document.body.appendChild(bar);
    this.bar = bar;
  }

  makeDraggable(element) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    element.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      if (e.target.closest('.qa-btn')) return; // Don't drag when clicking buttons

      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === element || e.target.closest('.quick-actions-container')) {
        isDragging = true;
        element.classList.add('dragging');
      }
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        element.style.transform = `translate(${currentX}px, ${currentY}px)`;
        element.style.left = 'auto';
        element.style.bottom = 'auto';
      }
    }

    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      element.classList.remove('dragging');
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
          case 'i':
            e.preventDefault();
            this.handleAction('capture-image');
            break;
          case 'd':
            e.preventDefault();
            this.handleAction('add-diagnosis');
            break;
          case 'l':
            e.preventDefault();
            this.handleAction('order-labs');
            break;
          case 'p':
            e.preventDefault();
            this.handleAction('prescribe');
            break;
          case 'f':
            if (e.shiftKey) {
              e.preventDefault();
              this.handleAction('toggle-focus');
            } else {
              e.preventDefault();
              this.handleAction('schedule-followup');
            }
            break;
        }
      }
    });
  }

  setupContextAwareness() {
    // Update button states based on context
    setInterval(() => {
      const isRecording = document.querySelector('#recordingStatus')?.textContent.includes('Recording');
      const hasNotes = (document.querySelector('#aiNotesOutput')?.textContent.length || 0) > 100;

      // Update button states
      const captureBtn = this.bar.querySelector('[data-action="capture-image"]');
      const prescribeBtn = this.bar.querySelector('[data-action="prescribe"]');

      if (captureBtn) captureBtn.disabled = !isRecording;
      if (prescribeBtn) prescribeBtn.disabled = !hasNotes;
    }, 1000);
  }

  handleAction(actionId) {
    switch(actionId) {
      case 'capture-image':
        document.getElementById('uploadImageBtn')?.click();
        break;
      case 'add-diagnosis':
        this.showDiagnosisDialog();
        break;
      case 'order-labs':
        this.showLabOrderDialog();
        break;
      case 'prescribe':
        this.showPrescriptionDialog();
        break;
      case 'schedule-followup':
        this.showSchedulingDialog();
        break;
      case 'toggle-focus':
        if (!window.focusMode) window.focusMode = new FocusMode();
        window.focusMode.toggle();
        break;
    }
  }

  showDiagnosisDialog() {
    // Placeholder for diagnosis dialog
    const diagnosis = prompt('Enter diagnosis:');
    if (diagnosis) {
      console.log('Adding diagnosis:', diagnosis);
      // Integrate with main app
    }
  }

  showLabOrderDialog() {
    console.log('Lab order dialog would open here');
  }

  showPrescriptionDialog() {
    console.log('Prescription dialog would open here');
  }

  showSchedulingDialog() {
    console.log('Scheduling dialog would open here');
  }
}

// ========== Command Palette ==========
class CommandPalette {
  constructor() {
    this.commands = [
      { text: 'Start Recording', action: 'startRecording', icon: '🎙️', shortcut: 'Alt+R' },
      { text: 'Stop Recording', action: 'stopRecording', icon: '⏹️', shortcut: 'Alt+S' },
      { text: 'View Notes', action: 'viewNotes', icon: '📝', shortcut: 'Alt+N' },
      { text: 'View Transcription', action: 'viewTranscription', icon: '📋', shortcut: 'Alt+T' },
      { text: 'Patient History', action: 'patientHistory', icon: '📚' },
      { text: 'Add Diagnosis', action: 'addDiagnosis', icon: '🔍' },
      { text: 'Order Labs', action: 'orderLabs', icon: '🧪' },
      { text: 'Toggle Theme', action: 'toggleTheme', icon: '🎨' },
      { text: 'Focus Mode', action: 'focusMode', icon: '🎯' },
      { text: 'Help', action: 'showHelp', icon: '❓' }
    ];

    this.setupKeyboardShortcut();
  }

  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    const existing = document.querySelector('.command-palette-overlay');
    if (existing) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'command-palette-overlay';
    overlay.addEventListener('click', () => this.close());

    // Create palette
    const palette = document.createElement('div');
    palette.className = 'command-palette';
    palette.addEventListener('click', (e) => e.stopPropagation());

    palette.innerHTML = `
      <input type="text"
             id="command-input"
             placeholder="Type to search commands..."
             autocomplete="off"
             aria-label="Command search">
      <div id="command-suggestions"></div>
    `;

    overlay.appendChild(palette);
    document.body.appendChild(overlay);

    // Focus input
    const input = document.getElementById('command-input');
    input.focus();

    // Setup event listeners
    input.addEventListener('input', (e) => this.updateSuggestions(e.target.value));
    input.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Show all commands initially
    this.updateSuggestions('');

    this.currentIndex = 0;
  }

  close() {
    const overlay = document.querySelector('.command-palette-overlay');
    if (overlay) overlay.remove();
  }

  updateSuggestions(query) {
    const container = document.getElementById('command-suggestions');
    if (!container) return;

    let filtered = this.commands;

    if (query) {
      // Simple fuzzy search
      filtered = this.commands.filter(cmd =>
        cmd.text.toLowerCase().includes(query.toLowerCase()) ||
        cmd.action.toLowerCase().includes(query.toLowerCase())
      );
    }

    container.innerHTML = filtered.map((cmd, index) => `
      <div class="command-suggestion ${index === 0 ? 'selected' : ''}"
           data-action="${cmd.action}"
           data-index="${index}">
        <span class="icon">${cmd.icon}</span>
        <span class="text">${cmd.text}</span>
        ${cmd.shortcut ? `<span class="shortcut">${cmd.shortcut}</span>` : ''}
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.command-suggestion').forEach(el => {
      el.addEventListener('click', () => {
        this.executeCommand(el.dataset.action);
        this.close();
      });

      el.addEventListener('mouseenter', () => {
        container.querySelectorAll('.command-suggestion').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
        this.currentIndex = parseInt(el.dataset.index);
      });
    });

    this.currentIndex = 0;
  }

  handleKeydown(e) {
    const suggestions = document.querySelectorAll('.command-suggestion');

    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.currentIndex = Math.min(this.currentIndex + 1, suggestions.length - 1);
        this.updateSelection();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.currentIndex = Math.max(this.currentIndex - 1, 0);
        this.updateSelection();
        break;

      case 'Enter':
        e.preventDefault();
        const selected = suggestions[this.currentIndex];
        if (selected) {
          this.executeCommand(selected.dataset.action);
          this.close();
        }
        break;

      case 'Escape':
        e.preventDefault();
        this.close();
        break;
    }
  }

  updateSelection() {
    const suggestions = document.querySelectorAll('.command-suggestion');
    suggestions.forEach((el, index) => {
      el.classList.toggle('selected', index === this.currentIndex);
    });

    // Scroll into view if needed
    suggestions[this.currentIndex]?.scrollIntoView({ block: 'nearest' });
  }

  executeCommand(action) {
    switch(action) {
      case 'startRecording':
        document.getElementById('startButton')?.click();
        break;
      case 'stopRecording':
        document.getElementById('stopButton')?.click();
        break;
      case 'viewNotes':
        window.switchTab('right', 'draftedNote');
        break;
      case 'viewTranscription':
        window.switchTab('left', 'liveTranscription');
        break;
      case 'addDiagnosis':
        if (window.quickActionsBar) window.quickActionsBar.showDiagnosisDialog();
        break;
      case 'orderLabs':
        if (window.quickActionsBar) window.quickActionsBar.showLabOrderDialog();
        break;
      case 'toggleTheme':
        if (window.themeManager) window.themeManager.cycleTheme();
        break;
      case 'focusMode':
        if (!window.focusMode) window.focusMode = new FocusMode();
        window.focusMode.toggle();
        break;
      case 'showHelp':
        this.showHelp();
        break;
      default:
        console.log('Unknown command:', action);
    }
  }

  showHelp() {
    alert('Keyboard Shortcuts:\n\n' +
          'Ctrl/Cmd + K: Open command palette\n' +
          'Alt + R: Start recording\n' +
          'Alt + S: Stop recording\n' +
          'Alt + N: View notes\n' +
          'Alt + T: View transcription\n' +
          'Ctrl + I: Capture image\n' +
          'Ctrl + D: Add diagnosis\n' +
          'Ctrl + L: Order labs\n' +
          'Ctrl + P: Prescribe\n' +
          'Ctrl + F: Schedule follow-up\n' +
          'Ctrl + Shift + F: Focus mode');
  }
}

// ========== Accessibility Manager ==========
class AccessibilityManager {
  constructor() {
    this.setupSkipLinks();
    this.setupKeyboardNavigation();
    this.setupAriaLabels();
    this.setupLiveRegions();
    this.setupHighContrast();
  }

  setupSkipLinks() {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links-container';
    skipLinks.innerHTML = `
      <a href="#transcriptionOutput" class="skip-links">Skip to transcription</a>
      <a href="#aiNotesOutput" class="skip-links">Skip to notes</a>
      <a href="#startButton" class="skip-links">Skip to controls</a>
    `;
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  setupKeyboardNavigation() {
    // Add keyboard navigation for tabs
    document.addEventListener('keydown', (e) => {
      if (e.altKey) {
        switch(e.key) {
          case '1':
            this.focusPanel('transcriptionOutput');
            break;
          case '2':
            this.focusPanel('aiNotesOutput');
            break;
          case '3':
            this.focusPanel('realtimeSuggestionsOutput');
            break;
          case '4':
            this.focusPanel('aiAnalysisContentOutput');
            break;
        }
      }
    });

    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.setAttribute('role', 'tab');
      button.setAttribute('tabindex', '0');

      button.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const tabs = Array.from(button.parentElement.children);
          const currentIndex = tabs.indexOf(button);
          const nextIndex = e.key === 'ArrowRight'
            ? (currentIndex + 1) % tabs.length
            : (currentIndex - 1 + tabs.length) % tabs.length;
          tabs[nextIndex].focus();
          tabs[nextIndex].click();
        }
      });
    });
  }

  setupAriaLabels() {
    const elements = {
      '#startButton': 'Start recording patient encounter',
      '#pauseButton': 'Pause recording',
      '#stopButton': 'Stop and finalize recording',
      '#saveButton': 'Save session',
      '#transcriptionOutput': 'Live transcription area',
      '#aiNotesOutput': 'AI-generated clinical note',
      '#realtimeSuggestionsOutput': 'Real-time AI suggestions',
      '#discussionChatOutput': 'Discussion and feedback area',
      '#uploadImageBtn': 'Upload clinical image for analysis'
    };

    Object.entries(elements).forEach(([selector, label]) => {
      const el = document.querySelector(selector);
      if (el && !el.getAttribute('aria-label')) {
        el.setAttribute('aria-label', label);
      }
    });

    // Add roles
    document.querySelector('#transcriptionOutput')?.setAttribute('role', 'log');
    document.querySelector('#aiNotesOutput')?.setAttribute('role', 'article');
    document.querySelector('#discussionChatOutput')?.setAttribute('role', 'log');
  }

  setupLiveRegions() {
    // Add aria-live regions for dynamic content
    const liveRegions = [
      '#transcriptionOutput',
      '#realtimeSuggestionsOutput',
      '#recordingStatus',
      '#recordingDuration'
    ];

    liveRegions.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'false');
      }
    });

    // Recording status should be assertive
    const recordingStatus = document.querySelector('#recordingStatus');
    if (recordingStatus) {
      recordingStatus.setAttribute('aria-live', 'assertive');
    }
  }

  setupHighContrast() {
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');

    if (highContrastQuery.matches) {
      document.documentElement.setAttribute('data-theme', 'high-contrast');
    }

    highContrastQuery.addEventListener('change', (e) => {
      if (e.matches) {
        document.documentElement.setAttribute('data-theme', 'high-contrast');
      }
    });
  }

  focusPanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.focus();
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Announce to screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('role', 'status');
      announcement.setAttribute('aria-live', 'polite');
      announcement.className = 'sr-only';
      announcement.textContent = `Focused on ${panelId.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
      document.body.appendChild(announcement);
      setTimeout(() => announcement.remove(), 1000);
    }
  }
}

// ========== Layout Manager ==========
class LayoutManager {
  constructor() {
    this.layouts = this.loadLayouts();
    this.currentLayout = localStorage.getItem('dermascribe.currentLayout') || 'default';
    this.setupLayoutSwitcher();
  }

  loadLayouts() {
    const defaultLayouts = {
      default: {
        name: 'Default',
        left: ['transcription', 'analysis'],
        right: ['suggestions', 'notes']
      },
      focus: {
        name: 'Focus',
        center: ['notes'],
        minimized: ['transcription', 'suggestions']
      },
      review: {
        name: 'Review',
        left: ['notes'],
        right: ['analysis', 'suggestions']
      },
      compact: {
        name: 'Compact',
        stacked: ['transcription', 'notes', 'analysis', 'suggestions']
      }
    };

    // Load custom layouts from localStorage
    const customLayouts = safeParseJson(localStorage.getItem('dermascribe.customLayouts'), {});

    return { ...defaultLayouts, ...customLayouts };
  }

  setupLayoutSwitcher() {
    // Add layout switcher to header
    const header = document.querySelector('header .container');
    if (header) {
      const switcher = document.createElement('select');
      switcher.className = 'layout-switcher';
      switcher.style.cssText = 'margin-left: auto; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-primary); padding: 4px 8px; border-radius: 4px;';

      Object.entries(this.layouts).forEach(([key, layout]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = layout.name;
        option.selected = key === this.currentLayout;
        switcher.appendChild(option);
      });

      switcher.addEventListener('change', (e) => this.switchLayout(e.target.value));
      header.appendChild(switcher);
    }
  }

  switchLayout(layoutName) {
    const layout = this.layouts[layoutName];
    if (!layout) return;

    this.currentLayout = layoutName;
    localStorage.setItem('dermascribe.currentLayout', layoutName);

    // Apply layout changes
    // This would need to integrate with the existing panel system
    console.log('Switching to layout:', layout);

    // Show notification
    this.showLayoutNotification(layout.name);
  }

  showLayoutNotification(layoutName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: var(--bg-primary);
      color: var(--text-primary);
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      animation: slideIn 300ms ease;
    `;
    notification.textContent = `Layout: ${layoutName}`;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }

  saveCustomLayout(name, configuration) {
    const customLayouts = safeParseJson(localStorage.getItem('dermascribe.customLayouts'), {});
    customLayouts[name] = { name, ...configuration };
    localStorage.setItem('dermascribe.customLayouts', JSON.stringify(customLayouts));

    this.layouts = this.loadLayouts();
    this.setupLayoutSwitcher();
  }
}

// ========== Initialize UI Enhancements ==========
function initializeUIEnhancements() {
  // Check if enhancements are already initialized
  if (window.uiEnhancementsInitialized) return;

  console.log('Initializing UI Enhancements...');

  // Initialize managers
  window.themeManager = new ThemeManager();
  window.quickActionsBar = new QuickActionsBar();
  window.accessibilityManager = new AccessibilityManager();
  window.layoutManager = new LayoutManager();
  window.focusMode = new FocusMode();

  // Mark as initialized
  window.uiEnhancementsInitialized = true;

  console.log('UI Enhancements initialized successfully');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUIEnhancements);
} else {
  // DOM is already loaded
  initializeUIEnhancements();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ThemeManager,
    FocusMode,
    QuickActionsBar,
    CommandPalette,
    AccessibilityManager,
    LayoutManager
  };
}
