// js/views/students.js
const StudentsDirectoryView = () => {
    const courseId = state.ui.activeCourseId;
    const students = getStudents(courseId);
    const term = state.ui.termKey;

    let cards = "";
    if (students.length === 0) {
        cards = `<div class="lg-panel col-span-full p-0 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-none bg-transparent">
            <div class="lg-specular"></div>
            <div class="lg-content flex flex-col items-center justify-center p-20">
                <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-slate-200 dark:ring-slate-700"><i data-lucide="user-plus" class="w-10 h-10 text-slate-400"></i></div>
                <h3 class="text-3xl font-black text-slate-700 dark:text-slate-300 mb-3 tracking-tight">Directorio Vacío</h3>
                <p class="text-slate-500 font-medium mb-8 text-lg">Aún no has inscripto a nadie en esta materia.</p>
                <button onclick="ModalStudentAdd()" class="px-8 py-4 bg-apple-blue text-white rounded-2xl font-black text-lg hover:bg-sky-600 transition-all shadow-xl shadow-sky-500/30 hover:-translate-y-1">Matricular Primer Alumno</button>
            </div>
        </div>`;
    } else {
        cards = students.map(s => {
            const att = calcAtt(term, courseId, s.id);
            const avg = calcGrade(term, courseId, s.id);
            const risk = att.pct < state.settings.attendanceMin;
            const border = risk ? 'border-l-[6px] border-l-rose-500 ring-1 ring-rose-500/20' : 'border-l-[6px] border-l-transparent border border-white/60 dark:border-slate-700/50 hover:border-l-apple-blue';
            return `<div class="lg-panel p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 hover:scale-[1.02] transition-all duration-300 ease-out bg-white/50 dark:bg-black/20 group ${border} max-w-full overflow-hidden">
                <div class="lg-specular"></div>
                <div class="lg-content flex-1 w-full p-6 sm:p-8">
                    <div class="flex items-center gap-6 flex-1 w-full min-w-0">
                        <div class="w-20 h-20 bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-full flex shrink-0 items-center justify-center font-black text-3xl text-slate-400 dark:text-slate-300 shadow-lg ring-4 ring-white dark:ring-slate-900 group-hover:text-apple-blue transition-colors">${s.name.charAt(0)}</div>
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-3 mb-2">
                                <span class="font-black text-2xl text-slate-900 dark:text-white truncate block tracking-tight" title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</span>
                                <button onclick="editStudent('${s.id}')" class="p-2 text-slate-400 hover:text-apple-blue hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100 ring-1 ring-slate-200 dark:ring-slate-700" title="Corregir Identidad"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                            </div>
                            <div class="flex flex-wrap items-center gap-3">
                                <div class="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><i data-lucide="calendar" class="w-4 h-4 text-slate-400"></i><span class="text-[11px] font-black uppercase tracking-widest ${risk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}">Asistencia: ${att.pct}%</span></div>
                                <div class="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"><i data-lucide="award" class="w-4 h-4 text-slate-400"></i><span class="text-[11px] font-black uppercase tracking-widest ${avg ? getScoreColor(avg) : 'text-slate-400'}">Promedio: ${avg || 'S/C'}</span></div>
                                ${s.observations ? `<div class="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg border border-purple-200 dark:border-purple-800"><i data-lucide="message-circle" class="w-4 h-4 text-purple-500"></i><span class="text-[10px] font-black text-purple-600 dark:text-purple-400 truncate max-w-[100px]" title="${escapeHtml(s.observations)}">${escapeHtml(s.observations.substring(0,20))}${s.observations.length>20?'...':''}</span></div>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex sm:flex-col gap-3 shrink-0 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-200/50 dark:border-slate-700/50 mt-4 sm:mt-0">
                        <button onclick="openStudentFile('${s.id}')" class="flex-1 sm:flex-none px-6 py-3.5 bg-apple-blue text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2"><i data-lucide="folder-open" class="w-4 h-4"></i> Legajo Central</button>
                        <button onclick="deleteStudent('${s.id}')" class="flex-1 sm:flex-none px-6 py-3.5 bg-white dark:bg-slate-800 text-rose-500 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all shadow-sm flex items-center justify-center gap-2"><i data-lucide="user-minus" class="w-4 h-4"></i> Eliminar</button>
                    </div>
                </div>
            </div>`;
        }).join("");
    }

    return `
    <div class="max-w-6xl mx-auto pb-16">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div><h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Directorio Escolar</h2><p class="text-slate-500 font-bold text-xl flex items-center gap-2"><span class="bg-apple-blue/10 text-apple-blue dark:bg-sky-500/20 dark:text-sky-400 px-2 py-0.5 rounded-md">${students.length}</span> Legajos Activos</p></div>
            <div class="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                <div class="relative w-full sm:w-72"><i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"></i><input id="search-students" type="text" value="${escapeHtml(state.ui.searchQuery)}" oninput="debounceSearch(this.value, event)" placeholder="Buscar por apellido..." class="w-full pl-12 pr-4 py-4 rounded-2xl text-base font-bold border-none shadow-sm focus:ring-4 focus:ring-apple-blue/30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md"></div>
                <button onclick="ModalStudentAdd()" class="w-full sm:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 ring-2 ring-slate-900/10 dark:ring-white/10"><i data-lucide="user-plus" class="w-5 h-5"></i> Inscribir</button>
            </div>
        </header>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 save-scroll" data-scroll-key="students-list">${cards}</div>
    </div>`;
};
