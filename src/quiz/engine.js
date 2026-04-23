export function normalizeData(raw) {
  const topics = Array.isArray(raw) ? raw : [raw];
  if (!topics.length) throw new Error('Il JSON non contiene argomenti.');

  return topics.map((topic, topicIndex) => {
    if (typeof topic.argomento !== 'string' || !topic.argomento.trim()) {
      throw new Error(`Argomento non valido alla posizione ${topicIndex + 1}.`);
    }
    if (!Array.isArray(topic.domande) || !topic.domande.length) {
      throw new Error(`L'argomento "${topic.argomento}" non contiene domande.`);
    }

    const domande = topic.domande.map((q, questionIndex) => {
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

export function shuffle(array) {
  const clone = [...array];
  for (let i = clone.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function flattenQuestions(dataset) {
  return dataset.flatMap(topic => topic.domande.map(question => ({ ...question, argomento: topic.argomento })));
}

export function getFilteredQuestions(dataset, topicSelectValue, difficultySelectValue) {
  return flattenQuestions(dataset).filter(question => {
    const topicOk = topicSelectValue === 'all' || question.argomento === topicSelectValue;
    const difficultyOk = difficultySelectValue === 'all' || String(question.difficolta) === difficultySelectValue;
    return topicOk && difficultyOk;
  });
}

export function summarizeJson(rawText) {
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
