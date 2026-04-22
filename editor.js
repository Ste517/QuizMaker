// Theme Logic
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const html = document.documentElement;

function applyTheme(isDark) {
  if (isDark) {
    html.classList.add('dark');
    if(themeLabel) themeLabel.textContent = 'Chiaro';
  } else {
    html.classList.remove('dark');
    if(themeLabel) themeLabel.textContent = 'Scuro';
  }
}

const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
let isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
applyTheme(isDark);

if(themeToggle) {
    themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    applyTheme(isDark);
    });
}

// Editor Logic
let topics = [];
let questions = [];
let editingId = null;

// DOM Elements
const topicsListEl = document.getElementById('topicsList');
const newTopicInput = document.getElementById('newTopicInput');
const addTopicBtn = document.getElementById('addTopicBtn');
const topicSelect = document.getElementById('topicSelect');

const answersContainer = document.getElementById('answersContainer');
const questionForm = document.getElementById('questionForm');
const clearFormBtn = document.getElementById('clearFormBtn');
const saveQuestionBtn = document.getElementById('saveQuestionBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const questionTime = document.getElementById('questionTime');

const questionsListEl = document.getElementById('questionsList');
const questionCountBadge = document.getElementById('questionCountBadge');
const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');
const dropzoneEditor = document.getElementById('dropzoneEditor');
const dropzoneEditorBtn = document.getElementById('dropzoneEditorBtn');

// Initialize Answers Form
let answerCount = 4;
const addAnswerBtn = document.getElementById('addAnswerBtn');
const removeAnswerBtn = document.getElementById('removeAnswerBtn');

function renderAnswerInputs(count) {
  // Save existing values to not lose them during re-render
  const savedData = [];
  for (let i = 0; i < answersContainer.children.length; i++) {
    const textInput = document.getElementById(`ans_${i}`);
    const expInput = document.getElementById(`exp_${i}`);
    const isChecked = document.querySelector(`input[name="correctAnswer"][value="${i}"]`)?.checked || false;
    if (textInput) {
      savedData.push({ text: textInput.value, exp: expInput.value, checked: isChecked });
    }
  }

  answersContainer.innerHTML = Array.from({ length: count }).map((_, i) => {
    const isChecked = savedData[i]?.checked || (i === 0 && !savedData.some(s => s.checked));
    return `
    <div class="relative rounded-xl border border-slate-200 bg-slate-50 p-4 pl-12 dark:border-slate-700/50 dark:bg-slate-950/40">
      <input type="radio" name="correctAnswer" value="${i}" required class="absolute left-4 top-[1.35rem] h-4 w-4 cursor-pointer text-brand-600 focus:ring-brand-600" ${isChecked ? 'checked' : ''} />
      <div class="space-y-3">
        <input type="text" id="ans_${i}" required placeholder="Testo risposta ${i + 1}" class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900" />
        <input type="text" id="exp_${i}" required placeholder="Spiegazione..." class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 dark:border-slate-600 dark:bg-slate-900" />
      </div>
    </div>
  `}).join('');

  // Restore text values
  for (let i = 0; i < Math.min(count, savedData.length); i++) {
    document.getElementById(`ans_${i}`).value = savedData[i].text;
    document.getElementById(`exp_${i}`).value = savedData[i].exp;
  }
}

addAnswerBtn.addEventListener('click', () => {
  answerCount++;
  renderAnswerInputs(answerCount);
});

removeAnswerBtn.addEventListener('click', () => {
  if (answerCount > 2) {
    answerCount--;
    renderAnswerInputs(answerCount);
  } else {
    alert('Una domanda deve avere almeno 2 risposte.');
  }
});

renderAnswerInputs(answerCount);

// Topics Management
function renderTopics() {
  if (topics.length === 0) {
    topicsListEl.innerHTML = '<p class="text-slate-500 text-xs italic w-full">Nessun argomento aggiunto.</p>';
    topicSelect.innerHTML = '<option value="" disabled selected>Nessun argomento disponibile</option>';
    return;
  }

  topicsListEl.innerHTML = topics.map(t => `
    <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
      ${t}
      <button type="button" onclick="deleteTopic('${t}')" class="text-slate-500 hover:text-red-500">&times;</button>
    </span>
  `).join('');

  const currentValue = topicSelect.value;
  topicSelect.innerHTML = '<option value="" disabled>Seleziona un argomento</option>' + 
    topics.map(t => `<option value="${t}">${t}</option>`).join('');
  
  if (topics.includes(currentValue)) {
    topicSelect.value = currentValue;
  }
}

function addTopic() {
  const val = newTopicInput.value.trim();
  if (val && !topics.includes(val)) {
    topics.push(val);
    newTopicInput.value = '';
    renderTopics();
  }
}

window.deleteTopic = function(topic) {
  if (questions.some(q => q.argomento === topic)) {
    alert("Impossibile eliminare l'argomento: ci sono domande associate. Eliminale o cambiane l'argomento prima.");
    return;
  }
  topics = topics.filter(t => t !== topic);
  renderTopics();
}

addTopicBtn.addEventListener('click', addTopic);
newTopicInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTopic(); });

// Questions Management
function renderQuestionsList() {
  questionCountBadge.textContent = `${questions.length} dom.`;
  
  if (questions.length === 0) {
    questionsListEl.innerHTML = '<p class="text-slate-500 text-sm italic">Nessuna domanda inserita.</p>';
    return;
  }

  // Group by topic
  const grouped = {};
  questions.forEach(q => {
    if (!grouped[q.argomento]) grouped[q.argomento] = [];
    grouped[q.argomento].push(q);
  });

  questionsListEl.innerHTML = Object.entries(grouped).map(([topic, qs]) => `
    <div class="mb-4 last:mb-0">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 dark:text-slate-400">${topic} (${qs.length})</h3>
      <div class="space-y-2">
        ${qs.map(q => `
          <div class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
            <div class="flex items-start justify-between gap-2">
              <p class="text-sm font-medium line-clamp-2">${q.testo_domanda}</p>
              <div class="flex flex-col items-end gap-1">
                <span class="shrink-0 text-[10px] font-bold text-brand-600 dark:text-brand-400">Diff. ${q.difficolta}</span>
                ${q.tempo ? `<span class="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400">⏱ ${q.tempo}s</span>` : ''}
              </div>
            </div>
            <div class="mt-2 flex justify-end gap-2">
              <button type="button" onclick="loadQuestionForEdit('${q.id}')" class="text-xs font-medium text-slate-600 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">Modifica</button>
              <button type="button" onclick="deleteQuestion('${q.id}')" class="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Elimina</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

window.deleteQuestion = function(id) {
  if(confirm('Sei sicuro di voler eliminare questa domanda?')) {
    questions = questions.filter(q => q.id !== id);
    if (editingId === id) resetForm();
    renderQuestionsList();
  }
};

window.loadQuestionForEdit = function(id) {
  const q = questions.find(q => q.id === id);
  if (!q) return;

  editingId = id;
  formTitle.textContent = 'Modifica Domanda';
  saveQuestionBtn.textContent = 'Salva Modifiche';
  cancelEditBtn.classList.remove('hidden');

  topicSelect.value = q.argomento;
  document.getElementById('difficultySelect').value = q.difficolta;
  document.getElementById('questionText').value = q.testo_domanda;
  document.getElementById('questionImageUrl').value = q.immagine_url || '';
  if (questionTime) questionTime.value = q.tempo || '';

  answerCount = q.risposte.length || 4;
  renderAnswerInputs(answerCount);

  q.risposte.forEach((ans, i) => {
    document.getElementById(`ans_${i}`).value = ans.testo_risposta;
    document.getElementById(`exp_${i}`).value = ans.spiegazione_vera_o_falsa;
  });

  const radioBtn = document.querySelector(`input[name="correctAnswer"][value="${q.risposta_corretta}"]`);
  if (radioBtn) radioBtn.checked = true;
  
  document.getElementById('questionText').scrollIntoView({ behavior: 'smooth', block: 'center' });
};

function resetForm() {
  editingId = null;
  formTitle.textContent = 'Nuova Domanda';
  saveQuestionBtn.textContent = 'Aggiungi Domanda';
  cancelEditBtn.classList.add('hidden');
  answerCount = 4;
  renderAnswerInputs(answerCount);
  questionForm.reset();
  if(questionTime) questionTime.value = '';
  document.querySelector('input[name="correctAnswer"][value="0"]').checked = true;
}

clearFormBtn.addEventListener('click', resetForm);
cancelEditBtn.addEventListener('click', resetForm);

questionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!topicSelect.value) {
    alert('Seleziona un argomento (aggiungine uno dalla barra laterale se necessario).');
    return;
  }

  const tempoVal = questionTime && questionTime.value ? parseInt(questionTime.value, 10) : null;

  const q = {
    id: editingId || crypto.randomUUID(),
    argomento: topicSelect.value,
    difficolta: parseInt(document.getElementById('difficultySelect').value, 10),
    testo_domanda: document.getElementById('questionText').value.trim(),
    immagine_url: document.getElementById('questionImageUrl').value.trim(),
    risposta_corretta: parseInt(document.querySelector('input[name="correctAnswer"]:checked').value, 10),
    risposte: Array.from({ length: answerCount }).map((_, i) => ({
      testo_risposta: document.getElementById(`ans_${i}`).value.trim(),
      spiegazione_vera_o_falsa: document.getElementById(`exp_${i}`).value.trim()
    }))
  };

  if (tempoVal && tempoVal > 0) q.tempo = tempoVal;
  if (!q.immagine_url) delete q.immagine_url;

  if (editingId) {
    const idx = questions.findIndex(x => x.id === editingId);
    questions[idx] = q;
  } else {
    questions.push(q);
  }

  resetForm();
  renderQuestionsList();
});

// Import / Export JSON
exportJsonBtn.addEventListener('click', () => {
  if (questions.length === 0) {
    alert('Il dataset è vuoto!');
    return;
  }

  // Group into final schema
  const grouped = {};
  questions.forEach(q => {
    if (!grouped[q.argomento]) grouped[q.argomento] = [];
    // Remove internal ID for export
    const { id, argomento, ...exportQ } = q;
    grouped[q.argomento].push(exportQ);
  });

  const finalDataset = Object.entries(grouped).map(([argomento, domande]) => ({
    argomento,
    domande
  }));

  const dataStr = JSON.stringify(finalDataset, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `dataset_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

async function handleImportFile(file) {
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Basic validation
    if (!Array.isArray(data)) throw new Error('Root must be array');

    let importedQuestions = [];
    let importedTopics = new Set(topics);

    data.forEach(item => {
      if (!item.argomento || !Array.isArray(item.domande)) return;
      importedTopics.add(item.argomento);
      
      item.domande.forEach(d => {
        const q = {
          id: crypto.randomUUID(),
          argomento: item.argomento,
          difficolta: d.difficolta || 1,
          testo_domanda: d.testo_domanda || '',
          risposta_corretta: d.risposta_corretta || 0,
          risposte: d.risposte || []
        };
        if(d.tempo) q.tempo = d.tempo;
        if(d.immagine_url) q.immagine_url = d.immagine_url;
        importedQuestions.push(q);
      });
    });

    topics = Array.from(importedTopics);
    questions = importedQuestions;
    
    renderTopics();
    renderQuestionsList();
    if(importJsonInput) importJsonInput.value = '';
    alert('Dataset caricato con successo!');
  } catch (err) {
    alert('Errore nel parsing del file JSON. Assicurati che sia nel formato corretto.');
    console.error(err);
  }
}

if(importJsonInput) {
    importJsonInput.addEventListener('change', (e) => {
        handleImportFile(e.target.files?.[0]);
    });
}

// Drag & Drop for Editor
if(dropzoneEditor) {
  dropzoneEditor.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzoneEditor.classList.add('ring-2', 'ring-brand-500', 'ring-offset-2', 'rounded-xl');
  });
  dropzoneEditor.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzoneEditor.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'rounded-xl');
  });
  dropzoneEditor.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzoneEditor.classList.remove('ring-2', 'ring-brand-500', 'ring-offset-2', 'rounded-xl');
    const file = e.dataTransfer.files?.[0];
    if(file && file.name.endsWith('.json')) {
      handleImportFile(file);
    } else {
      alert("Trascina un file .json valido.");
    }
  });
}
