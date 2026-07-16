// js/views/notes.js
const NotesView = () => {
    const courseId = state.ui.activeCourseId;
    const notes = state.notes.filter(n => n.courseId === courseId).sort((a,b) => b.date.localeCompare(a.date));
    let html = "";
    if (notes.length === 0) {
        html = `<div class="lg-panel p-0 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-none flex flex-col items-center justify-center">
            <div class="lg-specular"></div>
            <div class="lg-content flex flex-col items-center p-20">
                <div class="w-24 h-24 bg-purple-100 dark:bg-purple-900/30 rounded-[24px] flex items-center justify-center mb-6 ring-2 ring-purple-200 dark:ring-purple-800">
                    <i data-lucide="sticky-note" class="w-12 h-12 text-purple-500"></i>
                </div>
                <h3 class="font-black text-3xl mb-3 text-slate-700 dark:text-slate-300 tracking-tight">Pizarra Limpia</h3>
                <p class="text-slate-500 font-medium text-lg max-w-md mb-8">Utiliza este espacio para anotar borradores, grupos o ideas.</p>
                <button onclick="ModalNote()" class="px-8 py-4 bg-purple-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-500/30 hover:bg-purple-600 hover:-translate-y-1 transition-all">Escribir Primer Apunte</button>
            </div>
        </div>`;
    } else {
        html = notes.map(n => `
            <div class="lg-panel p-0 flex flex-col md:flex-row items-start justify-between gap-4 group hover:shadow-lg transition-all border-l-4 border-l-purple-500 bg-white/70 dark:bg-slate-900/70">
                <div class="lg-specular"></div>
                <div class="lg-content flex-1 w-full p-6">
                    <div class="flex-1 w-full min-w-0">
                        <div class="flex items-center gap-3 mb-1 flex-wrap">
                            <span class="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${n.date.split('-').reverse().join('/')}</span>
                            <span class="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-2 py-0.5 rounded-full">${escapeHtml(n.title)}</span>
                        </div>
                        <div class="text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium mt-1">${escapeHtml(n.content)}</div>
                    </div>
                    <div class="flex gap-2 shrink-0 mt-2 md:mt-0">
                        <button onclick="ModalNote('${n.id}')" class="p-2 text-slate-500 hover:text-apple-blue hover:bg-sky-50 dark:hover:bg-slate-700 rounded-lg transition-colors"><i data-lucide="edit-3" class="w-4 h-4"></i></button>
                        <button onclick="deleteNote('${n.id}')" class="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
            </div>
        `).join("");
        html = `<div class="space-y-4">${html}</div>`;
    }

    return `<div class="max-w-5xl mx-auto pb-16">
                <header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 flex items-center gap-4">Borradores y Grupos <i data-lucide="sparkles" class="w-8 h-8 text-purple-500"></i></h2>
                        <p class="text-slate-500 font-bold text-xl">Notas organizadas cronológicamente</p>
                    </div>
                    <button onclick="ModalNote()" class="w-full md:w-auto px-8 py-4 bg-purple-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-500/30 hover:-translate-y-1 hover:bg-purple-600 transition-all flex items-center justify-center gap-3 ring-2 ring-purple-400/50">
                        <i data-lucide="pen-line" class="w-5 h-5"></i> Nuevo Apunte
                    </button>
                </header>
                <div class="save-scroll" data-scroll-key="notes-list">${html}</div>
            </div>`;
};