document.addEventListener('DOMContentLoaded', () => {
  const homeView = document.getElementById('homeView');
  const editorView = document.getElementById('editorView');
  const editor = document.getElementById('editor');
  const lineNumbers = document.getElementById('lineNumbers');
  const themeToggle = document.getElementById('themeToggle');
  const themeText = document.getElementById('theme-text');
  const themeIcon = document.getElementById('theme-icon');
  const statusIndicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');
  const cursorPosition = document.getElementById('cursorPosition');
  const wordCount = document.getElementById('wordCount');
  const charCount = document.getElementById('charCount');
  const readingTime = document.getElementById('readingTime');
  const html = document.documentElement;

  const path = window.location.pathname;
  const isNote = path.startsWith('/note/');

  // Initial Theme Setup
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
    fetch('/api/create', { method: 'POST' })
      .then((r) => r.json())
      .then((data) => {
        window.history.pushState({}, '', `/note/${data.id}`);
        showEditor();
      })
      .catch(handleError);
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

  function initEditor() {
    let lastLineCount = 0;

    const updateEditorUI = () => {
      const text = editor.value;
      const lines = text.split('\n');
      const currentLineCount = lines.length;
      const selectionStart = editor.selectionStart;
      const linesBeforeCursor = text.substr(0, selectionStart).split('\n');
      const currentLineIndex = linesBeforeCursor.length;

      // Efficient line number rendering
      if (currentLineCount !== lastLineCount) {
        const fragment = document.createDocumentFragment();
        for (let i = 1; i <= currentLineCount; i++) {
          const div = document.createElement('div');
          div.className = 'line-number';
          div.textContent = i;
          fragment.appendChild(div);
        }
        lineNumbers.innerHTML = '';
        lineNumbers.appendChild(fragment);
        lastLineCount = currentLineCount;
      }

      // Update active line highlighting
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

      // Status Bar updates
      const colNumber = linesBeforeCursor[linesBeforeCursor.length - 1].length + 1;
      cursorPosition.textContent = `Ln ${currentLineIndex}, Col ${colNumber}`;

      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
      charCount.textContent = `${text.length} character${text.length !== 1 ? 's' : ''}`;

      const minutes = Math.ceil(words / 200);
      readingTime.textContent = `${minutes} min read`;
    };

    let saveTimeout;
    const saveNote = () => {
      statusIndicator.classList.add('saving');
      statusText.textContent = 'Saving...';

      const noteId = window.location.pathname.split('/').pop();
      fetch(`/api/note/${noteId}`, {
        method: 'PUT',
        headers: { 'content-type': 'text/plain; charset=utf-8' },
        body: editor.value,
      })
        .then((r) => {
          if (!r.ok) throw new Error('Save failed');
          statusIndicator.classList.remove('saving');
          statusText.textContent = 'Saved';
          setTimeout(() => {
            if (statusText.textContent === 'Saved') statusText.textContent = 'Ready';
          }, 2000);
        })
        .catch(handleError);
    };

    editor.addEventListener('input', () => {
      updateEditorUI();
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveNote, 1000);
    });

    editor.addEventListener('keydown', (e) => {
      // Handle Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = `${editor.value.substring(0, start)}    ${editor.value.substring(end)}`;
        editor.selectionStart = editor.selectionEnd = start + 4;
        updateEditorUI();
      }

      // Handle Ctrl+S
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

    // Loading existing note
    const noteId = window.location.pathname.split('/').pop();
    statusText.textContent = 'Loading...';
    fetch(`/api/note/${noteId}`, { method: 'GET' })
      .then((r) => r.text())
      .then((t) => {
        editor.value = t;
        updateEditorUI();
        statusText.textContent = 'Ready';
      })
      .catch(handleError);

    // Header Actions
    document.getElementById('copyUrlBtn')?.addEventListener('click', () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast('URL copied to clipboard!'));
    });

    document.getElementById('downloadBtn')?.addEventListener('click', () => {
      const blob = new Blob([editor.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${noteId.substring(0, 8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('clearBtn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear this note?')) {
        editor.value = '';
        updateEditorUI();
        saveNote();
      }
    });

    document.getElementById('shareBtn')?.addEventListener('click', () => {
      if (navigator.share) {
        navigator
          .share({
            title: 'Note Service',
            text: 'Check out this note I wrote!',
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

  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2500);
  }

  function handleError(err) {
    console.error(err);
    statusIndicator.style.backgroundColor = 'var(--danger)';
    statusIndicator.style.boxShadow = '0 0 10px var(--danger)';
    statusText.textContent = 'Error occurred';
    showToast('An error occurred. Please check your connection.');
  }
});
