const state = {
  data: [],
  currentScore: 0,
  bestScore: 0,
  leftItem: null,
  rightItem: null,
};

const elements = {
  leftCard: document.getElementById('left-card'),
  rightCard: document.getElementById('right-card'),
  leftImage: document.getElementById('left-image'),
  rightImage: document.getElementById('right-image'),
  leftName: document.getElementById('left-name'),
  rightName: document.getElementById('right-name'),
  leftSubtitle: document.getElementById('left-subtitle'),
  rightSubtitle: document.getElementById('right-subtitle'),
  leftSearches: document.getElementById('left-searches'),
  rightSearches: document.getElementById('right-searches'),
  score: document.getElementById('current-score'),
  bestScore: document.getElementById('best-score'),
  modal: document.getElementById('game-over'),
  finalScore: document.getElementById('final-score'),
  finalBest: document.getElementById('best-score-final'),
  shareFeedback: document.getElementById('share-feedback'),
  btnHigher: document.getElementById('higher-btn'),
  btnLower: document.getElementById('lower-btn'),
  btnRestart: document.getElementById('restart-btn'),
  btnShare: document.getElementById('share-btn'),
  soundCorrect: document.getElementById('sound-correct'),
  soundWrong: document.getElementById('sound-wrong'),
};

const numberFormatter = new Intl.NumberFormat('es-ES');

// Fetch data then initialize game
fetch('data.json')
  .then((res) => res.json())
  .then((items) => {
    state.data = items;
    state.bestScore = Number(localStorage.getItem('bestScore') || 0);
    elements.bestScore.textContent = state.bestScore;
    attachEvents();
    startGame();
  })
  .catch((err) => {
    console.error('Error cargando datos', err);
    alert('No se pudieron cargar los datos del juego.');
  });

function attachEvents() {
  elements.btnHigher.addEventListener('click', () => handleGuess('higher'));
  elements.btnLower.addEventListener('click', () => handleGuess('lower'));
  elements.btnRestart.addEventListener('click', startGame);
  elements.btnShare.addEventListener('click', shareScore);
}

function startGame() {
  state.currentScore = 0;
  updateScore();
  hideModal();
  pickInitialItems();
  renderCards(true);
}

function updateScore() {
  elements.score.textContent = state.currentScore;
}

function pickInitialItems() {
  state.leftItem = getRandomItem();
  state.rightItem = getRandomDifferentItem(state.leftItem);
}

function getRandomItem() {
  const index = Math.floor(Math.random() * state.data.length);
  return state.data[index];
}

function getRandomDifferentItem(reference) {
  let candidate;
  do {
    candidate = getRandomItem();
  } while (candidate === reference || candidate === state.rightItem);
  return candidate;
}

function renderCards(resetRight = false) {
  renderCard(elements.leftImage, elements.leftName, elements.leftSubtitle, elements.leftSearches, state.leftItem, true);
  renderCard(
    elements.rightImage,
    elements.rightName,
    elements.rightSubtitle,
    elements.rightSearches,
    state.rightItem,
    !resetRight
  );

  elements.rightSearches.textContent = resetRight ? '??? búsquedas' : formatSearches(state.rightItem.busquedas);
  elements.rightSearches.classList.toggle('hidden', resetRight);
  elements.rightCard.classList.add('fade-in');
  setTimeout(() => elements.rightCard.classList.remove('fade-in'), 400);
}

function renderCard(imageEl, nameEl, subtitleEl, searchesEl, item, reveal) {
  subtitleEl.textContent = item.subtitulo;
  nameEl.textContent = item.nombre;
  if (reveal) {
    searchesEl.textContent = formatSearches(item.busquedas);
    searchesEl.classList.remove('hidden');
  } else {
    searchesEl.textContent = '??? búsquedas';
    searchesEl.classList.add('hidden');
  }

  setImage(imageEl, item);
}

function setImage(wrapper, item) {
  wrapper.innerHTML = '';
  const img = document.createElement('img');
  if (!item.imagen) {
    wrapper.textContent = item.nombre.charAt(0).toUpperCase();
    return;
  }
  img.src = item.imagen;
  img.alt = item.nombre;
  img.onerror = () => {
    wrapper.textContent = item.nombre.charAt(0).toUpperCase();
    img.remove();
  };
  wrapper.appendChild(img);
}

function handleGuess(guess) {
  const rightHigher = state.rightItem.busquedas > state.leftItem.busquedas;
  const isCorrect = (guess === 'higher' && rightHigher) || (guess === 'lower' && !rightHigher);

  revealRightCard(isCorrect);

  const sound = isCorrect ? elements.soundCorrect : elements.soundWrong;
  sound.currentTime = 0;
  sound.play();

  if (isCorrect) {
    state.currentScore += 1;
    updateScore();
    state.leftItem = state.rightItem;
    state.rightItem = getRandomDifferentItem(state.leftItem);
    setTimeout(() => renderCards(true), 450);
  } else {
    endGame();
  }
}

function revealRightCard(correct) {
  renderCard(elements.rightImage, elements.rightName, elements.rightSubtitle, elements.rightSearches, state.rightItem, true);
  elements.rightCard.classList.remove('flash-correct', 'flash-wrong');
  elements.rightCard.classList.add(correct ? 'flash-correct' : 'flash-wrong');
  setTimeout(() => elements.rightCard.classList.remove('flash-correct', 'flash-wrong'), 500);
}

function endGame() {
  elements.finalScore.textContent = state.currentScore;

  if (state.currentScore > state.bestScore) {
    state.bestScore = state.currentScore;
    localStorage.setItem('bestScore', state.bestScore);
    elements.bestScore.textContent = state.bestScore;
  }

  elements.finalBest.textContent = state.bestScore;
  showModal();
}

function showModal() {
  elements.modal.classList.remove('hidden');
}

function hideModal() {
  elements.modal.classList.add('hidden');
  elements.shareFeedback.textContent = '';
}

function formatSearches(num) {
  return `${numberFormatter.format(num)} búsquedas`;
}

async function shareScore() {
  const text = `¡Conseguí ${state.currentScore} puntos en Higher or Lower!`;
  try {
    await navigator.clipboard.writeText(text);
    elements.shareFeedback.textContent = 'Puntuación copiada al portapapeles.';
  } catch (err) {
    elements.shareFeedback.textContent = 'No se pudo copiar automáticamente.';
  }
}
