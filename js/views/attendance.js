// js/views/attendance.js
// Vista de asistencia mensual con Liquid Glass

const AttendanceView = () => {
    const courseId = state.ui.activeCourseId;
    const monthIndex = state.ui.selectedMonthIdx;
    const termId = state.ui.termKey;
    const course = state.courses.find(c => c.id === courseId);
    const students = getStudents(courseId);
    const dates = getDatesForMonth(course, monthIndex);
    const today = todayISO();
    const atts = state.attendance.filter(a => a.term === termId && a.courseId === courseId);
    const hash = {};
    atts.forEach(r => { if (!hash[r.studentId]) hash[r.studentId] = {}; hash[r.studentId][r.date] = r.status; });

    const monthBtns = TERMS_CONFIG[termId].months.map(m => {
        const active = m === monthIndex;
        const cls = active ? 'bg-white dark:bg-slate-700 text-apple-blue dark:text-sky-400 shadow-md ring-1 ring-black/5 dark:ring-white/10 scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50';
        return `<button onclick="setMonth(${m})" class="px-5 py-2.5 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${cls}">${MONTH_NAMES[m].substring(0,3)}</button>`;
    }).join("");

    let rows = "";
    if (students.length === 0) {
        rows = `<tr><td colspan="${dates.length+2}" class="p-16 text-center"><i data-lucide="user-x" class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"></i><p class="text-slate-500 font-bold">Padrón Vacío</p></td></tr>`;
    } else {
        rows = students.map(s => {
            const att = calcAtt(termId, courseId, s.id, [monthIndex]);
            const risk = att.pct < state.settings.attendanceMin;
            const color = risk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400';
            const cells = dates.map(d => {
                const status = hash[s.id]?.[d] || "";
                let btnClass = "bg-slate-100/50 dark:bg-slate-800/50 text-slate-400/50 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-500 border border-transparent shadow-inner scale-95 hover:scale-100";
                if (status === "P") btnClass = "bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 font-black border border-emerald-300 dark:border-emerald-600 scale-110 rotate-1";
                else if (status === "T") btnClass = "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30 font-black border border-amber-300 dark:border-amber-600 scale-110 -rotate-1";
                else if (status === "A") btnClass = "bg-gradient-to-b from-rose-400 to-rose-500 text-white shadow-lg shadow-rose-500/30 font-black border border-rose-300 dark:border-rose-600 scale-110";
                else if (status === "M") btnClass = "bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-lg shadow-sky-500/30 font-black border border-sky-300 dark:border-sky-600 scale-110";
                return `<td class="p-1 text-center border-r border-slate-200/50 dark:border-slate-700/50 min-w-[50px]"><button onclick="toggleAtt('${s.id}','${d}')" class="w-10 h-10 rounded-[14px] text-xs transition-all duration-300 cursor-pointer flex items-center justify-center mx-auto ${btnClass} focus:outline-none focus:ring-2 focus:ring-apple-blue/50">${status || "·"}</button></td>`;
            }).join("");
            return `<tr class="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors group border-b border-slate-100 dark:border-slate-800/50"><td class="p-3 font-semibold sticky left-0 z-10 border-r border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl"><div class="flex items-center gap-4"><div class="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex shrink-0 items-center justify-center font-black text-sm text-slate-500 dark:text-slate-300 shadow-inner ring-1 ring-white dark:ring-slate-600">${s.name.charAt(0)}</div><span class="truncate max-w-[140px] md:max-w-[200px] font-bold tracking-tight" title="${escapeHtml(s.name)}">${escapeHtml(s.name)}</span></div></td>${cells}<td class="p-3 text-center font-black sticky right-0 z-10 border-l border-slate-200/50 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[-2px_0_10px_rgba(0,0,0,0.03)]"><div class="${color} text-xl tracking-tighter">${att.pct}%</div></td></tr>`;
        }).join("");
    }

    const headers = dates.map(d => {
        const day = parseInt(d.split('-')[2],10);
        const isToday = d === today;
        const color = isToday ? 'text-apple-blue dark:text-sky-400' : 'text-slate-600 dark:text-slate-300';
        const bg = isToday ? 'bg-sky-50 dark:bg-sky-900/20' : '';
        return `<th class="p-3 text-center min-w-[60px] border-r border-slate-200/50 dark:border-slate-700/50 relative group ${bg}"><div class="font-black text-xl ${color} mb-1 flex flex-col items-center"><span>${day}</span>${isToday ? '<span class="text-[8px] uppercase tracking-widest text-apple-blue">Hoy</span>' : ''}</div><div class="opacity-0 group-hover:opacity-100 absolute top-0 left-0 w-full flex justify-center gap-1 transition-opacity z-50" style="margin-top:-2.5rem;"><button onclick="markAll('${d}','P')" title="Todos Presentes" class="p-1 bg-emerald-500 text-white rounded-md text-[10px] font-bold">P</button><button onclick="markAll('${d}','T')" title="Todos Tarde" class="p-1 bg-amber-400 text-white rounded-md text-[10px] font-bold">T</button><button onclick="markAll('${d}','A')" title="Todos Ausentes" class="p-1 bg-rose-500 text-white rounded-md text-[10px] font-bold">A</button><button onclick="markAll('${d}','M')" title="Todos Licencia" class="p-1 bg-sky-500 text-white rounded-md text-[10px] font-bold">M</button></div>${isToday ? `<div class="absolute bottom-0 left-0 w-full h-1.5 bg-apple-blue"></div>` : ''}</th>`;
    }).join("");

    return `
    <div class="max-w-full flex flex-col h-[calc(100vh-8rem)]">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 shrink-0">
            <div><h2 class="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Asistencia</h2><div class="flex items-center gap-3"><span class="text-slate-500 font-black text-lg uppercase tracking-widest bg-white/50 dark:bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">${MONTH_NAMES[monthIndex]}</span><span class="text-slate-400 font-bold text-sm">${dates.length} Días de Dictado</span></div></div>
            <div class="flex flex-col sm:flex-row gap-4 items-center w-full md:w-auto">
                <div class="relative w-full sm:w-64"><i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i><input id="search-att" type="text" value="${escapeHtml(state.ui.searchQuery)}" oninput="debounceSearch(this.value, event)" placeholder="Filtrar apellido..." class="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold border-none shadow-sm focus:ring-2 focus:ring-apple-blue bg-white/80 dark:bg-slate-800/80 backdrop-blur-md"></div>
                <div class="flex bg-slate-200/50 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-white/50 dark:border-slate-700 shadow-inner w-full sm:w-auto overflow-x-auto custom-scrollbar">${monthBtns}</div>
            </div>
        </div>
        <div class="lg-panel overflow-hidden flex-1 flex flex-col relative">
            <div class="lg-specular"></div>
            <div class="lg-content !p-0 flex-1 flex flex-col">
                <div class="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative bg-white/30 dark:bg-slate-900/30 save-scroll" data-scroll-key="attendance-table">
                    <table class="w-full text-left text-sm whitespace-nowrap min-w-max border-collapse">
                        <thead class="sticky top-0 z-30">
                            <tr class="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-sm">
                                <th class="p-4 sticky left-0 z-40 w-48 md:w-64 border-r border-b border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-[2px_0_10px_rgba(0,0,0,0.03)]"><span class="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Padrón Oficial</span></th>
                                ${headers}
                                <th class="p-4 text-center sticky right-0 z-40 border-l border-b border-slate-200/50 dark:border-slate-700/50 bg-white/90 dark:bg-slate-900/90 shadow-[-2px_0_10px_rgba(0,0,0,0.03)]"><span class="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Total Mensual</span></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200/30 dark:divide-slate-700/30">${rows}</tbody>
                    </table>
                </div>
                <div class="p-4 border-t border-slate-200/60 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md flex flex-wrap justify-center sm:justify-start gap-6 lg:gap-10 text-xs font-bold text-slate-600 dark:text-slate-300 z-20 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                    <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-[10px] bg-emerald-500 shadow-md shadow-emerald-500/40 flex items-center justify-center text-white font-black ring-1 ring-emerald-400">P</div> <span class="uppercase tracking-widest text-[10px]">Presente</span></div>
                    <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-[10px] bg-amber-400 shadow-md shadow-amber-400/40 flex items-center justify-center text-white font-black ring-1 ring-amber-300">T</div> <span class="uppercase tracking-widest text-[10px]">Tarde (${state.settings.lateWeight} pt)</span></div>
                    <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-[10px] bg-rose-500 shadow-md shadow-rose-500/40 flex items-center justify-center text-white font-black ring-1 ring-rose-400">A</div> <span class="uppercase tracking-widest text-[10px]">Ausente</span></div>
                    <div class="flex items-center gap-2.5"><div class="w-7 h-7 rounded-[10px] bg-sky-500 shadow-md shadow-sky-500/40 flex items-center justify-center text-white font-black ring-1 ring-sky-400">M</div> <span class="uppercase tracking-widest text-[10px]">Licencia</span></div>
                </div>
            </div>
        </div>
    </div>`;
};