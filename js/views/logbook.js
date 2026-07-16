// js/views/logbook.js
const LogbookView = () => {
    const term = state.ui.termKey;
    const courseId = state.ui.activeCourseId;
    const logs = state.classLogs.filter(l => l.term === term && l.courseId === courseId).sort((a,b) => b.date.localeCompare(a.date));

    let list = "";
    if (logs.length === 0) {
        list = `<div class="lg-panel p-0 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-none flex flex-col items-center justify-center">
            <div class="lg-specular"></div>
            <div class="lg-content p-16 flex flex-col items-center">
                <i data-lucide="book-dashed" class="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600"></i>
                <p class="text-xl font-bold mb-2">Libro de Temas en Blanco</p>
                <p class="text-sm">Utiliza la consola superior para redactar la primera entrada.</p>
            </div>
        </div>`;
    } else {
        list = logs.map(log => `<div class="lg-panel p-0 flex flex-col group hover:border-sky-400 dark:hover:border-sky-600 transition-colors duration-300 border-l-8 border-l-apple-blue bg-white/60 dark:bg-slate-900/60 shadow-sm hover:shadow-md">
            <div class="lg-specular"></div>
            <div class="lg-content p-8">
                <div class="flex justify-between items-start mb-4"><div class="flex items-center gap-4 flex-wrap"><div class="px-4 py-1.5 bg-white dark:bg-slate-800 rounded-xl text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 shadow-sm flex items-center gap-2"><i data-lucide="calendar-days" class="w-3.5 h-3.5 opacity-60"></i>${log.date.split('-').reverse().join('/')}</div>${log.homework ? `<div class="px-4 py-1.5 bg-sky-100 dark:bg-sky-900/40 text-apple-blue dark:text-sky-400 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 ring-1 ring-sky-200 dark:ring-sky-800 shadow-sm"><i data-lucide="clipboard-list" class="w-3.5 h-3.5"></i> Actividad Asignada</div>` : ''}</div><div class="flex gap-2 no-print"><button onclick="editLogEntry('${log.id}')" class="opacity-0 group-hover:opacity-100 p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-apple-blue hover:bg-sky-50 dark:hover:bg-sky-900/30 rounded-xl transition-all shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"><i data-lucide="edit-3" class="w-4 h-4"></i></button><button onclick="deleteLog('${log.id}')" class="opacity-0 group-hover:opacity-100 p-2.5 bg-white dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all shadow-sm ring-1 ring-slate-200 dark:ring-slate-700 no-print"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div></div>
                <div class="text-2xl font-black text-slate-900 dark:text-white mb-2 leading-relaxed tracking-tight">${escapeHtml(log.content)}</div>${log.remarks ? `<div class="text-sm text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl mb-2 border-l-4 border-l-amber-400"><span class="font-black uppercase text-[10px] tracking-widest text-amber-500">Observaciones:</span> ${escapeHtml(log.remarks)}</div>` : ''}${log.homework ? `<div class="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50 dark:bg-black/20 p-4 rounded-2xl shadow-inner"><div class="text-slate-700 dark:text-slate-300 font-bold text-sm w-full"><span class="font-black text-slate-400 uppercase text-[9px] tracking-[0.2em] block mb-1 flex items-center gap-1"><i data-lucide="terminal-square" class="w-3 h-3"></i> Tarea Extracurricular</span>${escapeHtml(log.homework)}</div>${log.due ? `<div class="font-black text-rose-500 dark:text-rose-400 shrink-0 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl ring-1 ring-rose-200 dark:ring-rose-800/50 text-center sm:text-right w-full sm:w-auto shadow-sm"><span class="uppercase text-[9px] text-rose-400/80 block tracking-widest mb-0.5">Límite de Entrega</span><i data-lucide="clock" class="w-3 h-3 inline align-baseline mr-1"></i> ${log.due.split('-').reverse().join('/')}</div>` : ''}</div>` : ''}
            </div>
        </div>`).join("\n");
    }

    return `
    <div class="max-w-5xl mx-auto pb-16">
        <header class="mb-12"><h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3 flex items-center gap-4">Libro de Temas <i data-lucide="book-open-check" class="w-10 h-10 text-apple-blue"></i></h2><p class="text-slate-500 font-bold text-xl">Registro auditable de contenidos.</p></header>
        <div class="lg-panel p-0 mb-12 no-print relative overflow-hidden ring-2 ring-apple-blue shadow-2xl shadow-sky-500/10">
            <div class="lg-specular"></div>
            <div class="lg-content p-8 md:p-10">
                <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-sky-200/40 dark:bg-sky-900/30 rounded-full blur-[40px] pointer-events-none"></div>
                <div class="flex items-center gap-4 mb-8 relative z-10"><div class="w-14 h-14 bg-apple-blue rounded-[18px] flex items-center justify-center shadow-lg ring-2 ring-white/30 dark:ring-white/10"><i data-lucide="pen-tool" class="w-6 h-6 text-white"></i></div><h3 class="font-black text-3xl text-slate-900 dark:text-white tracking-tight">Fichar Clase Nueva</h3></div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 relative z-10">
                    <div class="col-span-1 md:col-span-1"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Fecha</label><input id="log-date" type="date" class="w-full p-4 rounded-2xl font-black text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900/80 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none transition-all cursor-pointer" value="${todayISO()}"></div>
                    <div class="col-span-1 md:col-span-3"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Tema</label><input id="log-content" class="w-full p-4 rounded-2xl font-bold text-lg bg-slate-50 dark:bg-slate-900/80 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none transition-all placeholder:font-medium" placeholder="Escribe aquí el tema dictado..."></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 relative z-10">
                    <div class="col-span-1 md:col-span-4"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><i data-lucide="message-square" class="w-4 h-4 text-amber-500"></i> Observaciones</label><textarea id="log-remarks" class="w-full p-4 rounded-2xl font-medium resize-none bg-slate-50 dark:bg-slate-900/80 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" rows="2" placeholder="Comportamiento, dudas, clima de clase..."></textarea></div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 relative z-10 p-6 bg-slate-100/50 dark:bg-black/20 rounded-3xl border border-white/80 dark:border-slate-700/50">
                    <div class="col-span-1 md:col-span-3"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><i data-lucide="paperclip" class="w-4 h-4"></i> Actividad Asignada</label><input id="log-hw" class="w-full p-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-slate-300 border-none" placeholder="Tarea para casa..."></div>
                    <div class="col-span-1 md:col-span-1"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><i data-lucide="alarm-clock" class="w-4 h-4 text-rose-500"></i> Fecha Control</label><input id="log-due" type="date" class="w-full p-4 rounded-xl font-bold text-sm bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-rose-300 border-none text-rose-600 dark:text-rose-400 cursor-pointer"></div>
                </div>
                <button onclick="submitClassLog()" class="w-full py-5 bg-apple-blue text-white rounded-2xl font-black text-xl shadow-xl shadow-sky-500/40 hover:bg-sky-600 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 relative z-10 flex items-center justify-center gap-3 ring-2 ring-white/20"><i data-lucide="archive" class="w-6 h-6"></i> Firmar Libro de Temas</button>
            </div>
        </div>
        <div class="flex items-center gap-4 mb-6 mt-12"><div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div><h3 class="font-black text-sm text-slate-400 uppercase tracking-[0.3em]">Registro Histórico</h3><div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div></div>
        <div class="space-y-6 save-scroll" data-scroll-key="logbook-list">${list}</div>
    </div>`;
};