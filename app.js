// Initialize Marked with KaTeX extension
try {
  if (typeof markedKatex !== 'undefined') {
    // The UMD bundle might expose it differently depending on the version
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

const STORAGE_KEYS = {
  theme: 'quizmaker-theme',
  history: 'quizmaker-history',
  recentJson: 'quizmaker-recent-json'
};
const MAX_HISTORY_ITEMS = 10;
const MAX_RECENT_JSON = 3;

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
  },
  {
    argomento: 'storia',
    domande: [
      {
        difficolta: 1,
        testo_domanda: 'In quale città si trova il Colosseo?',
        risposte: [
          { testo_risposta: 'Milano', spiegazione_vera_o_falsa: 'Milano non ospita il Colosseo.' },
          { testo_risposta: 'Roma', spiegazione_vera_o_falsa: 'Corretto: il Colosseo si trova a Roma.' },
          { testo_risposta: 'Napoli', spiegazione_vera_o_falsa: 'Napoli non è la città corretta.' },
          { testo_risposta: 'Torino', spiegazione_vera_o_falsa: 'Torino non ospita il Colosseo.' }
        ],
        risposta_corretta: 1
      }
    ]
  }
];

// DOM Elements - Config
const jsonInput = document.getElementById('jsonInput');
const jsonFile = document.getElementById('jsonFile');
const parseBtn = document.getElementById('parseBtn');
const resetBtn = document.getElementById('resetBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const parseStatus = document.getElementById('parseStatus');
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
const dropzoneApp = document.getElementById('dropzoneApp');

// DOM Elements - Views
const configView = document.getElementById('configView');
const quizView = document.getElementById('quizView');
const summaryView = document.getElementById('summaryView');

// DOM Elements - Quiz UI
const quitQuizBtn = document.getElementById('quitQuizBtn');
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
const playAgainBtn = document.getElementById('playAgainBtn');

// DOM Elements - Catalog Modal
const catalogModal = document.getElementById('catalogModal');
const catalogModalOverlay = document.getElementById('catalogModalOverlay');
const closeCatalogBtn = document.getElementById('closeCatalogBtn');
const openCatalogBtn = document.getElementById('openCatalogBtn');
const catalogSearchInput = document.getElementById('catalogSearchInput');
const catalogGrid = document.getElementById('catalogGrid');

let dataset = [];
let currentQuiz = [];
let currentQuizContext = null;
let allAvailableDatasets = []; // Store fetched datasets for filtering

// Gamification State
let quizState = 'idle'; 
let currentQuestionIndex = 0;
let selectedAnswerIndex = null;
let isChecking = false;
let correctAnswersCount = 0;

// Timer State
let timerInterval = null;
let timeLeft = 0;

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
  }
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

function summarizeJson(rawText) {
  try {
    const parsed = JSON.parse(rawText);
    const normalized = normalizeData(parsed);
    const topics = normalized.map(item => item.argomento);
    const questionTotal = normalized.reduce((sum, item) => sum + item.domande.length, 0);
    return {
      topics,
      questionTotal,
      label: topics.length ? `${topics.slice(0, 2).join(', ')}${topics.length > 2 ? '…' : ''}` : 'JSON recente'
    };
  } catch {
    return {
      topics: [],
      questionTotal: 0,
      label: 'JSON recente'
    };
  }
}

function saveRecentJson(rawText, source = 'manuale') {
  const trimmed = rawText.trim();
  if (!trimmed) return;
  const summary = summarizeJson(trimmed);
  const items = safeRead(STORAGE_KEYS.recentJson, []).filter(item => item.rawText !== trimmed);
  items.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    savedAt: new Date().toISOString(),
    source,
    rawText: trimmed,
    summary
  });
  safeWrite(STORAGE_KEYS.recentJson, items.slice(0, MAX_RECENT_JSON));
  renderRecentJson();
}

async function fetchDatasets() {
  if (!datasetsList) return;
  try {
    const response = await fetch('data/index.json');
    if (!response.ok) throw new Error('Network response was not ok');
    const datasets = await response.json();
    allAvailableDatasets = datasets;
    renderDatasets(datasets);
  } catch (error) {
    datasetsList.innerHTML = '<p class="text-xs italic">Dataset non disponibili in locale (richiede server).</p>';
    if (catalogGrid) catalogGrid.innerHTML = '<p class="col-span-full text-center py-10 opacity-50">Impossibile caricare il catalogo.</p>';
  }
}

function toggleCatalogModal(show) {
  if (show) {
    catalogModal.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
    catalogSearchInput.focus();
    renderCatalogGrid(allAvailableDatasets);
  } else {
    catalogModal.classList.add('modal-hidden');
    document.body.style.overflow = '';
  }
}

function renderCatalogGrid(datasets) {
  if (!catalogGrid) return;
  if (!datasets || !datasets.length) {
    catalogGrid.innerHTML = '<p class="col-span-full text-center py-10 opacity-50">Nessun dataset trovato.</p>';
    return;
  }

  catalogGrid.innerHTML = datasets.map(ds => `
    <div class="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-brand-400">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2 mb-1">
            <h3 class="font-bold text-slate-800 dark:text-slate-100">${ds.titolo}</h3>
            <span class="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">${ds.totale_domande} dom.</span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">${ds.descrizione}</p>
          <div class="flex flex-wrap gap-1.5 mb-4">
            ${(ds.argomenti || []).slice(0, 3).map(arg => `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium opacity-80">${arg}</span>`).join('')}
            ${ds.argomenti && ds.argomenti.length > 3 ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium opacity-80">+${ds.argomenti.length - 3}</span>` : ''}
          </div>
        </div>
      </div>
      <button type="button" data-fetch-dataset="${ds.file}" class="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 active:scale-95">
        Carica Dataset
      </button>
    </div>
  `).join('');

  catalogGrid.querySelectorAll('[data-fetch-dataset]').forEach(button => {
    button.addEventListener('click', () => {
      loadDatasetFile(button.dataset.fetchDataset);
      toggleCatalogModal(false);
    });
  });
}

async function loadDatasetFile(file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error('File non trovato');
    const data = await response.text();
    jsonInput.value = data;
    parseJsonFromInput();
    const filtersSection = document.getElementById('quizFiltersSection');
    if (filtersSection) filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    showStatus('Errore nel caricamento del dataset.', false);
  }
}

function renderDatasets(datasets) {
  if (!datasetsList) return;
  
  // Show only a few featured/recent ones in the sidebar
  const featured = datasets.slice(0, 3);
  
  if (!featured.length) {
    datasetsList.innerHTML = '<p>Nessun dataset trovato.</p>';
    return;
  }

  datasetsList.innerHTML = featured.map(ds => `
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-3 mb-3 dark:border-slate-700 dark:bg-slate-950/70">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2">
            <p class="font-medium text-slate-800 dark:text-slate-100">${ds.titolo}</p>
            <span class="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">${ds.totale_domande}</span>
          </div>
          <p class="mt-1 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">${ds.descrizione}</p>
        </div>
        <button type="button" data-fetch-dataset="${ds.file}" class="shrink-0 rounded-xl bg-slate-900 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">Carica</button>
      </div>
    </div>
  `).join('');

  datasetsList.querySelectorAll('[data-fetch-dataset]').forEach(button => {
    button.addEventListener('click', () => loadDatasetFile(button.dataset.fetchDataset));
  });
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

function saveQuizResult(result) {
  const items = safeRead(STORAGE_KEYS.history, []);
  items.unshift(result);
  safeWrite(STORAGE_KEYS.history, items.slice(0, MAX_HISTORY_ITEMS));
  renderHistory();
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

function setTheme(mode) {
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  if(document.getElementById('themeLabel')) document.getElementById('themeLabel').textContent = isDark ? 'Tema chiaro' : 'Tema scuro';
  localStorage.setItem(STORAGE_KEYS.theme, mode);
}

const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
const normalizedTheme = savedTheme ? savedTheme.replace(/"/g, '') : 'dark';
setTheme(normalizedTheme);

if(themeToggle) {
    themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    setTheme(newTheme);
    });
}

function showStatus(message, ok = true) {
  parseStatus.className = `mt-4 rounded-2xl border px-4 py-3 text-sm flex items-center gap-2 ${ok
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'}`;
  
  parseStatus.innerHTML = ok 
    ? `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <span>${message}</span>`
    : `<svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> <span>${message}</span>`;
  
  parseStatus.classList.remove('hidden');
}

function hideStatus() {
  parseStatus.classList.add('hidden');
}

function normalizeData(raw) {
  const topics = Array.isArray(raw) ? raw : [raw];
  if (!topics.length) throw new Error('Il JSON non contiene argomenti.');

  return topics.map((topic, topicIndex) => {
    if (typeof topic.argomento !== 'string' || !topic.argomento.trim()) {
      throw new Error(`Argomento non valido alla posizione ${topicIndex + 1}.`);
    }
    if (!Array.isArray(topic.domande) || !topic.domande.length) {
      throw new Error(`L\'argomento "${topic.argomento}" non contiene domande.`);
    }

    const domande = topic.domande.map((q, questionIndex) => {
      // Fix common backslash issues in strings coming from JSON
      // Specifically \b (backspace) which often happens with \bowtie
      if (typeof q.testo_domanda === 'string') {
        q.testo_domanda = q.testo_domanda.replace(/\u0008/g, '\\b');
      }

      if (!Number.isInteger(q.difficolta) || q.difficolta < 1 || q.difficolta > 5) {
        throw new Error(`Difficoltà non valida in "${topic.argomento}", domanda ${questionIndex + 1}.`);
      }
      if (typeof q.testo_domanda !== 'string' || !q.testo_domanda.trim()) {
        throw new Error(`Testo domanda mancante in "${topic.argomento}", domanda ${questionIndex + 1}.`);
      }
      if (!Array.isArray(q.risposte) || q.risposte.length < 2) {
        throw new Error(`Ogni domanda deve avere almeno 2 risposte in "${topic.argomento}".`);
      }
      q.risposte.forEach((a, answerIndex) => {
        if (typeof a.testo_risposta === 'string') {
          a.testo_risposta = a.testo_risposta.replace(/\u0008/g, '\\b');
        }
        if (typeof a.spiegazione_vera_o_falsa === 'string') {
          a.spiegazione_vera_o_falsa = a.spiegazione_vera_o_falsa.replace(/\u0008/g, '\\b');
        }

        if (typeof a.testo_risposta !== 'string' || !a.testo_risposta.trim()) {
          throw new Error(`Testo risposta mancante in "${topic.argomento}", domanda ${questionIndex + 1}, risposta ${answerIndex + 1}.`);
        }
        if (typeof a.spiegazione_vera_o_falsa !== 'string') {
          throw new Error(`Spiegazione mancante in "${topic.argomento}", domanda ${questionIndex + 1}, risposta ${answerIndex + 1}.`);
        }
      });
      if (!Number.isInteger(q.risposta_corretta) || q.risposta_corretta < 0 || q.risposta_corretta >= q.risposte.length) {
        throw new Error(`Indice risposta corretta non valido in "${topic.argomento}", domanda ${questionIndex + 1}.`);
      }
      return q;
    });

    return { argomento: topic.argomento.trim(), domande };
  });
}

function flattenQuestions() {
  return dataset.flatMap(topic => topic.domande.map(question => ({ ...question, argomento: topic.argomento })));
}

function getFilteredQuestions() {
  const selectedTopic = topicSelect.value;
  const selectedDifficulty = difficultySelect.value;
  return flattenQuestions().filter(question => {
    const topicOk = selectedTopic === 'all' || question.argomento === selectedTopic;
    const difficultyOk = selectedDifficulty === 'all' || String(question.difficolta) === selectedDifficulty;
    return topicOk && difficultyOk;
  });
}

function updateCounters() {
  topicCount.textContent = String(dataset.length);
  questionPoolCount.textContent = String(flattenQuestions().length);
  filteredCount.textContent = String(getFilteredQuestions().length);
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

function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
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
    saveRecentJson(content, 'editor');
    showStatus(`JSON valido: ${dataset.length} argomento/i e ${flattenQuestions().length} domanda/e disponibili.`);
  } catch (error) {
    dataset = [];
    currentQuiz = [];
    currentQuizContext = null;
    populateTopics();
    showStatus(error.message || 'JSON non valido.', false);
  }
}

function generateQuiz() {
  if (!dataset.length) {
    showStatus('Analizza prima un JSON valido.', false);
    return;
  }
  const filtered = getFilteredQuestions();
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

// --- GAMIFICATION & TIMER LOGIC ---
function startTimer(seconds) {
  quizTimerBadge.classList.remove('hidden');
  timeLeft = seconds;
  updateTimerText();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerText();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeUp();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  quizTimerBadge.classList.add('hidden');
}

function updateTimerText() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  quizTimerText.textContent = `${m}:${s}`;
  
  if (timeLeft <= 5 && timeLeft > 0) {
    quizTimerBadge.classList.remove('bg-amber-100', 'text-amber-700', 'dark:bg-amber-900/40', 'dark:text-amber-400');
    quizTimerBadge.classList.add('bg-rose-100', 'text-rose-700', 'dark:bg-rose-900/40', 'dark:text-rose-400', 'animate-pulse');
  } else if (timeLeft > 5) {
    quizTimerBadge.classList.remove('bg-rose-100', 'text-rose-700', 'dark:bg-rose-900/40', 'dark:text-rose-400', 'animate-pulse');
    quizTimerBadge.classList.add('bg-amber-100', 'text-amber-700', 'dark:bg-amber-900/40', 'dark:text-amber-400');
  }
}

function handleTimeUp() {
  if (isChecking) return;
  // If the user didn't select anything, answer is forced wrong
  // If the user selected something, we evaluate what they selected
  checkAnswer(true);
}

function setView(view) {
  configView.classList.toggle('hidden', view !== 'config');
  quizView.classList.toggle('hidden', view !== 'quiz');
  summaryView.classList.toggle('hidden', view !== 'summary');
  if (view === 'config') configView.classList.add('block');
  else configView.classList.remove('block');
  
  window.scrollTo(0, 0);
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
  stopTimer();
  selectedAnswerIndex = null;
  isChecking = false;
  
  const q = currentQuiz[currentQuestionIndex];
  const progress = (currentQuestionIndex / currentQuiz.length) * 100;
  quizProgressBar.style.width = `${progress}%`;
  
  quizQuestionTagText.textContent = `${q.argomento} • Difficoltà ${q.difficolta}`;
  
  // Timer setup
  if (q.tempo && q.tempo > 0) {
    startTimer(q.tempo);
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

function handleActionClick() {
  if (quizActionBtn.disabled && !isChecking) return;
  if (!isChecking) {
    checkAnswer(false);
  } else {
    nextQuestion();
  }
}

quizActionBtn.addEventListener('click', handleActionClick);

function checkAnswer(timeout = false) {
  if (isChecking) return;
  isChecking = true;
  stopTimer();

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
  }, 400);
}

// --- EVENT LISTENERS ---
async function handleFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    jsonInput.value = text;
    saveRecentJson(text, file.name || 'file');
    hideStatus();
    parseJsonFromInput();
  } catch (e) {
    showStatus('Impossibile leggere il file.', false);
  }
}

jsonFile.addEventListener('change', (event) => {
  handleFile(event.target.files?.[0]);
});

// Drag & Drop
if(dropzoneApp) {
  dropzoneApp.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneApp.classList.add('border-brand-500', 'bg-brand-50', 'dark:border-brand-400', 'dark:bg-brand-900/20');
  });
  dropzoneApp.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzoneApp.classList.remove('border-brand-500', 'bg-brand-50', 'dark:border-brand-400', 'dark:bg-brand-900/20');
  });
  dropzoneApp.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneApp.classList.remove('border-brand-500', 'bg-brand-50', 'dark:border-brand-400', 'dark:bg-brand-900/20');
    const file = e.dataTransfer.files?.[0];
    if(file && file.name.endsWith('.json')) {
      handleFile(file);
    } else {
      showStatus("Trascina un file .json valido.", false);
    }
  });
}

parseBtn.addEventListener('click', parseJsonFromInput);
loadSampleBtn.addEventListener('click', () => {
  jsonInput.value = JSON.stringify(sampleData, null, 2);
  saveRecentJson(jsonInput.value, 'esempio');
  hideStatus();
});
resetBtn.addEventListener('click', () => {
  dataset = [];
  currentQuiz = [];
  currentQuizContext = null;
  jsonInput.value = '';
  jsonFile.value = '';
  topicSelect.innerHTML = '<option value="all">Tutti gli argomenti</option>';
  questionCount.value = 5;
  difficultySelect.value = 'all';
  updateCounters();
  hideStatus();
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.history);
  renderHistory();
  showStatus('Storico quiz svuotato.');
});

clearRecentJsonBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEYS.recentJson);
  renderRecentJson();
  showStatus('Elenco JSON recenti svuotato.');
});

topicSelect.addEventListener('change', updateCounters);
difficultySelect.addEventListener('change', updateCounters);
generateBtn.addEventListener('click', generateQuiz);

// Catalog Modal Listeners
if (openCatalogBtn) openCatalogBtn.addEventListener('click', () => toggleCatalogModal(true));
if (closeCatalogBtn) closeCatalogBtn.addEventListener('click', () => toggleCatalogModal(false));
if (catalogModalOverlay) catalogModalOverlay.addEventListener('click', () => toggleCatalogModal(false));
if (catalogSearchInput) {
  catalogSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = allAvailableDatasets.filter(ds => 
      ds.titolo.toLowerCase().includes(query) || 
      ds.descrizione.toLowerCase().includes(query) ||
      (ds.argomenti && ds.argomenti.some(a => a.toLowerCase().includes(query)))
    );
    renderCatalogGrid(filtered);
  });
}

quitQuizBtn.addEventListener('click', () => {
  if(confirm('Vuoi davvero uscire dal quiz? I progressi andranno persi.')) {
    stopTimer();
    setView('config');
    quizState = 'idle';
  }
});

playAgainBtn.addEventListener('click', () => {
  setView('config');
  quizState = 'idle';
});

// --- INITIALIZATION ---
jsonInput.value = JSON.stringify(sampleData, null, 2);
topicSelect.innerHTML = '<option value="all">Tutti gli argomenti</option>';
renderRecentJson();
renderHistory();
updateCounters();
fetchDatasets();
