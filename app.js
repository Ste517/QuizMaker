import { STORAGE_KEYS, MAX_RECENT_JSON, safeRead, saveRecentJson, saveQuizResult } from './src/utils/storage.js';
import { setTheme, showStatus, hideStatus, setView, formatDateTime } from './src/utils/ui.js';
import { startTimer, stopTimer } from './src/quiz/timer.js';
import { normalizeData, shuffle, flattenQuestions, getFilteredQuestions, summarizeJson } from './src/quiz/engine.js';
import { fetchDatasets, toggleCatalogModal, renderCatalogGrid, loadDatasetFile, renderDatasets } from './src/catalog/service.js';

// Initialize Marked with KaTeX extension
try {
  if (typeof markedKatex !== 'undefined') {
    const extension = typeof markedKatex === 'function' ? markedKatex : markedKatex.default;
    if (typeof extension === 'function') {
      marked.use(extension({
        throwOnError: false,
        nonStandard: true
      }));
    }
  }
} catch (e) {
  console.warn("KaTeX extension initialization failed:", e);
}

// DOM Elements - Config
const jsonInput = document.getElementById('jsonInput');
const jsonFile = document.getElementById('jsonFile');
const parseBtn = document.getElementById('parseBtn');
const resetBtn = document.getElementById('resetBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const topicSelect = document.getElementById('topicSelect');
const difficultySelect = document.getElementById('difficultySelect');
const questionCount = document.getElementById('questionCount');
const generateBtn = document.getElementById('generateBtn');
const topicCount = document.getElementById('topicCount');
const questionPoolCount = document.getElementById('questionPoolCount');
const filteredCount = document.getElementById('filteredCount');
const themeToggle = document.getElementById('themeToggle');
const historyList = document.getElementById('historyList');
const recentJsonList = document.getElementById('recentJsonList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const clearRecentJsonBtn = document.getElementById('clearRecentJsonBtn');

// DOM Elements - Quiz UI
const quizProgressBar = document.getElementById('quizProgressBar');
const quizQuestionTagText = document.getElementById('quizQuestionTagText');
const quizQuestionText = document.getElementById('quizQuestionText');
const quizAnswersArea = document.getElementById('quizAnswersArea');
const quizFooter = document.getElementById('quizFooter');
const quizFeedbackContent = document.getElementById('quizFeedbackContent');
const quizFeedbackIcon = document.getElementById('quizFeedbackIcon');
const quizFeedbackTitle = document.getElementById('quizFeedbackTitle');
const quizFeedbackText = document.getElementById('quizFeedbackText');
const quizActionBtn = document.getElementById('quizActionBtn');
const quizTimerBadge = document.getElementById('quizTimerBadge');
const quizTimerText = document.getElementById('quizTimerText');

// DOM Elements - Summary UI
const summaryPercentage = document.getElementById('summaryPercentage');
const summaryCorrectCount = document.getElementById('summaryCorrectCount');
const summaryTotalCount = document.getElementById('summaryTotalCount');
const playAgainBtn = document.getElementById('playAgainBtn');

// DOM Elements - Catalog Modal
const catalogModal = document.getElementById('catalogModal');
const catalogModalOverlay = document.getElementById('catalogModalOverlay');
const closeCatalogBtn = document.getElementById('closeCatalogBtn');
const openCatalogBtn = document.getElementById('openCatalogBtn');
const catalogSearchInput = document.getElementById('catalogSearchInput');
const catalogGrid = document.getElementById('catalogGrid');
const datasetsList = document.getElementById('datasetsList');

// App State
let dataset = [];
let currentQuiz = [];
let currentQuizContext = null;
let allAvailableDatasets = [];
let quizState = 'idle'; 
let currentQuestionIndex = 0;
let selectedAnswerIndex = null;
let isChecking = false;
let correctAnswersCount = 0;

const sampleData = [
  {
    argomento: 'matematica',
    domande: [
      {
        difficolta: 2,
        tempo: 15,
        testo_domanda: 'Quanto vale 7 × 8? (Hai 15 secondi!)',
        risposte: [
          { testo_risposta: '54', spiegazione_vera_o_falsa: '54 è errato: 7 × 8 non fa 54.' },
          { testo_risposta: '56', spiegazione_vera_o_falsa: 'Corretto: 7 × 8 = 56.' },
          { testo_risposta: '64', spiegazione_vera_o_falsa: '64 è il quadrato di 8, non il prodotto tra 7 e 8.' },
          { testo_risposta: '58', spiegazione_vera_o_falsa: '58 è errato: il risultato corretto è 56.' }
        ],
        risposta_corretta: 1
      },
      {
        difficolta: 3,
        testo_domanda: 'Qual è la derivata di $x^2$?',
        risposte: [
          { testo_risposta: '$x$', spiegazione_vera_o_falsa: 'La derivata di $x^2$ non è $x$ ma $2x$.' },
          { testo_risposta: '$2x$', spiegazione_vera_o_falsa: 'Corretto: applicando la regola di derivazione si ottiene $2x$.' },
          { testo_risposta: '$x^3$', spiegazione_vera_o_falsa: 'La derivata riduce l\'esponente, non lo aumenta.' },
          { testo_risposta: '$2$', spiegazione_vera_o_falsa: '2 sarebbe la derivata di $2x$, non di $x^2$.' }
        ],
        risposta_corretta: 1
      }
    ]
  }
];

// --- Initialization ---

async function init() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  const normalizedTheme = savedTheme ? savedTheme.replace(/"/g, '') : 'dark';
  setTheme(normalizedTheme, STORAGE_KEYS);

  renderHistory();
  renderRecentJson();
  
  allAvailableDatasets = await fetchDatasets(catalogGrid, datasetsList, 
    (ds) => renderCatalogGrid(ds, catalogGrid, loadDatasetFileFromCatalog, toggleCatalog),
    (ds) => renderDatasets(ds, datasetsList, loadDatasetFileFromCatalog)
  );
}

// --- Wrapper Functions for Modules ---

function toggleCatalog(show) {
  toggleCatalogModal(show, catalogModal, catalogSearchInput, allAvailableDatasets, 
    (ds) => renderCatalogGrid(ds, catalogGrid, loadDatasetFileFromCatalog, toggleCatalog));
}

function loadDatasetFileFromCatalog(file) {
  loadDatasetFile(file, jsonInput, parseJsonFromInput, showStatus);
}

function parseJsonFromInput() {
  const content = jsonInput.value.trim();
  if (!content) {
    showStatus('Inserisci o carica un JSON prima di analizzarlo.', false);
    return;
  }

  try {
    const raw = JSON.parse(content);
    dataset = normalizeData(raw);
    populateTopics();
    currentQuiz = [];
    currentQuizContext = null;
    saveRecentJson(content, 'editor', summarizeJson);
    renderRecentJson();
    showStatus(`JSON valido: ${dataset.length} argomento/i e ${flattenQuestions(dataset).length} domanda/e disponibili.`);
  } catch (error) {
    dataset = [];
    currentQuiz = [];
    currentQuizContext = null;
    populateTopics();
    showStatus(error.message || 'JSON non valido.', false);
  }
}

function populateTopics() {
  topicSelect.innerHTML = '<option value="all">Tutti gli argomenti</option>';
  dataset.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic.argomento;
    option.textContent = topic.argomento;
    topicSelect.appendChild(option);
  });
  updateCounters();
}

function updateCounters() {
  topicCount.textContent = String(dataset.length);
  questionPoolCount.textContent = String(flattenQuestions(dataset).length);
  filteredCount.textContent = String(getFilteredQuestions(dataset, topicSelect.value, difficultySelect.value).length);
}

function renderRecentJson() {
  const items = safeRead(STORAGE_KEYS.recentJson, []);
  if (!items.length) {
    recentJsonList.innerHTML = '<p>Nessun JSON recente salvato.</p>';
    return;
  }

  recentJsonList.innerHTML = items.map(item => `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/70">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="font-medium text-slate-800 dark:text-slate-100">${item.summary.label}</p>
          <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">${item.summary.questionTotal} domande · ${item.source} · ${formatDateTime(item.savedAt)}</p>
        </div>
        <button type="button" data-load-json="${item.id}" class="rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700">Carica</button>
      </div>
    </div>
  `).join('');

  recentJsonList.querySelectorAll('[data-load-json]').forEach(button => {
    button.addEventListener('click', () => {
      const item = items.find(entry => entry.id === button.dataset.loadJson);
      if (!item) return;
      jsonInput.value = item.rawText;
      showStatus('JSON recente caricato. Premi "Analizza JSON" per applicarlo.');
    });
  });
}

function renderHistory() {
  const items = safeRead(STORAGE_KEYS.history, []);
  if (!items.length) {
    historyList.innerHTML = '<p>Nessun quiz completato finora.</p>';
    return;
  }

  historyList.innerHTML = items.map(item => `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/70">
      <div class="flex items-center justify-between gap-3">
        <p class="font-medium text-slate-800 dark:text-slate-100">${item.correct}/${item.total} · ${item.percentage}%</p>
        <span class="text-xs text-slate-500 dark:text-slate-400">${formatDateTime(item.completedAt)}</span>
      </div>
      <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">Argomento: ${item.topicLabel} · Difficoltà: ${item.difficultyLabel} · Domande: ${item.total}</p>
    </div>
  `).join('');
}

// --- Quiz Logic ---

function generateQuiz() {
  if (!dataset.length) {
    showStatus('Analizza prima un JSON valido.', false);
    return;
  }
  const filtered = getFilteredQuestions(dataset, topicSelect.value, difficultySelect.value);
  updateCounters();
  if (!filtered.length) {
    showStatus('Nessuna domanda disponibile con i filtri selezionati.', false);
    return;
  }

  const requested = Number(questionCount.value);
  if (!Number.isInteger(requested) || requested < 1) {
    showStatus('Il numero di domande deve essere almeno 1.', false);
    return;
  }

  const amount = Math.min(requested, filtered.length);
  currentQuiz = shuffle(filtered).slice(0, amount);
  currentQuizContext = {
    topicLabel: topicSelect.value === 'all' ? 'Tutti gli argomenti' : topicSelect.value,
    difficultyLabel: difficultySelect.value === 'all' ? 'Tutte' : difficultySelect.value,
    generatedAt: new Date().toISOString()
  };
  
  startQuiz();
}

function startQuiz() {
  if (!currentQuiz.length) return;
  quizState = 'playing';
  currentQuestionIndex = 0;
  correctAnswersCount = 0;
  setView('quiz');
  renderCurrentQuestion();
}

function renderCurrentQuestion() {
  stopTimer(quizTimerBadge);
  selectedAnswerIndex = null;
  isChecking = false;
  
  const q = currentQuiz[currentQuestionIndex];
  const progress = (currentQuestionIndex / currentQuiz.length) * 100;
  quizProgressBar.style.width = `${progress}%`;
  
  quizQuestionTagText.textContent = `${q.argomento} • Difficoltà ${q.difficolta}`;
  
  if (q.tempo && q.tempo > 0) {
    startTimer(q.tempo, { quizTimerBadge, quizTimerText }, () => checkAnswer(true));
  }
  
  let imageHtml = '';
  if (q.immagine_url) {
    imageHtml = `<img src="${q.immagine_url}" alt="Immagine della domanda" class="mb-6 w-full max-w-lg rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mx-auto" />`;
  }
  
  quizQuestionText.innerHTML = `${imageHtml}${marked.parse(q.testo_domanda)}`;
  
  const answersWithOriginalIndex = q.risposte.map((a, i) => ({ ...a, originalIndex: i }));
  const shuffledAnswers = shuffle(answersWithOriginalIndex);
  q._currentAnswersMap = shuffledAnswers;

  quizAnswersArea.innerHTML = shuffledAnswers.map((a, i) => `
    <button class="answer-card w-full p-4 sm:p-5 flex flex-col items-start gap-3 text-left group" data-index="${i}">
      <div class="flex items-center gap-4 w-full">
        <div class="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border-2 border-slate-300 text-slate-400 font-bold text-sm group-[.selected]:border-brand-500 group-[.selected]:text-brand-600 group-[.selected]:bg-brand-100 dark:border-slate-600 dark:group-[.selected]:border-brand-400 dark:group-[.selected]:text-brand-300 dark:group-[.selected]:bg-brand-900/50 transition-colors">
          ${String.fromCharCode(65 + i)}
        </div>
        <div class="markdown-content flex-1 font-semibold text-slate-700 dark:text-slate-200 text-base sm:text-lg">${marked.parse(a.testo_risposta)}</div>
      </div>
      <div class="explanation-area hidden w-full pl-12 text-sm text-slate-600 dark:text-slate-400 opacity-90 markdown-content">
        ${marked.parse(a.spiegazione_vera_o_falsa || '')}
      </div>
    </button>
  `).join('');

  quizAnswersArea.querySelectorAll('.answer-card').forEach(btn => {
    btn.addEventListener('click', () => selectAnswer(Number(btn.dataset.index)));
  });

  quizFeedbackContent.classList.add('hidden');
  quizFooter.classList.remove('bg-emerald-50', 'bg-rose-50', 'dark:bg-emerald-950/40', 'dark:bg-rose-950/40');
  quizFooter.classList.add('bg-white', 'dark:bg-slate-950');
  
  quizActionBtn.textContent = 'Controlla';
  quizActionBtn.className = 'btn-3d w-full h-14 sm:h-16 rounded-2xl font-bold text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center action-btn-disabled';
  quizActionBtn.disabled = true;
}

function selectAnswer(index) {
  if (isChecking) return;
  selectedAnswerIndex = index;
  
  quizAnswersArea.querySelectorAll('.answer-card').forEach((btn, i) => {
    btn.classList.toggle('selected', i === index);
  });
  
  quizActionBtn.disabled = false;
  quizActionBtn.className = 'btn-3d w-full h-14 sm:h-16 rounded-2xl font-bold text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center action-btn-primary';
}

function checkAnswer(timeout = false) {
  if (isChecking) return;
  isChecking = true;
  stopTimer(quizTimerBadge);

  const q = currentQuiz[currentQuestionIndex];
  let isCorrect = false;

  if (selectedAnswerIndex !== null) {
      const selectedAnswer = q._currentAnswersMap[selectedAnswerIndex];
      isCorrect = selectedAnswer.originalIndex === q.risposta_corretta;
  }
  
  if (isCorrect) correctAnswersCount++;

  quizAnswersArea.querySelectorAll('.answer-card').forEach((btn, i) => {
    btn.classList.add('locked');
    btn.classList.remove('selected');
    
    const answer = q._currentAnswersMap[i];
    if (answer.originalIndex === q.risposta_corretta) {
      btn.classList.add('correct');
      btn.querySelector('.explanation-area').classList.remove('hidden');
    } else if (i === selectedAnswerIndex) {
      btn.classList.add('wrong');
      btn.querySelector('.explanation-area').classList.remove('hidden');
    } else {
      btn.style.opacity = '0.5';
    }
  });

  quizFooter.classList.remove('bg-white', 'dark:bg-slate-950');
  quizFooter.classList.add(isCorrect ? 'bg-emerald-50' : 'bg-rose-50');
  quizFooter.classList.add(isCorrect ? 'dark:bg-emerald-950/40' : 'dark:bg-rose-950/40');
  
  quizFeedbackContent.classList.remove('hidden');

  let titleText = isCorrect ? 'Ottimo lavoro!' : 'Risposta errata';
  if (timeout && selectedAnswerIndex === null) titleText = 'Tempo scaduto!';

  quizFeedbackTitle.textContent = titleText;
  quizFeedbackTitle.className = `font-bold text-xl sm:text-2xl mb-0 ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`;
  
  quizFeedbackText.innerHTML = '';
  quizFeedbackText.classList.add('hidden');
  
  quizFeedbackIcon.innerHTML = isCorrect 
    ? `<div class="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400 rounded-full w-full h-full flex items-center justify-center"><svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>`
    : `<div class="bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400 rounded-full w-full h-full flex items-center justify-center"><svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></div>`;
  
  quizActionBtn.textContent = 'Continua';
  quizActionBtn.className = `btn-3d w-full h-14 sm:h-16 rounded-2xl font-bold text-lg uppercase tracking-wider transition-all duration-200 flex items-center justify-center ${isCorrect ? 'action-btn-correct' : 'action-btn-wrong'}`;
  quizActionBtn.disabled = false;
}

function nextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < currentQuiz.length) {
    renderCurrentQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  quizState = 'finished';
  quizProgressBar.style.width = '100%';
  setTimeout(() => {
    setView('summary');
    const percentage = Math.round((correctAnswersCount / currentQuiz.length) * 100);
    summaryCorrectCount.textContent = correctAnswersCount;
    summaryTotalCount.textContent = currentQuiz.length;
    summaryPercentage.textContent = percentage;
    
    saveQuizResult({
      completedAt: new Date().toISOString(),
      total: currentQuiz.length,
      correct: correctAnswersCount,
      percentage,
      topicLabel: currentQuizContext?.topicLabel || 'Tutti gli argomenti',
      difficultyLabel: currentQuizContext?.difficultyLabel || 'Tutte'
    });
    renderHistory();
  }, 400);
}

// --- Event Handlers ---

function handleActionClick() {
  if (quizActionBtn.disabled && !isChecking) return;
  if (!isChecking) {
    checkAnswer(false);
  } else {
    nextQuestion();
  }
}

async function handleFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    jsonInput.value = text;
    saveRecentJson(text, file.name || 'file', summarizeJson);
    renderRecentJson();
    hideStatus();
    parseJsonFromInput();
  } catch (e) {
    showStatus('Impossibile leggere il file.', false);
  }
}

// --- Event Listeners ---

parseBtn.addEventListener('click', parseJsonFromInput);

resetBtn.addEventListener('click', () => {
  jsonInput.value = '';
  dataset = [];
  currentQuiz = [];
  populateTopics();
  hideStatus();
});

loadSampleBtn.addEventListener('click', () => {
  jsonInput.value = JSON.stringify(sampleData, null, 2);
  parseJsonFromInput();
});

generateBtn.addEventListener('click', generateQuiz);

topicSelect.addEventListener('change', updateCounters);
difficultySelect.addEventListener('change', updateCounters);

themeToggle.addEventListener('click', () => {
  const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  setTheme(newTheme, STORAGE_KEYS);
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.history);
  renderHistory();
});

clearRecentJsonBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.recentJson);
  renderRecentJson();
});

jsonFile.addEventListener('change', (event) => {
  handleFile(event.target.files?.[0]);
});

dropzoneApp.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzoneApp.classList.add('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
});

dropzoneApp.addEventListener('dragleave', () => {
  dropzoneApp.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
});

dropzoneApp.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzoneApp.classList.remove('border-brand-500', 'bg-brand-50', 'dark:bg-brand-900/20');
  handleFile(e.dataTransfer.files?.[0]);
});

openCatalogBtn.addEventListener('click', () => toggleCatalog(true));
closeCatalogBtn.addEventListener('click', () => toggleCatalog(false));
catalogModalOverlay.addEventListener('click', () => toggleCatalog(false));

catalogSearchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allAvailableDatasets.filter(ds => 
    ds.titolo.toLowerCase().includes(query) || 
    ds.descrizione.toLowerCase().includes(query) ||
    (ds.argomenti || []).some(a => a.toLowerCase().includes(query))
  );
  renderCatalogGrid(filtered, catalogGrid, loadDatasetFileFromCatalog, toggleCatalog);
});

document.querySelectorAll('[data-category-filter]').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-category-filter]').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const filter = tab.dataset.categoryFilter;
    const filtered = filter === 'all' 
      ? allAvailableDatasets 
      : allAvailableDatasets.filter(ds => ds.categoria === filter);
    renderCatalogGrid(filtered, catalogGrid, loadDatasetFileFromCatalog, toggleCatalog);
  });
});

quizActionBtn.addEventListener('click', handleActionClick);

quitQuizBtn.addEventListener('click', () => {
  if (confirm('Sei sicuro di voler abbandonare il quiz?')) {
    stopTimer(quizTimerBadge);
    setView('config');
  }
});

playAgainBtn.addEventListener('click', () => setView('config'));

// Start initialization
init();
