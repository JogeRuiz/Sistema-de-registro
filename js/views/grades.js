// js/views/grades.js
// Vista de calificaciones con Liquid Glass

const GradesView = () => {
    const courseId = state.ui.activeCourseId;
    const monthIndex = state.ui.selectedMonthIdx;
    const termId = state.ui.termKey;
    const students = getStudents(courseId);
    const allGrades = state.grades.filter(g => g.term === termId && g.courseId === courseId && !g.isIntensification);
    const course = state.courses.find(c => c.id === courseId);
    const categories = course?.categories || [];

    const monthBtns = TERMS_CONFIG[termId].months.map(m => {
        const active = m === monthIndex;
        const cls = active ? 'bg-white dark:bg-slate-700 text-apple-blue dark:text-sky-400 shadow-md ring-1 ring-black/5 dark:ring-white/10 scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50';
        return `<button onclick="setMonth(${m})" class="px-5 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${cls}">${MONTH_NAMES[m].substring(0,3)}</button>`;
    }).join("");

    let rows = "";
    if (students.length === 0) {
        rows = `<tr><td colspan="4" class="p-20 text-center"><i data-lucide="folder-search" class="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4"></i><h3 class="text-2xl font-black text-slate-400 dark:text-slate-500">Base de Datos Limpia</h3><p class="text-slate-500 font-medium">Inscribe alumnos en el directorio para evaluar.</p></td></tr>`;
    } else {
        rows = students.map(s => {
            const avgLocal = calcGrade(termId, courseId, s.id, [monthIndex]);
            const evals = allGrades.filter(g => g.studentId === s.id && g.date && (parseInt(g.date.split("-")[1],10)-1) === monthIndex);
            let cards = "";
            if (evals.length === 0) {
                cards = `<span class="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60 bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">Sin Prácticos Registrados</span>`;
            } else {
                cards = evals.map(g => {
                    const score = (g.score !== null && g.score !== "") ? parseFloat(g.score) : null;
                    const color = score !== null ? getScoreColor(score) : 'text-slate-300 dark:text-slate-600';
                    const badge = g.noEntregado ? `<span class="bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-400 text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest ring-1 ring-rose-200 dark:ring-rose-800">No Entregó</span>` : `<span class="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400 text-[9px] px-2 py-1 rounded-md font-black uppercase tracking-widest ring-1 ring-emerald-200 dark:ring-emerald-800">Entregado</span>`;
                    const evalType = g.evaluationType ? `<div class="text-[8px] uppercase tracking-widest text-indigo-500 font-bold">${escapeHtml(g.evaluationType)}</div>` : '';
                    const syncBtn = (course && course.classroomCourseId && g.classroomCourseWorkId) ?
                        `<button onclick="syncGradeToClassroom('${s.id}','${g.id}')" class="text-[10px] bg-blue-500/20 hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md transition" title="Sincronizar nota con Classroom"><i data-lucide="cloud" class="w-3 h-3 inline"></i></button>` : '';
                    return `<div class="p-4 border border-white/80 dark:border-slate-700/80 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-[20px] cursor-pointer hover:border-apple-blue dark:hover:border-apple-blue hover:shadow-xl hover:-translate-y-1 transition-all duration-300 min-w-[160px] flex flex-col justify-between group ring-1 ring-black/5 dark:ring-white/5 h-auto min-h-[90px]" onclick="loadGradeToEdit('${s.id}','${escapeHtml(s.name)}','${g.id}')">${evalType}<span class="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 truncate w-full block mb-2 group-hover:text-apple-blue transition-colors" title="${escapeHtml(g.title)}">${escapeHtml(g.title)}</span><div class="flex items-center justify-between mt-auto gap-2 flex-wrap"><span class="font-black text-3xl leading-none tracking-tighter ${color} drop-shadow-sm">${score !== null ? score : '—'}</span><div class="flex items-center">${badge} ${syncBtn}</div></div></div>`;
                }).join("");
            }

            const avgDisplay = avgLocal ? `<div class="inline-flex items-center justify-center px-5 py-3 bg-white dark:bg-slate-800 rounded-2xl font-black text-2xl tracking-tighter shadow-md border border-slate-100 dark:border-slate-700 ring-1 ring-black/5 ${getScoreColor(avgLocal)}">${avgLocal}</div>` : `<span class="text-slate-300 dark:text-slate-600 font-black text-2xl">—</span>`;

            return `<tr class="hover:bg-white/40 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200/50 dark:border-slate-800 group"><td class="p-5 w-64 md:w-80"><div class="flex items-center gap-5"><div class="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex shrink-0 items-center justify-center font-black text-xl text-slate-500 dark:text-slate-300 shadow-inner ring-2 ring-white dark:ring-slate-600 group-hover:text-apple-blue transition-colors">${s.name.charAt(0)}</div><span class="font-black text-slate-900 dark:text-white text-lg tracking-tight">${escapeHtml(s.name)}</span></div></td><td class="p-5"><div class="flex flex-wrap gap-4 items-center">${cards}</div></td><td class="p-5 text-center w-36">${avgDisplay}</td><td class="p-5 text-right w-28 no-print"><button onclick="ModalGrade('${s.id}','${escapeHtml(s.name)}')" class="w-14 h-14 rounded-[20px] bg-apple-blue text-white flex items-center justify-center hover:bg-sky-600 hover:scale-110 hover:rotate-3 transition-all duration-300 shadow-xl shadow-sky-500/30 ml-auto border border-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/40"><i data-lucide="plus" class="w-7 h-7"></i></button></td></tr>`;
        }).join("");
    }

    return `
    <div class="max-w-full flex flex-col h-[calc(100vh-8rem)]">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 shrink-0">
            <div><h2 class="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Mesa de Calificaciones</h2><div class="flex items-center gap-3"><span class="text-slate-500 font-black text-lg uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">${MONTH_NAMES[monthIndex]}</span>${categories.length ? `<span class="text-xs font-bold text-purple-500 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-lg">${categories.length} categorías</span>` : ''}</div></div>
            <div class="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                <div class="relative w-full sm:w-64"><i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i><input id="search-grades" type="text" value="${escapeHtml(state.ui.searchQuery)}" oninput="debounceSearch(this.value, event)" placeholder="Buscar alumno..." class="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold border-none shadow-sm focus:ring-2 focus:ring-apple-blue bg-white/80 dark:bg-slate-800/80 backdrop-blur-md"></div>
                <div class="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-white/50 dark:border-slate-700 shadow-inner w-full sm:w-auto overflow-x-auto custom-scrollbar">${monthBtns}</div>
            </div>
        </div>
        <div class="lg-panel overflow-hidden flex-1 flex flex-col relative">
            <div class="lg-specular"></div>
            <div class="lg-content !p-0 flex-1 flex flex-col">
                <div class="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative bg-white/20 dark:bg-slate-900/20 save-scroll" data-scroll-key="grades-table">
                    <table class="w-full text-left">
                        <thead class="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <tr><th class="p-6 font-black text-[11px] tracking-[0.2em] uppercase text-slate-400 w-64 md:w-80">Nómina Oficial</th><th class="p-6 font-black text-[11px] tracking-[0.2em] uppercase text-slate-400">Expediente de Entregas (TPs)</th><th class="p-6 font-black text-[11px] tracking-[0.2em] uppercase text-slate-400 text-center w-36">Subtotal Mes</th><th class="p-6 w-28 no-print"></th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200/40 dark:divide-slate-700/40">${rows}</tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>`;
};