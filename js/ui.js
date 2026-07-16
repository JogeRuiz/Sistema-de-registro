// js/ui.js
// Motor de UI: renderizado, enrutador y sidebar

function render(forceSidebarUpdate = false) {
    try {
        const scrollStates = new Map();
        const scrollContainers = document.querySelectorAll('.save-scroll');
        scrollContainers.forEach(el => {
            const key = el.dataset.scrollKey || el.className;
            scrollStates.set(key, el.scrollTop);
        });

        const mainScroll = document.getElementById('main-scroll-container');
        const mainScrollTop = mainScroll ? mainScroll.scrollTop : 0;

        const viewChanged = (state.ui.view !== lastView);
        lastView = state.ui.view;

        if (state.ui.darkMode === null) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            state.ui.darkMode = prefersDark;
        }
        if (state.ui.darkMode) document.body.classList.add('dark');
        else document.body.classList.remove('dark');

        if (state.ui.view !== "dashboard" && state.ui.view !== "settings" && state.ui.selectedMonthIdx === null) {
            const currentMonth = new Date().getMonth();
            const validMonths = TERMS_CONFIG[state.ui.termKey].months;
            state.ui.selectedMonthIdx = validMonths.includes(currentMonth) ? currentMonth : validMonths[0];
        }

        const sidebar = document.getElementById("sidebar-container");
        if (sidebar) sidebar.innerHTML = SidebarComponent();

        const main = document.getElementById("content-area");
        if (!main) return;
        main.classList.remove("fade-enter");
        void main.offsetWidth;
        main.classList.add("fade-enter");

        if (state.ui.activeStudentId) {
            main.innerHTML = StudentModalComponent();
        } else {
            main.innerHTML = ContentRouter();
        }

        if (state.ui.view === 'dashboard' && !state.ui.activeStudentId) {
            setTimeout(initDashboardChart, 80);
        }
        if (state.ui.view === 'files' && !state.ui.activeStudentId) {
            setTimeout(initFilesView, 100);
        }

        if (window.lucide) lucide.createIcons();

        if (lastFocusedInputId) {
            const inp = document.getElementById(lastFocusedInputId);
            if (inp) { inp.focus(); inp.selectionStart = inp.selectionEnd = inp.value.length; }
        }

        if (window.innerWidth <= 768) {
            const sb = document.getElementById('sidebar-container');
            const backdrop = document.getElementById('sidebar-backdrop');
            if (state.ui.sidebarOpen) {
                sb.classList.add('open');
                backdrop.classList.add('active');
            } else {
                sb.classList.remove('open');
                backdrop.classList.remove('active');
            }
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (mainScroll && !viewChanged) {
                    mainScroll.scrollTop = mainScrollTop;
                } else if (mainScroll && viewChanged) {
                    mainScroll.scrollTop = 0;
                }
                const newScrollContainers = document.querySelectorAll('.save-scroll');
                newScrollContainers.forEach(el => {
                    const key = el.dataset.scrollKey || el.className;
                    if (scrollStates.has(key)) {
                        el.scrollTop = scrollStates.get(key);
                    }
                });
            });
        });

    } catch (error) { notify("Fallo en la carga de la interfaz", "error"); }
}

const ContentRouter = () => {
    const needCourse = ["attendance", "grades", "students", "logbook", "intensification", "notes", "planning"];
    if (!state.ui.activeCourseId && needCourse.includes(state.ui.view)) {
        state.ui.view = 'dashboard';
    }
    switch (state.ui.view) {
        case 'dashboard': return DashboardView();
        case 'attendance': return AttendanceView();
        case 'grades': return GradesView();
        case 'students': return StudentsDirectoryView();
        case 'agenda': return AgendaView();
        case 'logbook': return LogbookView();
        case 'notes': return NotesView();
        case 'settings': return SettingsView();
        case 'intensification': return IntensificationView();
        case 'planning': return PlanningView();
        case 'files': return FilesView();
        default: return DashboardView();
    }
};

const SidebarComponent = () => {
    const selectOptions = state.courses.map(c => {
        const sel = c.id === state.ui.activeCourseId ? 'selected' : '';
        return `<option value="${c.id}" ${sel}>${escapeHtml(c.name)}</option>`;
    }).join("");

    const terms = Object.keys(TERMS_CONFIG).map(k => {
        const active = state.ui.termKey === k;
        const cls = active ? 'bg-white dark:bg-slate-700 shadow-sm text-apple-blue dark:text-sky-400 scale-100 ring-1 ring-slate-200/50 dark:ring-black/20' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5';
        return `<button onclick="setTerm('${k}')" class="flex-1 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 rounded-xl ${cls}">${k}</button>`;
    }).join("");

    return `
    <aside class="w-72 h-full flex flex-col p-6 shadow-sm relative z-20 overflow-hidden" style="background: var(--lg-sidebar-bg); backdrop-filter: blur(40px) saturate(180%); border-right: 1px solid var(--lg-sidebar-border);">
        <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-sky-100/50 dark:from-sky-900/20 to-transparent pointer-events-none"></div>
        <div class="mb-6 flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3">
                <div class="w-11 h-11 bg-apple-blue rounded-[14px] flex items-center justify-center shadow-lg shadow-sky-500/30 ring-2 ring-white/30 dark:ring-white/10">
                    <i data-lucide="droplets" class="text-white w-6 h-6"></i>
                </div>
                <div>
                    <span class="block font-black tracking-tight text-xl text-slate-900 dark:text-white leading-none mb-0.5">DocenteOS</span>
                    <span class="block text-[9px] uppercase font-bold text-slate-400 tracking-widest leading-none">Motor V9.5 Pro</span>
                </div>
            </div>
            <button onclick="toggleDarkMode()" class="p-2.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all duration-300 no-print focus:outline-none shadow-sm border border-slate-200 dark:border-slate-700 hover:scale-110" title="Cambiar Tema">
                <i data-lucide="${state.ui.darkMode ? 'sun' : 'moon'}" class="w-4 h-4 text-slate-500 dark:text-slate-300"></i>
            </button>
        </div>
        
        <div class="mb-6 relative z-10">
            <label class="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2 pl-1">Espacio Curricular</label>
            <div class="relative group">
                <select onchange="changeCourse(this.value)" class="w-full p-4 pl-4 pr-10 appearance-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-700 rounded-2xl text-sm font-bold cursor-pointer shadow-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-apple-blue/20 transition-all text-ellipsis">
                    <option value="">Seleccionar Materia...</option>
                    ${selectOptions}
                    <option disabled>──────────</option>
                    <option value="NEW" class="text-apple-blue font-bold">+ Crear Nueva Materia</option>
                </select>
                <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                    <i data-lucide="chevrons-up-down" class="w-4 h-4"></i>
                </div>
            </div>
        </div>

        <div class="mb-8 relative z-10">
            <div class="flex p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shadow-inner">
                ${terms}
            </div>
        </div>

        <nav class="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6 relative z-10">
            <div class="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 mt-2 flex items-center gap-2">
                <div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span>Core</span><div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            </div>
            ${SidebarNavButton("dashboard", "layout-dashboard", "Resumen Ejecutivo")}
            
            <div class="h-4"></div>
            <div class="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span>Aula & Campo</span><div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            </div>
            ${SidebarNavButton("attendance", "calendar-check", "Lista de Asistencia")}
            ${SidebarNavButton("grades", "award", "Evaluación y Notas")}
            ${SidebarNavButton("logbook", "book-open-check", "Libro de Temas")}
            ${SidebarNavButton("notes", "sticky-note", "Borradores y Grupos")}
            ${SidebarNavButton("students", "users", "Directorio Alumnos")}
            ${SidebarNavButton("intensification", "flame", "Mesas de Examen")}
            ${SidebarNavButton("planning", "calendar-clock", "Planeación")}
            ${SidebarNavButton("files", "paperclip", "Archivos")}
            
            <div class="h-4"></div>
            <div class="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><span>Sistema</span><div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            </div>
            ${SidebarNavButton("agenda", "calendar-clock", "Agenda Escolar")}
            ${SidebarNavButton("settings", "settings-2", "Ajustes y Backup")}
        </nav>
    </aside>
    `;
};

const SidebarNavButton = (viewId, iconName, labelText) => {
    const active = state.ui.view === viewId;
    const needCourse = ["attendance","grades","students","logbook","intensification","notes","planning"];
    const disabled = needCourse.includes(viewId) && !state.ui.activeCourseId;
    if (disabled) {
        return `<div class="flex items-center gap-3.5 px-4 py-3.5 text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed rounded-2xl border border-transparent"><i data-lucide="${iconName}" class="w-5 h-5"></i><span class="font-bold text-sm tracking-wide">${labelText}</span></div>`;
    }
    const bg = active ? 'sidebar-btn-active bg-apple-blue text-white shadow-lg shadow-sky-500/30' : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm hover:translate-x-1 bg-transparent';
    const iconCls = active ? 'text-white' : 'text-slate-400 group-hover:text-apple-blue transition-colors duration-300';
    return `<button onclick="setView('${viewId}')" class="group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all duration-300 ease-out font-bold text-sm border ${bg} focus:outline-none focus:ring-2 focus:ring-sky-400/50"><i data-lucide="${iconName}" class="w-5 h-5 ${iconCls}"></i><span class="tracking-wide">${labelText}</span></button>`;
};
