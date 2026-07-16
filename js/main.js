// js/main.js
// Inicialización de DocenteOS, boot y funciones de navegación global

// --------------- PWA ---------------
window.initPWA = () => {
    try {
        const manifestJSON = {
            "name": "DocenteOS Aqua Liquid",
            "short_name": "DocenteOS",
            "start_url": ".",
            "display": "standalone",
            "background_color": "#f0f9ff",
            "theme_color": "#0ea5e9",
            "description": "Sistema de gestión escolar avanzado con motor relacional. Soporte offline.",
            "orientation": "portrait-primary",
            "icons": [
                { "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgM2g2YTRgMCAwIDEgNCA0djE0YTMgMyAwIDAgMC0zLTNIMnoiPjwvcGF0aD48cGF0aCBkPSJNMjIgM2gtNmEtNCA0IDAgMCAwLTQgNHYxNGEzIDMgMCAwIDEgMy0zaDdaIj48L3BhdGg+PC9zdmc+", "sizes": "192x192", "type": "image/svg+xml", "purpose": "any maskable" },
                { "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgM2g2YTRgMCAwIDEgNCA0djE0YTMgMyAwIDAgMC0zLTNIMnoiPjwvcGF0aD48cGF0aCBkPSJNMjIgM2gtNmEtNCA0IDAgMCAwLTQgNHYxNGEzIDMgMCAwIDEgMy0zaDdaIj48L3BhdGg+PC9zdmc+", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable" }
            ]
        };
        const manifestString = JSON.stringify(manifestJSON);
        const manifestBlob = new Blob([manifestString], {type: 'application/manifest+json;charset=utf-8'});
        const manifestUrl = URL.createObjectURL(manifestBlob);
        const manifestLink = document.getElementById('manifest-link');
        if (manifestLink) manifestLink.href = manifestUrl;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(reg => console.info('ServiceWorker activo:', reg.scope))
                .catch(err => console.error('Fallo ServiceWorker:', err));
        }
    } catch (err) { console.warn("PWA Init falló", err); }
};

// --------------- Funciones de navegación global ---------------
window.setView = (v) => { state.ui.view = v; state.ui.searchQuery = ""; state.ui.activeStudentId = null; save(); render(); };
window.setTerm = (t) => { state.ui.termKey = t; state.ui.selectedMonthIdx = null; save(); render(); };
window.setMonth = (m) => { state.ui.selectedMonthIdx = m; save(); render(); };
window.changeCourse = (v) => {
    if (v === "NEW") {
        ModalCourse();
    } else {
        state.ui.activeCourseId = v;
        state.ui.searchQuery = "";
        save(); render();
    }
};
window.updateSetting = (key, val) => { const num = parseFloat(val); if (!isNaN(num)) { state.settings[key] = num; save(); notify("Ajuste guardado", "success"); } };
window.toggleDarkMode = () => { state.ui.darkMode = !state.ui.darkMode; save(); render(true); };
window.debounceSearch = (val, event) => {
    if (event && event.target) lastFocusedInputId = event.target.id;
    state.ui.searchQuery = val;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { save(); render(); if (lastFocusedInputId) { const inp = document.getElementById(lastFocusedInputId); if (inp) { inp.focus(); inp.selectionStart = inp.selectionEnd = inp.value.length; } } }, 300);
};
window.openStudentFile = (sId) => { state.ui.activeStudentId = sId; state.ui.modalTab = 'ficha'; save(); render(); };
window.setModalTab = (t) => { state.ui.modalTab = t; save(); render(); };

// Sidebar toggle
window.toggleSidebar = (force) => {
    if (typeof force === 'boolean') state.ui.sidebarOpen = force;
    else state.ui.sidebarOpen = !state.ui.sidebarOpen;
    save();
    render();
};

// --------------- Eventos de teclado (ESC) ---------------
document.addEventListener('keydown', (e) => {
    try {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal-overlay');
            if (openModals.length > 0) {
                openModals.forEach(modal => {
                    modal.classList.remove('fade-enter');
                    modal.style.opacity = '0';
                    setTimeout(() => { if (modal && modal.parentNode) modal.parentNode.removeChild(modal); }, 250);
                });
            } else if (state && state.ui && state.ui.activeStudentId) {
                state.ui.activeStudentId = null;
                save();
                render();
            } else if (state && state.ui && state.ui.sidebarOpen && window.innerWidth <= 768) {
                toggleSidebar(false);
            }
        }
    } catch (error) { console.error("Error en Escape Listener:", error); }
});

// --------------- Eventos de resize y click para sidebar ---------------
window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && state && state.ui && state.ui.sidebarOpen) {
        state.ui.sidebarOpen = false;
        save(); render();
    }
});

document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        const sb = document.getElementById('sidebar-container');
        const backdrop = document.getElementById('sidebar-backdrop');
        if (sb && backdrop && state && state.ui && state.ui.sidebarOpen) {
            if (!sb.contains(e.target) && e.target.id !== 'hamburger-btn' && !e.target.closest('#hamburger-btn')) {
                toggleSidebar(false);
            }
        }
    }
});

// --------------- Boot ---------------
window.boot = async () => {
    try {
        // Inicializar estado con valores por defecto
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));

        // Cargar estado desde IndexedDB
        const dbState = await loadStateFromDB();
        if (dbState) {
            state = { ...state, ...dbState };
            state.ui = { ...state.ui, ...(dbState.ui || {}) };
            state.settings = { ...state.settings, ...(dbState.settings || {}) };
            ['courses','students','attendance','grades','classLogs','tasks','notes','intensification','finalGrades','planning'].forEach(k => {
                if (!Array.isArray(state[k])) state[k] = [];
            });
        }

        if (state.ui.darkMode === null) state.ui.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        requestNotificationPermission();
        initPWA();

        // Verificar token de Google
        // Intentar obtener token de localStorage primero (viene de login.html)
const token = localStorage.getItem('docenteos_google_token') || state.settings.googleAuthToken;
if (token) {
    // Guardarlo también en el estado de la app
    state.settings.googleAuthToken = token;
    save();
}
        if (token) {
            accessToken = token;
            const valid = await window.isTokenValid();
            if (valid) {
                // Token válido: cerrar loading, restaurar backup, iniciar app
                document.getElementById('loading').style.display = 'flex';
                await initDriveBackup();
                startAutoBackupToDrive();
                document.getElementById('loading').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('app-layout').classList.remove('hidden');
                    render(true);
                    if (window.innerWidth <= 768) {
                        state.ui.sidebarOpen = false;
                        render();
                    }
                }, 700);
            } else {
                // Token inválido: limpiar y redirigir al login
                accessToken = null;
                state.settings.googleAuthToken = '';
                save();
                window.location.href = 'login.html';
            }
        } else {
            // No hay token: redirigir al login
            window.location.href = 'login.html';
        }

        // Fix de clics (fase de captura)
        document.addEventListener('click', function(e) {
            const btn = e.target.closest('button[onclick]');
            if (btn) {
                const code = btn.getAttribute('onclick');
                if (code) {
                    e.stopPropagation();
                    e.preventDefault();
                    try {
                        (new Function(code)).call(window);
                    } catch (err) {
                        console.error('Error ejecutando onclick:', code, err);
                    }
                }
            }
        }, true);

        setTimeout(() => {
            checkUpcomingTasks();
        }, 2000);

    } catch (error) {
        console.error("ERROR FATAL:", error);
        const loading = document.getElementById("loading");
        if (loading) loading.innerHTML = `<div class="bg-white p-8 text-center text-rose-500 font-bold">Error crítico: ${error.message}</div>`;
    }
};

window.addEventListener('DOMContentLoaded', () => { boot(); });