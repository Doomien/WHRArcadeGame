(() => {
  const listElement = document.getElementById('scene-list');
  const statusElement = document.getElementById('scene-status');
  const iframe = document.getElementById('game-frame');
  const sceneTitle = document.getElementById('scene-title');
  const sceneKeyValue = document.getElementById('scene-key');
  const sceneBackgroundValue = document.getElementById('scene-background');
  const sceneSpawnValue = document.getElementById('scene-spawn');
  const scenePlatformsValue = document.getElementById('scene-platforms');
  const editSceneButton = document.getElementById('edit-scene-btn');

  const modal = document.getElementById('scene-modal');
  const modalEditor = document.getElementById('scene-json-editor');
  const modalError = document.getElementById('modal-error');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSave = document.getElementById('modal-save');

  let scenesMap = {};
  let currentSceneKey = null;
  const buttonMap = new Map();
  let lastFocusedButton = null;
  let pendingSceneUpdate = null;

  function postToGame(message) {
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
      return true;
    }
    return false;
  }

  function resetSummary() {
    sceneTitle.textContent = 'Select a scene';
    sceneKeyValue.textContent = '—';
    sceneBackgroundValue.textContent = '—';
    sceneSpawnValue.textContent = '—';
    scenePlatformsValue.textContent = '—';
    editSceneButton.disabled = true;
  }

  async function loadScenes() {
    try {
      const response = await fetch('data/scenes.json');
      const data = await response.json();
      scenesMap = data.scenes || {};
      renderSceneList(scenesMap);
      const entries = Object.entries(scenesMap);
      statusElement.textContent = `Loaded ${entries.length} scenes from scenes.json`;
      editSceneButton.disabled = entries.length === 0;
      if (entries.length > 0) {
        selectScene(entries[0][0]);
      }
    } catch (error) {
      statusElement.textContent = 'Failed to load scenes.json';
      console.error('[SceneSelector] Unable to load scene data', error);
      editSceneButton.disabled = true;
      resetSummary();
    }
  }

  function renderSceneList(scenes) {
    listElement.innerHTML = '';
    buttonMap.clear();

    Object.entries(scenes).forEach(([sceneKey, config]) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.textContent = config.name || sceneKey;
      button.addEventListener('click', () => selectScene(sceneKey));
      item.appendChild(button);
      listElement.appendChild(item);
      buttonMap.set(sceneKey, button);
    });
  }

  function highlightButton(sceneKey) {
    buttonMap.forEach((button, key) => {
      if (key === sceneKey) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  function selectScene(sceneKey) {
    const config = scenesMap[sceneKey];
    if (!config) {
      console.warn('[SceneSelector] Scene config missing for key:', sceneKey);
      return;
    }

    currentSceneKey = sceneKey;
    highlightButton(sceneKey);
    statusElement.textContent = `Selected: ${config.name || sceneKey}`;
    updateSummary(sceneKey, config);
    sendSceneMessage(sceneKey);
    editSceneButton.disabled = false;
    lastFocusedButton = buttonMap.get(sceneKey);
  }

  function sendSceneMessage(sceneKey) {
    if (!postToGame({ type: 'whr:set-scene', sceneKey })) {
      iframe.src = `index.html?scene=${encodeURIComponent(sceneKey)}`;
    }
  }

  iframe?.addEventListener('load', () => {
    if (currentSceneKey) {
      sendSceneMessage(currentSceneKey);
    }
    if (pendingSceneUpdate
      && postToGame({ type: 'whr:update-scene-config', sceneKey: pendingSceneUpdate.sceneKey, config: pendingSceneUpdate.config })) {
      pendingSceneUpdate = null;
    }
  });

  function updateSummary(sceneKey, config) {
    sceneTitle.textContent = config.name || sceneKey;
    sceneKeyValue.textContent = sceneKey;
    const bg = config.background || {};
    const bgKey = typeof bg.key === 'string' && bg.key.length ? bg.key : '—';
    const bgFile = typeof bg.file === 'string' && bg.file.length ? bg.file : '—';
    sceneBackgroundValue.textContent = `${bgKey} → ${bgFile}`;

    if (config.spawn && typeof config.spawn === 'object'
      && typeof config.spawn.x === 'number'
      && typeof config.spawn.y === 'number') {
      const { x, y } = config.spawn;
      sceneSpawnValue.textContent = `x:${Math.round(x)}, y:${Math.round(y)}`;
    } else {
      sceneSpawnValue.textContent = '—';
    }

    const platforms = Array.isArray(config.platforms) ? config.platforms.length : 0;
    scenePlatformsValue.textContent = `${platforms}`;
  }

  function openModal() {
    if (!currentSceneKey) return;
    const config = scenesMap[currentSceneKey];
    if (!config) return;
    modalEditor.value = JSON.stringify(config, null, 2);
    modalError.textContent = '';
    modal.classList.remove('hidden');
    modalEditor.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
    modalError.textContent = '';
    if (lastFocusedButton) {
      lastFocusedButton.focus();
    } else {
      editSceneButton.focus();
    }
  }

  function saveModal() {
    if (!currentSceneKey) return;
    try {
      const parsed = JSON.parse(modalEditor.value);
      scenesMap[currentSceneKey] = parsed;
      const button = buttonMap.get(currentSceneKey);
      if (button) {
        button.textContent = parsed.name || currentSceneKey;
      }
      updateSummary(currentSceneKey, parsed);
      sendSceneUpdate(currentSceneKey, parsed);
      statusElement.textContent = `Updated local definition for ${parsed.name || currentSceneKey}`;
      closeModal();
    } catch (error) {
      modalError.textContent = error.message;
    }
  }

  function sendSceneUpdate(sceneKey, config) {
    pendingSceneUpdate = { sceneKey, config };
    if (postToGame({ type: 'whr:update-scene-config', sceneKey, config })) {
      pendingSceneUpdate = null;
    }
  }

  editSceneButton.addEventListener('click', openModal);
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modalSave.addEventListener('click', saveModal);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      event.preventDefault();
      closeModal();
    }
  });

  window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.type) return;
    if (data.type === 'whr:scene-loaded' && data.sceneKey) {
      statusElement.textContent = `Loaded scene in preview: ${data.sceneKey}`;
    } else if (data.type === 'whr:scene-updated' && data.sceneKey) {
      statusElement.textContent = `Scene updated in preview: ${data.sceneKey}`;
    }
  });

  resetSummary();
  loadScenes();
})();
