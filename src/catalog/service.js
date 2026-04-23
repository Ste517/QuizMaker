export async function fetchDatasets(catalogGrid, datasetsList, onRenderCatalogGrid, onRenderDatasets) {
  try {
    const response = await fetch('data/index.json');
    if (!response.ok) throw new Error('Network response was not ok');
    const datasets = await response.json();
    
    if (datasetsList) {
      onRenderDatasets(datasets);
    }
    return datasets;
  } catch (error) {
    console.error('Error fetching datasets:', error);
    if (datasetsList) {
      datasetsList.innerHTML = '<p class="text-xs italic">Dataset non disponibili in locale (richiede server).</p>';
    }
    if (catalogGrid) {
      catalogGrid.innerHTML = '<p class="col-span-full text-center py-10 opacity-50">Impossibile caricare il catalogo.</p>';
    }
    return [];
  }
}

export function toggleCatalogModal(show, catalogModal, catalogSearchInput, allAvailableDatasets, onRenderCatalogGrid) {
  if (show) {
    catalogModal.classList.remove('modal-hidden');
    document.body.style.overflow = 'hidden';
    catalogSearchInput.focus();
    onRenderCatalogGrid(allAvailableDatasets);
  } else {
    catalogModal.classList.add('modal-hidden');
    document.body.style.overflow = '';
  }
}

export function renderCatalogGrid(datasets, catalogGrid, onLoadDatasetFile, onToggleCatalogModal) {
  if (!catalogGrid) return;
  if (!datasets || !datasets.length) {
    catalogGrid.innerHTML = '<p class="col-span-full text-center py-10 opacity-50">Nessun dataset trovato.</p>';
    return;
  }

  catalogGrid.innerHTML = datasets.map(ds => {
    const isAi = ds.categoria === 'ai_generated';
    const categoryLabel = isAi ? 'IA' : 'User';
    const categoryClass = isAi 
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' 
      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300';

    return `
    <div class="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-950/50 dark:hover:border-brand-400">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-bold text-slate-800 dark:text-slate-100">${ds.titolo}</h3>
            <span class="rounded-full ${categoryClass} px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">${categoryLabel}</span>
          </div>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-lg">${ds.totale_domande} dom.</span>
            <p class="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">${ds.file.split('/').pop()}</p>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 h-8">${ds.descrizione}</p>
          <div class="flex flex-wrap gap-1.5 mb-4">
            ${(ds.argomenti || []).slice(0, 3).map(arg => `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium opacity-80">${arg}</span>`).join('')}
            ${ds.argomenti && ds.argomenti.length > 3 ? `<span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-medium opacity-80">+${ds.argomenti.length - 3}</span>` : ''}
          </div>
        </div>
      </div>
      <button type="button" data-fetch-dataset="${ds.file}" class="btn-glass w-full rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 active:scale-95">
        Carica Dataset
      </button>
    </div>
  `;}).join('');

  catalogGrid.querySelectorAll('[data-fetch-dataset]').forEach(button => {
    button.addEventListener('click', () => {
      onLoadDatasetFile(button.dataset.fetchDataset);
      onToggleCatalogModal(false);
    });
  });
}

export async function loadDatasetFile(file, jsonInput, onParseJsonFromInput, onShowStatus) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error('File non trovato');
    const data = await response.text();
    jsonInput.value = data;
    onParseJsonFromInput();
    const filtersSection = document.getElementById('quizFiltersSection');
    if (filtersSection) filtersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (err) {
    onShowStatus('Errore nel caricamento del dataset.', false);
  }
}

export function renderDatasets(datasets, datasetsList, onLoadDatasetFile) {
  if (!datasetsList) return;
  
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
    button.addEventListener('click', () => onLoadDatasetFile(button.dataset.fetchDataset));
  });
}
