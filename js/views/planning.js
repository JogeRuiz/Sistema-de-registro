// js/views/planning.js
const PlanningView = () => {
    const courseId = state.ui.activeCourseId;
    const items = state.planning.filter(p => p.courseId === courseId).sort((a,b) => a.week - b.week);
    let html = `<div class="max-w-5xl mx-auto pb-16"><header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"><div><h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Planeación de Clases</h2><p class="text-slate-500 font-bold text-xl">Cronograma semanal de contenidos y objetivos.</p></div><button onclick="ModalPlanning()" class="w-full md:w-auto px-8 py-4 bg-purple-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-500/30 hover:-translate-y-1 hover:bg-purple-600 transition-all flex items-center justify-center gap-3"><i data-lucide="plus" class="w-5 h-5"></i> Agregar Semana</button></header><div class="space-y-6 save-scroll" data-scroll-key="planning-list">`;
    if (items.length === 0) {
        html += `<div class="lg-panel p-0 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-none">
            <div class="lg-specular"></div>
            <div class="lg-content p-20 flex flex-col items-center">
                <i data-lucide="calendar" class="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600"></i>
                <h3 class="text-3xl font-black text-slate-700 dark:text-slate-300 mb-3 tracking-tight">Cronograma Vacío</h3>
                <p class="text-slate-500 font-medium text-lg">Comienza a planificar tus clases semana a semana.</p>
            </div>
        </div>`;
    } else {
        items.forEach(item => {
            html += `<div class="lg-panel p-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:shadow-2xl transition-all border-l-8 border-l-purple-500 bg-white/60 dark:bg-slate-900/60">
                <div class="lg-specular"></div>
                <div class="lg-content p-8 flex-1 w-full">
                    <div class="flex-1 cursor-pointer" onclick="editPlanning('${item.id}')"><div class="flex items-center gap-4 mb-3"><span class="px-4 py-1.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black uppercase tracking-widest">Semana ${item.week}</span>${item.date ? `<span class="text-xs font-bold text-slate-500">${item.date}</span>` : ''}</div><h3 class="text-2xl font-black text-slate-900 dark:text-white mb-2 group-hover:text-purple-500 transition-colors">${escapeHtml(item.topic)}</h3>${item.objectives ? `<p class="text-slate-600 dark:text-slate-300 font-medium text-sm mb-2"><span class="font-black uppercase text-[10px] tracking-widest text-slate-400">Objetivos:</span> ${escapeHtml(item.objectives)}</p>` : ''}${item.materials ? `<p class="text-slate-600 dark:text-slate-300 font-medium text-sm"><span class="font-black uppercase text-[10px] tracking-widest text-slate-400">Materiales:</span> ${escapeHtml(item.materials)}</p>` : ''}</div>
                    <div class="flex gap-3 shrink-0"><button onclick="editPlanning('${item.id}')" class="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-purple-500 hover:border-purple-300 transition-all"><i data-lucide="edit-3" class="w-5 h-5"></i></button><button onclick="deletePlanning('${item.id}')" class="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-300 transition-all"><i data-lucide="trash-2" class="w-5 h-5"></i></button></div>
                </div>
            </div>`;
        });
    }
    html += `</div></div>`;
    return html;
};