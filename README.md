# QuizMaker 🧠

QuizMaker è una web app moderna, veloce per creare, gestire e svolgere quiz personalizzati tramite file JSON. Progettata per essere leggera, reattiva e facile da usare sia su desktop che su mobile.

## 🚀 Funzionalità Principali
-   **Svolgimento Quiz**: Carica un dataset JSON e inizia subito a testare le tue conoscenze.
-   **Editor Integrato**: Crea nuovi quiz o modifica quelli esistenti con un'interfaccia visuale intuitiva (niente più editing manuale di JSON!).
-   **Timer Personalizzato**: Supporto per limiti di tempo specifici per ogni domanda.
-   **Drag & Drop**: Carica i tuoi file JSON semplicemente trascinandoli nell'app.
-   **Design Moderno**: Tema scuro/chiaro automatico, animazioni fluide e icone intuitive.
-   **Offline Ready**: L'app è composta da semplici file HTML/JS/CSS e può essere eseguita localmente.

## 📁 Struttura del Progetto
```text
QuizMaker/
├── index.html          # Applicazione principale (Quiz Player)
├── editor.html         # Strumento per creare/modificare i dataset
├── app.js              # Logica core del player e gestione timer
├── editor.js           # Logica dell'editor visuale
├── contribute.html     # Guida dettagliata alla contribuzione
├── data/               # Repository dei dataset
│   ├── index.json      # Indice dei dataset disponibili per il download
│   ├── ai_generated/   # Quiz generati tramite intelligenza artificiale
│   └── user_made/      # Quiz creati e condivisi dalla community
|       └── base.json   # Schema di base per i dataset da utilizzare come template 
└── assets/             # (Opzionale) Immagini e risorse statiche
```

## 🤝 Come Contribuire

Siamo entusiasti di ricevere contributi, specialmente nuovi dataset!

### Aggiungere nuovi Dataset (user_made)
1.  Usa l'**Editor** integrato nell'app (`editor.html`) per creare il tuo quiz.
2.  Esporta il file JSON.
3.  Crea una Pull Request aggiungendo il tuo file nella cartella `data/user_made/`.
4.  Aggiorna `data/index.json` per includere il tuo nuovo dataset nella lista dei download.

### Migliorare il Progetto
Se vuoi migliorare il codice o il design:
-   Segnala bug o suggerisci funzionalità tramite le **Issue**.
-   Invia una **Pull Request** con i tuoi miglioramenti.

Per istruzioni più dettagliate, visita la pagina [Contribuisci](contribute.html) direttamente nell'app.

## 🛠 Tech Stack
-   **HTML5** (Semantica e struttura)
-   **Tailwind CSS** (Styling moderno e responsive)
-   **Vanilla JavaScript** (Logica e gestione stato, senza framework pesanti)

---
*Progetto creato con ❤️ e l'ausilio dell'IA per rendere l'apprendimento più divertente e accessibile.*
