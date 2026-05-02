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
  const html = document.documentElement;

  const path = window.location.pathname;
  const isNote = path.startsWith('/note/');

  if (isNote) {
    homeView.classList.add('hidden');
    editorView.style.display = 'flex';
    initEditor();
  } else {
    homeView.classList.remove('hidden');
    editorView.style.display = 'none';
  }

  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);

    if (newTheme === 'light') {
      themeText.textContent = 'Dark Mode';
      themeIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    } else {
      themeText.textContent = 'Light Mode';
      themeIcon.innerHTML =
        '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
  });

  const copyUrlBtn = document.getElementById('copyUrlBtn');
  const toast = document.getElementById('toast');

  copyUrlBtn?.addEventListener('click', () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.style.display = 'block';
      setTimeout(() => {
        toast.style.display = 'none';
      }, 2000);
    });
  });

  function initEditor() {
    const updateLineNumbers = () => {
      const lines = editor.value.split('\n');
      const cursorLine = editor.value.substr(0, editor.selectionStart).split('\n').length;
      lineNumbers.innerHTML = '';
      for (let i = 0; i < lines.length; i++) {
        const lineNumber = document.createElement('div');
        lineNumber.className = `line-number${i + 1 === cursorLine ? ' active' : ''}`;
        lineNumber.textContent = i + 1;
        lineNumbers.appendChild(lineNumber);
      }
    };

    const updateCursorPosition = () => {
      const text = editor.value;
      const position = editor.selectionStart;
      const lines = text.substr(0, position).split('\n');
      const lineNumber = lines.length;
      const columnNumber = lines[lines.length - 1].length + 1;
      cursorPosition.textContent = `Ln ${lineNumber}, Col ${columnNumber}`;
    };

    let saveTimeout;
    const saveNote = () => {
      statusIndicator.classList.add('saving');
      statusText.textContent = 'Saving...';

      fetch(window.location.href, {
        method: 'PUT',
        headers: { 'content-type': 'text/plain; charset=utf-8' },
        body: editor.value,
      }).then(() => {
        statusIndicator.classList.remove('saving');
        statusText.textContent = 'Saved';
        setTimeout(() => {
          statusText.textContent = 'Ready';
        }, 2000);
      });
    };

    editor.addEventListener('input', () => {
      updateLineNumbers();
      updateCursorPosition();
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
        updateLineNumbers();
        updateCursorPosition();
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveNote, 1000);
      }
    });

    editor.addEventListener('click', () => {
      updateCursorPosition();
      updateLineNumbers();
    });
    editor.addEventListener('keyup', () => {
      updateCursorPosition();
      updateLineNumbers();
    });

    editor.addEventListener('scroll', () => {
      lineNumbers.scrollTop = editor.scrollTop;
    });

    const u = new URL(window.location.href);
    u.searchParams.append('raw', 'true');
    fetch(u.href, { method: 'GET' })
      .then((r) => r.text())
      .then((t) => {
        editor.value = t;
        updateLineNumbers();
        updateCursorPosition();
      });
  }
});
