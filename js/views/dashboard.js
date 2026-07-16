// js/views/dashboard.js
const DashboardView = () => {
    const courseId = state.ui.activeCourseId;
    const courseData = state.courses.find(x => x.id === courseId);
    
    if (!courseData) {
        return `
        <div class="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-20 px-6">
            <div class="relative w-40 h-40 mb-12 group">
                <div class="absolute inset-0 bg-apple-blue blur-[40px] opacity-30 rounded-full group-hover:opacity-50 transition-opacity duration-700"></div>
                <div class="relative w-full h-full bg-gradient-to-br from-sky-400 to-apple-blue rounded-[40px] flex items-center justify-center shadow-2xl shadow-sky-500/40 border-4 border-white dark:border-slate-800 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <i data-lucide="waves" class="w-20 h-20 text-white stroke-[1.5]"></i>
                </div>
            </div>
            <h2 class="text-6xl font-black tracking-tighter mb-6 text-slate-900 dark:text-white drop-shadow-sm">
                Aqua <span class="text-accent">Liquid</span>
            </h2>
            <p class="text-slate-500 dark:text-slate-400 text-xl font-medium mb-12 max-w-lg">
                El motor relacional ha sido inicializado. Selecciona un espacio en el menú izquierdo o configura una nueva clase.
            </p>
            <button onclick="ModalCourse()" class="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[20px] font-black text-lg shadow-2xl hover:scale-105 hover:-translate-y-1 transition-all flex items-center gap-3">
                <i data-lucide="folder-plus" class="w-6 h-6"></i> Crear Primera Materia
            </button>
        </div>
        `;
    }

    const studentsList = getStudents(courseData.id);
    const currentTerm = state.ui.termKey;
    
    let accumulatedPresents = 0, accumulatedTotalClasses = 0, countValidGrades = 0, sumValidGrades = 0, riskCounter = 0;
    
    studentsList.forEach(student => {
        const attData = calcAtt(currentTerm, courseData.id, student.id);
        accumulatedPresents += attData.present + (attData.late * state.settings.lateWeight);
        accumulatedTotalClasses += attData.total;
        if (attData.pct < state.settings.attendanceMin) riskCounter++;
        
        const gradeOutput = calcGrade(currentTerm, courseData.id, student.id);
        if (gradeOutput !== null && gradeOutput !== undefined) { countValidGrades++; sumValidGrades += parseFloat(gradeOutput); }
    });
    
    const masterAttendance = accumulatedTotalClasses > 0 ? Math.round((accumulatedPresents / accumulatedTotalClasses) * 100) : 100;
    const masterGrade = countValidGrades > 0 ? (sumValidGrades / countValidGrades).toFixed(2) : null;
    
    return `
    <div class="max-w-7xl mx-auto pb-16">
        <header class="mb-14 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
            <div class="absolute -top-20 -left-20 w-64 h-64 bg-sky-200/40 dark:bg-sky-900/20 blur-3xl rounded-full pointer-events-none"></div>
            <div class="relative z-10">
                <h1 class="text-5xl md:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-4">${escapeHtml(courseData.name)}</h1>
                <div class="flex flex-wrap items-center gap-3">
                    <span class="px-4 py-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl text-sm font-black text-slate-500 shadow-sm border border-slate-200 dark:border-slate-700 uppercase tracking-widest flex items-center gap-2">
                        <i data-lucide="tag" class="w-3.5 h-3.5"></i> ${escapeHtml(courseData.section || 'General')}
                    </span>
                    <span class="text-lg font-black text-accent tracking-wide">• ${TERMS_CONFIG[currentTerm].label}</span>
                </div>
            </div>
            <div class="flex gap-3 relative z-10 shrink-0">
                <button onclick="editCourseFull('${courseData.id}')" class="p-4 text-slate-500 hover:text-apple-blue bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[18px] transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 group" title="Editar horarios y días">
                    <i data-lucide="calendar-clock" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                </button>
                <button onclick="editCategories('${courseData.id}')" class="p-4 text-slate-500 hover:text-purple-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[18px] transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 group" title="Categorías de evaluación">
                    <i data-lucide="tags" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                </button>
                <button onclick="deleteCourse('${courseData.id}')" class="p-4 text-slate-500 hover:text-rose-500 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[18px] transition-all shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 group" title="Eliminar materia">
                    <i data-lucide="trash-2" class="w-6 h-6 group-hover:scale-110 transition-transform"></i>
                </button>
            </div>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
            <!-- Tarjeta 1: Total alumnos -->
            <div class="lg-panel">
                <div class="lg-specular"></div>
                <div class="lg-content">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-sky-100 dark:bg-sky-900/50 rounded-xl flex items-center justify-center text-apple-blue ring-1 ring-sky-200 dark:ring-sky-800"><i data-lucide="users-2" class="w-5 h-5"></i></div>
                        <span class="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</span>
                    </div>
                    <div class="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">${studentsList.length}</div>
                    <div class="text-sm font-bold text-slate-500">Alumnos en Nómina</div>
                </div>
            </div>

            <!-- Tarjeta 2: Asistencia -->
            <div class="lg-panel border-b-4 border-b-emerald-500">
                <div class="lg-specular"></div>
                <div class="lg-content">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800"><i data-lucide="check-circle" class="w-5 h-5"></i></div>
                        <span class="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-500">Global</span>
                    </div>
                    <div class="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">${masterAttendance}%</div>
                    <div class="h-1.5 w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner"><div class="h-full bg-emerald-500 transition-all duration-1000 ease-out" style="width: ${masterAttendance}%"></div></div>
                </div>
            </div>

            <!-- Tarjeta 3: Calificación media -->
            <div class="lg-panel border-b-4 border-b-amber-500">
                <div class="lg-specular"></div>
                <div class="lg-content">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-amber-100 dark:bg-amber-900/50 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800"><i data-lucide="graduation-cap" class="w-5 h-5"></i></div>
                        <span class="font-black text-[10px] uppercase tracking-[0.2em] text-amber-500">Clase</span>
                    </div>
                    <div class="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">${masterGrade || "—"}</div>
                    <div class="text-sm font-bold text-slate-500">Calificación Media</div>
                </div>
            </div>

            <!-- Tarjeta 4: Riesgo -->
            <div class="lg-panel border-b-4 border-b-rose-500">
                <div class="lg-specular"></div>
                <div class="lg-content">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-rose-100 dark:bg-rose-900/50 rounded-xl flex items-center justify-center text-rose-600 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800"><i data-lucide="siren" class="w-5 h-5"></i></div>
                        <span class="font-black text-[10px] uppercase tracking-[0.2em] text-rose-500">Riesgo</span>
                    </div>
                    <div class="text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">${riskCounter}</div>
                    <div class="text-sm font-bold text-slate-500">Ausentismo (<${state.settings.attendanceMin}%)</div>
                </div>
            </div>
        </div>

        <!-- Gráfico y botones de acceso rápido -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
            <div class="lg-panel col-span-1 flex flex-col justify-between">
                <div class="lg-specular"></div>
                <div class="lg-content">
                    <div class="mb-8">
                        <h3 class="font-black text-2xl text-slate-900 dark:text-white tracking-tight">Trayectorias</h3>
                        <p class="text-sm text-slate-500 font-bold mt-1">Algoritmo predictivo de evaluación</p>
                    </div>
                    <div class="relative w-full aspect-square max-h-[260px] flex justify-center items-center mx-auto mb-8 drop-shadow-xl"><canvas id="gradingChart"></canvas></div>
                    <div class="grid grid-cols-3 gap-3 text-center bg-white/50 dark:bg-black/20 p-4 rounded-2xl border border-white/50 dark:border-slate-700/50">
                        <div class="flex flex-col items-center"><div class="w-4 h-4 bg-emerald-500 rounded-full mb-2 shadow-sm shadow-emerald-500/50 ring-2 ring-white dark:ring-slate-800"></div><div class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">TTA</div></div>
                        <div class="flex flex-col items-center"><div class="w-4 h-4 bg-amber-500 rounded-full mb-2 shadow-sm shadow-amber-500/50 ring-2 ring-white dark:ring-slate-800"></div><div class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">TED</div></div>
                        <div class="flex flex-col items-center"><div class="w-4 h-4 bg-rose-500 rounded-full mb-2 shadow-sm shadow-rose-500/50 ring-2 ring-white dark:ring-slate-800"></div><div class="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">TEP</div></div>
                    </div>
                </div>
            </div>
            
            <div class="col-span-1 lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 h-full">
                <button onclick="setView('attendance')" class="lg-panel text-left hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-center h-full border-t-8 border-t-apple-blue">
                    <div class="lg-specular"></div>
                    <div class="lg-content">
                        <div class="w-16 h-16 bg-sky-100 dark:bg-sky-900/50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-sky-200 dark:border-sky-800 ring-4 ring-white/50 dark:ring-black/20"><i data-lucide="check-square" class="w-8 h-8 text-apple-blue dark:text-sky-400"></i></div>
                        <h2 class="font-black text-3xl mb-3 text-slate-900 dark:text-white group-hover:text-apple-blue transition-colors tracking-tight">Tomar Asistencia</h2>
                        <p class="text-slate-500 font-semibold text-base leading-relaxed max-w-[90%]">Abre la grilla mensual para registrar presentes, ausentes y cómputos de llegadas tarde.</p>
                        <div class="mt-8 flex items-center gap-2 text-apple-blue font-black uppercase text-xs tracking-widest opacity-0 translate-x-[-20px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">Acceder <i data-lucide="arrow-right" class="w-4 h-4"></i></div>
                    </div>
                </button>
                
                <button onclick="setView('grades')" class="lg-panel text-left hover:-translate-y-2 transition-all duration-300 group flex flex-col justify-center h-full border-t-8 border-t-emerald-500">
                    <div class="lg-specular"></div>
                    <div class="lg-content">
                        <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-8 shadow-sm border border-emerald-200 dark:border-emerald-800 ring-4 ring-white/50 dark:ring-black/20"><i data-lucide="pen-tool" class="w-8 h-8 text-emerald-600 dark:text-emerald-400"></i></div>
                        <h2 class="font-black text-3xl mb-3 text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors tracking-tight">Cargar Notas</h2>
                        <p class="text-slate-500 font-semibold text-base leading-relaxed max-w-[90%]">Ingresa calificaciones conceptuales o numéricas de TP, parciales y exposiciones.</p>
                        <div class="mt-8 flex items-center gap-2 text-emerald-500 font-black uppercase text-xs tracking-widest opacity-0 translate-x-[-20px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">Acceder <i data-lucide="arrow-right" class="w-4 h-4"></i></div>
                    </div>
                </button>
            </div>
        </div>
    </div>
    `;
};

function initDashboardChart() {
    // (sin cambios)
    try {
        const canvas = document.getElementById('gradingChart');
        if (!canvas) return;
        const cId = state.ui.activeCourseId;
        const termStr = state.ui.termKey;
        if (!cId) return;
        let tta=0, ted=0, tep=0, sc=0;
        getStudents(cId).forEach(s => {
            const g = calcGrade(termStr, cId, s.id);
            if (g !== null) {
                const n = parseFloat(g);
                if (n >= state.settings.gradeTtaMin) tta++;
                else if (n >= state.settings.gradeTedMin) ted++;
                else tep++;
            } else sc++;
        });
        if (chartInstance) chartInstance.destroy();
        const total = tta+ted+tep+sc;
        const data = total > 0 ? [tta, ted, tep, sc] : [1];
        const colors = total > 0 ? ['#10b981','#f59e0b','#f43f5e','#94a3b8'] : ['#e2e8f0'];
        const labels = total > 0 ? ['Avanzado (TTA)','En Proceso (TED)','En Riesgo (TEP)','Sin Datos'] : ['Sin Inscripciones'];
        chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8, borderRadius: 4 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '78%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true, backgroundColor: 'rgba(15,23,42,0.95)',
                        titleFont: { family:"system-ui", size:12, weight:'bold' },
                        bodyFont: { family:"system-ui", size:14, weight:'bold' },
                        padding: 14, cornerRadius: 16, displayColors: true, boxPadding: 6,
                        callbacks: {
                            label: function(ctx) {
                                if (!total) return ' Materia Vacía';
                                const label = ctx.label || '';
                                const val = ctx.parsed || 0;
                                const pct = Math.round((val/total)*100);
                                return ` ${label}: ${val} (${pct}%)`;
                            }
                        }
                    }
                },
                animation: { animateScale: true, animateRotate: true, duration: 1200, easing: 'easeOutExpo' }
            }
        });
    } catch (e) { console.error("Chart error:", e); }
}