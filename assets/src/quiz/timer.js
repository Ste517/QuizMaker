export let timerInterval = null;
export let timeLeft = 0;

export function startTimer(seconds, uiElements, onTimeUp) {
  const { quizTimerBadge, quizTimerText } = uiElements;
  quizTimerBadge.classList.remove('hidden');
  timeLeft = seconds;
  updateTimerText(quizTimerBadge, quizTimerText);

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerText(quizTimerBadge, quizTimerText);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      onTimeUp();
    }
  }, 1000);
}

export function stopTimer(quizTimerBadge) {
  if (timerInterval) clearInterval(timerInterval);
  if (quizTimerBadge) quizTimerBadge.classList.add('hidden');
}

export function updateTimerText(quizTimerBadge, quizTimerText) {
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
