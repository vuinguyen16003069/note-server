document.addEventListener('DOMContentLoaded', () => {
  const $ = (id) => document.getElementById(id);

  const homeView = $('homeView');
  const editorView = $('editorView');
  const editor = $('editor');
  const lineNumbers = $('lineNumbers');
  const themeToggle = $('themeToggle');
  const themeText = $('theme-text');
  const themeIcon = $('theme-icon');
  const statusIndicator = $('statusIndicator');
  const statusText = $('statusText');
  const cursorPosition = $('cursorPosition');
  const wordCount = $('wordCount');
  const charCount = $('charCount');
  const readingTime = $('readingTime');
  const editorLoading = $('editorLoading');
  const connectionDot = document.querySelector('.connection-dot');
  const connectionText = $('connectionText');
  const html = document.documentElement;

  const path = window.location.pathname;
  const isNote = path.startsWith('/note/');

  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const savedTheme = localStorage.getItem('theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  if (path === '/note' || path === '/note/') {
    createNewNote();
  } else if (isNote) {
    showEditor();
  } else {
    showHome();
  }

  function createNewNote() {
    const id = generateUUID();
    window.history.pushState({}, '', `/note/${id}`);
    showEditor();
  }

  function showEditor() {
    homeView.classList.add('hidden');
    editorView.style.display = 'flex';
    initEditor();
  }

  function showHome() {
    homeView.classList.remove('hidden');
    editorView.style.display = 'none';
  }

  $('createNoteBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    createNewNote();
  });

  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
  });

  function updateThemeUI(theme) {
    if (theme === 'light') {
      themeText.textContent = 'Dark Mode';
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      themeText.textContent = 'Light Mode';
      themeIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
  }

  window.addEventListener('online', () => {
    if (connectionDot) connectionDot.classList.remove('offline');
    if (connectionText) connectionText.textContent = 'Cloud Sync Active';
  });

  window.addEventListener('offline', () => {
    if (connectionDot) connectionDot.classList.add('offline');
    if (connectionText) connectionText.textContent = 'Offline';
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault();
      createNewNote();
    }
  });

  function initEditor() {
    let lastLineCount = 0;
    let saveRetryCount = 0;
    const MAX_RETRIES = 3;

    const updateEditorUI = () => {
      const text = editor.value;
      const lines = text.split('\n');
      const currentLineCount = lines.length;
      const selectionStart = editor.selectionStart;
      const linesBeforeCursor = text.substring(0, selectionStart).split('\n');
      const currentLineIndex = linesBeforeCursor.length;

      if (currentLineCount !== lastLineCount) {
        const fragment = document.createDocumentFragment();
        for (let i = 1; i <= currentLineCount; i++) {
          const div = document.createElement('div');
          div.className = 'line-number';
          div.textContent = i;
          fragment.appendChild(div);
        }
        lineNumbers.replaceChildren(fragment);
        lastLineCount = currentLineCount;
      }

      const numbers = lineNumbers.querySelectorAll('.line-number');
      let index = 1;
      for (const n of numbers) {
        if (index === currentLineIndex) {
          n.classList.add('active');
        } else {
          n.classList.remove('active');
        }
        index++;
      }

      const colNumber = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
      cursorPosition.textContent = `Ln ${currentLineIndex}, Col ${colNumber}`;

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
      charCount.textContent = `${text.length} char${text.length !== 1 ? 's' : ''}`;

      const minutes = Math.max(1, Math.ceil(words / 200));
      readingTime.textContent = words === 0 ? '0 min read' : `${minutes} min read`;
    };

    let saveTimeout;
    const saveNote = (retryDelay = 0) => {
      statusIndicator.className = 'status-indicator saving';
      statusText.textContent = 'Saving...';

      const noteId = window.location.pathname.split('/').pop();
      fetch(`/api/note/${noteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        body: editor.value,
      })
        .then((r) => {
          if (!r.ok) throw new Error(`Save failed: ${r.status}`);
          saveRetryCount = 0;
          statusIndicator.className = 'status-indicator';
          statusText.textContent = 'Saved';
          setTimeout(() => {
            if (statusText.textContent === 'Saved') statusText.textContent = 'Ready';
          }, 2000);
        })
        .catch((err) => {
          if (saveRetryCount < MAX_RETRIES) {
            saveRetryCount++;
            const delay = Math.min(1000 * 2 ** saveRetryCount, 8000);
            statusText.textContent = `Retry ${saveRetryCount}/${MAX_RETRIES}...`;
            setTimeout(() => saveNote(delay), delay);
          } else {
            saveRetryCount = 0;
            statusIndicator.className = 'status-indicator error';
            statusText.textContent = 'Save failed';
            showToast('Failed to save. Check your connection.');
          }
        });
    };

    editor.addEventListener('input', () => {
      updateEditorUI();
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveNote, 1000);
    });

    editor.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = `${editor.value.substring(0, start)}    ${editor.value.substring(end)}`;
        editor.selectionStart = editor.selectionEnd = start + 4;
        updateEditorUI();
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveNote, 1000);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (saveTimeout) clearTimeout(saveTimeout);
        saveNote();
      }
    });

    for (const event of ['click', 'keyup', 'focus']) {
      editor.addEventListener(event, updateEditorUI);
    }

    editor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = editor.scrollTop;
    });

    const noteId = window.location.pathname.split('/').pop();
    statusText.textContent = 'Loading...';
    if (editorLoading) editorLoading.classList.remove('hidden');

    fetch(`/api/note/${noteId}`, { method: 'GET' })
      .then((r) => {
        if (!r.ok && r.status !== 200) throw new Error(`Load failed: ${r.status}`);
        return r.text();
      })
      .then((t) => {
        editor.value = t;
        updateEditorUI();
        statusText.textContent = 'Ready';
        if (editorLoading) editorLoading.classList.add('hidden');
        editor.focus();
      })
      .catch((err) => {
        statusText.textContent = 'Ready — New Note';
        if (editorLoading) editorLoading.classList.add('hidden');
        editor.focus();
      });

    $('newNoteBtn')?.addEventListener('click', () => {
      createNewNote();
    });

    $('copyUrlBtn')?.addEventListener('click', () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast('URL copied to clipboard!'));
    });

    $('downloadBtn')?.addEventListener('click', () => {
      const blob = new Blob([editor.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${noteId.substring(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    $('clearBtn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear this note?')) {
        editor.value = '';
        updateEditorUI();
        saveNote();
      }
    });

    $('shareBtn')?.addEventListener('click', () => {
      if (navigator.share) {
        navigator
          .share({
            title: 'Note Service',
            text: 'Check out this note!',
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard
          .writeText(window.location.href)
          .then(() => showToast('Link copied for sharing!'));
      }
    });
  }

  let toastTimer;
  function showToast(message) {
    const toast = $('toast');
    if (toastTimer) clearTimeout(toastTimer);

    toast.className = 'toast';
    toast.textContent = message;

    requestAnimationFrame(() => {
      toast.className = 'toast show';
    });

    toastTimer = setTimeout(() => {
      toast.className = 'toast hide';
      setTimeout(() => {
        toast.className = 'toast';
      }, 350);
    }, 2500);
  }

  window.addEventListener('popstate', () => {
    const p = window.location.pathname;
    if (p.startsWith('/note/')) {
      showEditor();
    } else if (p === '/note' || p === '/note/') {
      createNewNote();
    } else {
      showHome();
    }
  });
});
