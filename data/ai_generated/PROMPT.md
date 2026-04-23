# QuizMaker Dataset Generation Prompt

Use the following prompt to generate new datasets for QuizMaker. Replace the placeholders in square brackets with your specific requirements.

---

**Prompt:**

Agisci come un esperto di didattica e creatore di contenuti educativi. Il tuo compito è generare un dataset per un'applicazione di quiz chiamata **QuizMaker**.

Il dataset deve essere in formato **JSON** e seguire rigorosamente la struttura descritta di seguito.

### Argomento richiesto:
**[INSERISCI ARGOMENTO, ES: "Storia Contemporanea"]**

### Requisiti del contenuto:
1. **Suddivisione in Argomenti:** Dividi il contenuto in micro-argomenti logici (es: "Prima Guerra Mondiale", "Trattato di Versailles").
2. **Domande:** Crea almeno **[NUMERO]** domande per ogni micro-argomento.
3. **Difficoltà:** Assegna a ogni domanda una difficoltà da 1 (facile) a 5 (difficile).
4. **Risposte:** Fornisci esattamente 4 opzioni per ogni domanda. Solo una deve essere corretta.
5. **Spiegazioni (Fondamentale):** Ogni risposta (sia corretta che errata) deve avere una spiegazione dettagliata e incoraggiante. Usa il Markdown per evidenziare termini tecnici (es: `**termine**`) o per inserire formule LaTeX se necessario (es: `$E=mc^2$`).
6. **LaTeX:** Se l'argomento è scientifico, usa sempre il formato `$formula$` per le espressioni matematiche.
7. **Timer:** Opzionalmente, aggiungi un campo `"tempo"` in secondi per le domande più complesse.

### Struttura JSON richiesta:
```json
[
  {
    "argomento": "Titolo Micro-Argomento",
    "domande": [
      {
        "difficolta": 3,
        "tempo": 30,
        "testo_domanda": "Testo della domanda con eventuale **Markdown** o $formula$?",
        "risposte": [
          {
            "testo_risposta": "Opzione Corretta",
            "spiegazione_vera_o_falsa": "Ottimo! Spiegazione del perché è corretta."
          },
          {
            "testo_risposta": "Opzione Errata",
            "spiegazione_vera_o_falsa": "Non proprio. Spiegazione del perché questa opzione è sbagliata e suggerimento per quella corretta."
          },
          { "testo_risposta": "...", "spiegazione_vera_o_falsa": "..." },
          { "testo_risposta": "...", "spiegazione_vera_o_falsa": "..." }
        ],
        "risposta_corretta": 0
      }
    ]
  }
]
```

**Note importanti:**
- Evita muri di testo. Sii conciso e diretto.
- Assicurati che il JSON sia valido e ben formattato.
- Non aggiungere testo introduttivo o conclusivo, restituisci solo il blocco JSON.

---
