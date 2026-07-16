// js/views/agenda.js
const AgendaView = () => {
    const term = state.ui.termKey;
    const courseId = state.ui.activeCourseId;
    const tasks = state.tasks.filter(t => t.term === term && t.courseId === courseId).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
    const course = state.courses.find(c => c.id === courseId);
    const isLinkedToClassroom = course && course.classroomCourseId;
    
    const getStatus = (dateStr) => {
        const [y,m,d] = dateStr.split("-").map(Number);
        const target = new Date(y, m-1, d);
        const now = new Date(); now.setHours(0,0,0,0);
        target.setHours(0,0,0,0);
        const diff = Math.ceil((target - now) / (1000*60*60*24));
        if (diff < 0) return { label: "VENCIDO", cls: "bg-rose-500", ring: "ring-rose-500/40 text-rose-500" };
        if (diff === 0) return { label: "HOY", cls: "bg-amber-500", ring: "ring-amber-500/40 text-amber-500" };
        if (diff === 1) return { label: "MAÑANA", cls: "bg-sky-500", ring: "ring-sky-500/40 text-sky-500" };
        if (diff <= 7) return { label: `EN ${diff} DÍAS`, cls: "bg-apple-blue", ring: "ring-apple-blue/40 text-apple-blue" };
        return { label: `EN ${diff} DÍAS`, cls: "bg-emerald-500", ring: "ring-emerald-500/40 text-emerald-500" };
    };

    let list = "";
    if (tasks.length === 0) {
        list = `<div class="lg-panel p-0 text-center animate-fade-in border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent shadow-none">
            <div class="lg-specular"></div>
            <div class="lg-content p-20 flex flex-col items-center">
                <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 ring-2 ring-slate-200 dark:ring-slate-700"><i data-lucide="calendar-check" class="w-10 h-10 text-slate-400"></i></div>
                <h3 class="text-3xl font-black text-slate-700 dark:text-slate-300 mb-3 tracking-tight">Agenda Despejada</h3>
                <p class="text-slate-500 font-medium text-lg">No hay fechas límite críticas próximas.</p>
            </div>
        </div>`;
    } else {
        list = tasks.map(t => {
            const course = state.courses.find(c => c.id === t.courseId);
            const name = course ? course.name : "Materia General";
            const clean = t.dueDate.replace(/-/g,"");
            const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=DocenteOS:%20${encodeURIComponent(t.title)}&details=Materia:%20${encodeURIComponent(name)}&dates=${clean}/${clean}`;
            const status = getStatus(t.dueDate);
            const publishBtn = (isLinkedToClassroom && !t.classroomCourseWorkId) ? `<button onclick="publishTaskToClassroom('${t.id}')" class="px-3 py-2 text-xs font-black bg-blue-500/20 hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 rounded-xl transition" title="Publicar en Classroom"><i data-lucide="cloud" class="w-4 h-4"></i></button>` : '';
            return `<div class="lg-panel p-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group hover:shadow-2xl hover:scale-[1.01] transition-all duration-300 border-l-[8px] border-l-transparent hover:border-l-apple-blue bg-white/60 dark:bg-slate-900/60">
                <div class="lg-specular"></div>
                <div class="lg-content flex-1 w-full p-6 md:p-8">
                    <div class="flex-1 cursor-pointer w-full" onclick="editTask('${t.id}')"><div class="flex flex-wrap items-center gap-3 mb-4"><div class="px-3 py-1.5 rounded-lg text-white text-[10px] font-black tracking-[0.2em] shadow-sm ring-2 ${status.cls} ${status.ring}">${status.label}</div><div class="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-lg ring-1 ring-slate-200 dark:ring-slate-700 shadow-inner"><i data-lucide="folder" class="w-3 h-3 inline align-baseline mr-1 opacity-50"></i>${escapeHtml(name)}</div>${publishBtn}</div><div class="text-3xl font-black text-slate-900 dark:text-white mb-3 leading-tight tracking-tight group-hover:text-apple-blue transition-colors">${escapeHtml(t.title)}</div><div class="flex items-center gap-2 text-slate-500 font-black text-sm"><i data-lucide="calendar-days" class="w-4 h-4"></i><span>Pautado para: <span class="text-slate-700 dark:text-slate-300">${t.dueDate.split("-").reverse().join("/")}</span></span></div></div>
                    <div class="flex items-center gap-3 shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-6 md:pt-0 border-t md:border-t-0 border-slate-200/50 dark:border-slate-700/50"><a href="${gcal}" target="_blank" class="flex-1 md:flex-none px-6 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-black shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-apple-blue hover:border-apple-blue/50 transition-all text-sm flex items-center justify-center gap-2 no-print group-hover:shadow-md"><i data-lucide="calendar-plus" class="w-5 h-5"></i> Exportar a Google</a><button onclick="deleteTask('${t.id}')" class="p-4 text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-2xl transition-all shadow-sm no-print"><i data-lucide="check-circle" class="w-6 h-6"></i></button></div>
                </div>
            </div>`;
        }).join("\n");
    }

    const importBtn = isLinkedToClassroom ? `<button onclick="importTasksFromClassroom()" class="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-sm flex items-center gap-2 transition"><i data-lucide="download-cloud" class="w-5 h-5"></i> Importar tareas de Classroom</button>` : '';

    return `
    <div class="max-w-5xl mx-auto pb-16">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div><h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Radar de Agenda</h2><p class="text-slate-500 font-bold text-xl">Monitor de entregas y vencimientos.</p></div>
            <div class="flex flex-wrap gap-4">
                ${importBtn}
                <button onclick="addTaskPrompt()" class="w-full md:w-auto px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-lg shadow-2xl shadow-slate-900/20 dark:shadow-white/10 hover:-translate-y-1 hover:scale-105 transition-all flex items-center justify-center gap-3 ring-4 ring-slate-900/10 dark:ring-white/10 focus:outline-none"><i data-lucide="calendar-plus" class="w-6 h-6"></i> Insertar Evento</button>
            </div>
        </div>
        <div class="space-y-6 save-scroll" data-scroll-key="agenda-list">${list}</div>
    </div>`;
};