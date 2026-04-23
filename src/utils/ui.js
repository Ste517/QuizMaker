export function formatDateTime(value) {
  return new Date(value).toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export function setTheme(mode, STORAGE_KEYS) {
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  const themeLabel = document.getElementById('themeLabel');
  if (themeLabel) themeLabel.textContent = isDark ? 'Tema chiaro' : 'Tema scuro';
  localStorage.setItem(STORAGE_KEYS.theme, mode);
}

export function showStatus(message, ok = true) {
  const parseStatus = document.getElementById('parseStatus');
  if (!parseStatus) return;

  parseStatus.className = `mt-4 rounded-2xl border px-4 py-3 text-sm flex items-center gap-2 ${ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'}`;
  
  parseStatus.innerHTML = ok 
    ? `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>${message}</span>`
    : `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span>${message}</span>`;
  
  parseStatus.classList.remove('hidden');
}

export function hideStatus() {
  const parseStatus = document.getElementById('parseStatus');
  if (parseStatus) parseStatus.classList.add('hidden');
}

export function setView(view) {
  const configView = document.getElementById('configView');
  const quizView = document.getElementById('quizView');
  const summaryView = document.getElementById('summaryView');

  if (!configView || !quizView || !summaryView) return;

  configView.classList.toggle('hidden', view !== 'config');
  quizView.classList.toggle('hidden', view !== 'quiz');
  summaryView.classList.toggle('hidden', view !== 'summary');
  
  if (view === 'config') configView.classList.add('block');
  else configView.classList.remove('block');
  
  window.scrollTo(0, 0);
}

export function toggleReportModal(show) {
  const reportModal = document.getElementById('reportModal');
  if (!reportModal) return;

  if (show) {
    reportModal.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
  } else {
    reportModal.classList.add('modal-hidden');
    document.body.style.overflow = '';
  }
}
