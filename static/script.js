document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('sound-grid');
    const emptyState = document.getElementById('empty-state');

    // Variáveis de Estado
    let currentSounds = [];
    let currentConfig = { items: {}, order: [] };
    let isEditMode = false;
    let currentEditingFilename = null;
    let sortableInstance = null;

    // Elementos da UI
    const editModeBtn = document.getElementById('edit-mode-btn');
    const colorPicker = document.getElementById('color-picker');
    const imageUpload = document.getElementById('image-upload');
    const editModal = document.getElementById('edit-modal');
    const modalFilename = document.getElementById('modal-filename');
    const modalColorBtn = document.getElementById('modal-color-btn');
    const modalImageBtn = document.getElementById('modal-image-btn');
    const modalRemoveImageBtn = document.getElementById('modal-remove-image-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // Função para buscar o estado geral (sons + o que está tocando)
    async function fetchState() {
        try {
            const responseSounds = await fetch('/api/sounds');
            const dataSounds = await responseSounds.json();
            
            const responsePlaying = await fetch('/api/playing');
            const dataPlaying = await responsePlaying.json();
            
            const responseConfig = await fetch('/api/config');
            const dataConfig = await responseConfig.json();
            currentConfig = dataConfig;
            if (!currentConfig.items) currentConfig.items = {};
            if (!currentConfig.order) currentConfig.order = [];
            
            if (dataSounds.sounds && dataSounds.sounds.length > 0) {
                renderButtons(dataSounds.sounds, dataPlaying.playing || []);
                emptyState.style.display = 'none';
            } else {
                emptyState.style.display = 'block';
                grid.innerHTML = '';
            }
        } catch (error) {
            console.error('Erro ao buscar estado:', error);
            emptyState.innerHTML = 'Erro ao conectar com o servidor.<br>Verifique se o Python está rodando.';
            emptyState.style.display = 'block';
        }
    }

    if (editModeBtn) {
        editModeBtn.addEventListener('click', () => {
            isEditMode = !isEditMode;
            if (isEditMode) {
                document.body.classList.add('edit-mode');
                editModeBtn.classList.add('active');
                if (sortableInstance) sortableInstance.option('disabled', false);
            } else {
                document.body.classList.remove('edit-mode');
                editModeBtn.classList.remove('active');
                if (sortableInstance) sortableInstance.option('disabled', true);
            }
        });
    }

    // Modal Events
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        modalColorBtn.addEventListener('click', () => {
            const itemConfig = currentConfig.items[currentEditingFilename] || {};
            colorPicker.value = itemConfig.color || "#4facfe";
            colorPicker.click();
            editModal.style.display = 'none';
        });

        modalImageBtn.addEventListener('click', () => {
            imageUpload.click();
            editModal.style.display = 'none';
        });

        modalRemoveImageBtn.addEventListener('click', async () => {
            try {
                await fetch(`/api/config/${encodeURIComponent(currentEditingFilename)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: null })
                });
                if (currentConfig.items[currentEditingFilename]) {
                    delete currentConfig.items[currentEditingFilename].image;
                }
                applyConfig();
                editModal.style.display = 'none';
            } catch (error) {
                console.error('Erro ao remover imagem:', error);
            }
        });
    }

    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            if (currentEditingFilename) {
                const newColor = e.target.value;
                if (!currentConfig.items[currentEditingFilename]) currentConfig.items[currentEditingFilename] = {};
                currentConfig.items[currentEditingFilename].color = newColor;
                applyConfig();
            }
        });

        colorPicker.addEventListener('change', async (e) => {
            if (currentEditingFilename) {
                const newColor = e.target.value;
                try {
                    await fetch(`/api/config/${encodeURIComponent(currentEditingFilename)}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ color: newColor })
                    });
                    applyConfig();
                } catch (error) {
                    console.error('Erro ao salvar cor:', error);
                }
            }
        });
    }

    if (imageUpload) {
        imageUpload.addEventListener('change', async (e) => {
            if (!currentEditingFilename || !e.target.files.length) return;
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch(`/api/upload_image/${encodeURIComponent(currentEditingFilename)}`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.status === 'success') {
                    if (!currentConfig.items[currentEditingFilename]) {
                        currentConfig.items[currentEditingFilename] = {};
                    }
                    currentConfig.items[currentEditingFilename].image = data.image;
                    applyConfig();
                }
            } catch (error) {
                console.error('Erro no upload de imagem:', error);
            }
            imageUpload.value = ''; // Reset
        });
    }

    function applyConfig() {
        document.querySelectorAll('.sound-btn').forEach(btn => {
            const file = btn.dataset.filename;
            const item = currentConfig.items[file] || {};
            
            if (item.color) {
                btn.style.borderColor = item.color;
                btn.style.boxShadow = `0 8px 32px 0 ${item.color}40`;
            } else {
                btn.style.borderColor = '';
                btn.style.boxShadow = '';
            }
            
            if (item.image) {
                btn.style.backgroundImage = `url('${item.image}')`;
            } else {
                btn.style.backgroundImage = 'none';
            }
        });
    }

    // Função para renderizar os botões na tela
    function renderButtons(sounds, playingSounds) {
        const sonsMudaram = JSON.stringify(sounds) !== JSON.stringify(currentSounds);
        
        if (sonsMudaram) {
            currentSounds = sounds;
            grid.innerHTML = ''; 
            
            // Reordenar os sons baseado no currentConfig.order
            const orderedSounds = [];
            (currentConfig.order || []).forEach(file => {
                if (sounds.includes(file)) orderedSounds.push(file);
            });
            sounds.forEach(file => {
                if (!orderedSounds.includes(file)) orderedSounds.push(file);
            });
            
            orderedSounds.forEach(filename => {
                const btn = document.createElement('button');
                btn.className = 'sound-btn';
                btn.dataset.filename = filename;
                
                const displayName = filename.replace(/\.[^/.]+$/, "");
                btn.innerHTML = `<span>${displayName}</span>`;
                
                btn.addEventListener('click', (e) => {
                    if (isEditMode) {
                        currentEditingFilename = filename;
                        const itemConfig = currentConfig.items[filename] || {};
                        modalFilename.innerText = displayName;
                        if (itemConfig.image) {
                            modalRemoveImageBtn.style.display = 'block';
                        } else {
                            modalRemoveImageBtn.style.display = 'none';
                        }
                        editModal.style.display = 'flex';
                    } else {
                        toggleSound(filename, btn);
                    }
                });
                
                grid.appendChild(btn);
            });
            
            // Inicializar Sortable
            if (sortableInstance) sortableInstance.destroy();
            sortableInstance = new Sortable(grid, {
                animation: 150,
                disabled: !isEditMode, // Apenas arrasta se estiver no Modo Edição
                delay: 200, // Evita arrastar por acidente ao tocar
                delayOnTouchOnly: true,
                onEnd: async () => {
                    const newOrder = Array.from(grid.children).map(btn => btn.dataset.filename);
                    currentConfig.order = newOrder;
                    try {
                        await fetch('/api/order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ order: newOrder })
                        });
                    } catch (error) {
                        console.error('Erro ao salvar ordem:', error);
                    }
                }
            });
        }
        
        applyConfig();
        
        // Atualiza a classe 'playing' baseada no estado real do servidor
        const allButtons = document.querySelectorAll('.sound-btn');
        allButtons.forEach(btn => {
            const file = btn.dataset.filename;
            if (playingSounds.includes(file)) {
                if (!btn.classList.contains('playing')) {
                    btn.classList.add('playing');
                }
            } else {
                if (btn.classList.contains('playing')) {
                    btn.classList.remove('playing');
                }
            }
        });
    }

    // Função para alternar o som (Play/Stop)
    async function toggleSound(filename, buttonElement) {
        if (buttonElement.classList.contains('playing')) {
            buttonElement.classList.remove('playing');
        } else {
            document.querySelectorAll('.sound-btn.playing').forEach(btn => btn.classList.remove('playing'));
            buttonElement.classList.add('playing');
        }

        if (navigator.vibrate) {
            navigator.vibrate(50);
        }

        try {
            await fetch(`/api/toggle/${encodeURIComponent(filename)}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Erro ao alternar som:', error);
        }
    }

    fetchState();
    setInterval(fetchState, 800);
});
