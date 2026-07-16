// js/views/intensification.js
const IntensificationView = () => {
    const courseId = state.ui.activeCourseId;
    const termId = state.ui.termKey;
    const period = state.ui.intensificationPeriod;
    const year = new Date().getFullYear();
    const yearStr = period === "December" ? year : year + 1;
    const pk = `${period}${yearStr}`;
    const allStudents = getStudents(courseId);
    const records = state.intensification.filter(i => i.courseId === courseId && i.periodKey === pk);
    const ids = records.map(i => i.studentId);
    const examGrades = state.grades.filter(g => g.courseId === courseId && g.isIntensification && g.periodKey === pk);

    const risks = allStudents.filter(s => {
        const avg = calcGrade(termId, courseId, s.id);
        return avg !== null && parseFloat(avg) < state.settings.gradeTedMin;
    });
    risks.forEach(s => {
        if (!ids.includes(s.id)) {
            state.intensification.push({ courseId, studentId: s.id, periodKey: pk, status: "pending", plan: "" });
            ids.push(s.id);
            records.push({ courseId, studentId: s.id, periodKey: pk, status: "pending", plan: "" });
        }
    });

    const list = allStudents.filter(s => ids.includes(s.id));
    let html = "";
    if (list.length === 0) {
        html = `<div class="lg-panel p-0 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent shadow-none mt-8">
            <div class="lg-specular"></div>
            <div class="lg-content p-20 flex flex-col items-center">
                <div class="relative w-24 h-24 mx-auto mb-6"><div class="absolute inset-0 bg-emerald-500 blur-xl opacity-30 rounded-full"></div><div class="relative w-full h-full bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center ring-2 ring-emerald-400"><i data-lucide="shield-check" class="w-12 h-12 text-emerald-500"></i></div></div>
                <h3 class="text-3xl font-black text-slate-700 dark:text-slate-300 mb-3 tracking-tight">Cero Exámenes Pendientes</h3>
                <p class="text-slate-500 font-bold text-lg mb-2">Excelente noticia: Ningún alumno fue aplazado automáticamente.</p>
            </div>
        </div>`;
    } else {
        html = list.map(s => {
            const avg = calcGrade(termId, courseId, s.id);
            const rec = records.find(r => r.studentId === s.id) || {};
            const status = rec.status || "pending";
            const plan = rec.plan || "";
            const ex = examGrades.filter(g => g.studentId === s.id);
            let avgEx = null;
            if (ex.length > 0) {
                const valid = ex.filter(g => g.score !== null && !isNaN(parseFloat(g.score)));
                if (valid.length > 0) {
                    const sum = valid.reduce((acc, g) => acc + parseFloat(g.score), 0);
                    avgEx = (sum / valid.length).toFixed(2);
                }
            }
            let border = "border-amber-400 dark:border-amber-500/50 shadow-amber-500/10 from-amber-50/30 to-transparent";
            let color = "text-amber-600 dark:text-amber-400";
            if (status === 'approved') { border = "border-emerald-500 dark:border-emerald-500/50 shadow-emerald-500/10 from-emerald-50/50 to-transparent"; color = "text-emerald-600 dark:text-emerald-400"; }
            else if (status === 'failed') { border = "border-rose-500 dark:border-rose-500/50 shadow-rose-500/10 from-rose-50/50 to-transparent"; color = "text-rose-600 dark:text-rose-400"; }

            let cards = "";
            if (ex.length === 0) {
                cards = `<div class="h-[120px] w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-400 bg-white/50 dark:bg-black/20"><i data-lucide="file-question" class="w-8 h-8 mb-2 opacity-50"></i><span class="text-[10px] font-black uppercase tracking-widest">Sin Evaluaciones</span></div>`;
            } else {
                cards = `<div class="flex flex-wrap gap-3 overflow-y-auto max-h-[160px] custom-scrollbar pb-2 pt-1 px-1">${ex.map(g => `<div onclick="editIntGrade('${s.id}','${escapeHtml(s.name)}','${g.id}','${pk}')" class="px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-apple-blue dark:hover:border-sky-500 hover:shadow-lg transition-all min-w-[130px] group shadow-sm hover:-translate-y-1"><div class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 truncate w-full mb-2 group-hover:text-apple-blue" title="${escapeHtml(g.title)}">${escapeHtml(g.title)}</div><div class="font-black text-3xl tracking-tighter leading-none drop-shadow-sm ${g.score !== null && g.score !== "" ? getScoreColor(g.score) : 'text-slate-300 dark:text-slate-600'}">${g.score !== null && g.score !== "" ? g.score : '—'}</div></div>`).join("\n")}</div>`;
            }

            return `<div class="lg-panel p-0 border-l-[12px] ${border} mb-8 relative overflow-hidden bg-gradient-to-r bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl">
                <div class="lg-specular"></div>
                <div class="lg-content p-8">
                    <div class="flex flex-col xl:flex-row justify-between items-start mb-8 gap-8 border-b border-slate-200/60 dark:border-slate-700/60 pb-8">
                        <div class="flex items-center gap-6"><div class="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full flex shrink-0 items-center justify-center font-black text-4xl text-slate-400 dark:text-slate-300 ring-4 ring-white/80 dark:ring-black/20 shadow-inner">${s.name.charAt(0)}</div><div><div class="font-black text-3xl text-slate-900 dark:text-white tracking-tight mb-3">${escapeHtml(s.name)}</div><div class="flex flex-wrap items-center gap-3"><div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"><span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Regular:</span><span class="font-black text-sm text-slate-700 dark:text-slate-300">${avg || "S/C"}</span></div>${avgEx ? `<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-slate-200 dark:border-slate-700 shadow-sm"><span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Mesa:</span><span class="font-black text-base ${getScoreColor(avgEx)}">${avgEx}</span></div>` : ''}</div></div></div>
                        <div class="flex items-center gap-3 w-full xl:w-auto bg-slate-50 dark:bg-black/20 p-2.5 rounded-2xl ring-1 ring-inset ring-slate-200/80 dark:ring-slate-700/80 shadow-inner">
                            <div class="relative flex-1 xl:w-64">
                                <select onchange="updateIntStatus('${s.id}', this.value, '${pk}')" class="w-full pl-12 pr-4 py-3.5 rounded-xl font-black text-sm tracking-widest bg-white dark:bg-slate-800 border-none shadow-sm cursor-pointer appearance-none ${color} focus:ring-4 focus:ring-slate-300/50">
                                    <option value="pending" ${status==='pending'?'selected':''} class="text-amber-600 font-bold">⏳ EN PROCESO</option>
                                    <option value="approved" ${status==='approved'?'selected':''} class="text-emerald-600 font-bold">✅ APROBADO</option>
                                    <option value="failed" ${status==='failed'?'selected':''} class="text-rose-600 font-bold">❌ APLAZADO</option>
                                </select>
                            </div>
                            <button onclick="removeFromIntensification('${s.id}','${pk}')" class="p-3.5 text-slate-400 bg-white dark:bg-slate-800 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"><i data-lucide="user-minus" class="w-5 h-5"></i></button>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div class="flex flex-col h-full bg-white/50 dark:bg-slate-900/50 p-6 rounded-3xl border border-white/80 dark:border-slate-700/50 shadow-sm"><label class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><i data-lucide="align-left" class="w-4 h-4"></i> Hoja de Ruta</label><textarea id="plan-${s.id}" onchange="updateIntPlan('${s.id}', this.value, '${pk}')" class="w-full flex-1 min-h-[120px] p-5 rounded-2xl font-medium text-base resize-none custom-scrollbar bg-slate-50/80 dark:bg-slate-800/80 focus:bg-white focus:ring-4 focus:ring-apple-blue/30 border-none shadow-inner leading-relaxed placeholder:text-slate-400/70" placeholder="Redacta los temas exigidos... (Autoguardado)">${escapeHtml(plan)}</textarea></div>
                        <div class="flex flex-col h-full bg-slate-50/80 dark:bg-black/20 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-inner"><div class="flex items-center justify-between mb-5"><label class="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><i data-lucide="file-check-2" class="w-4 h-4"></i> Notas de Instancia</label><button onclick="addIntGrade('${s.id}','${escapeHtml(s.name)}','${pk}')" class="text-apple-blue dark:text-sky-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-800/50 transition-colors px-4 py-2.5 rounded-xl ring-1 ring-sky-200 dark:ring-sky-800"><i data-lucide="plus" class="w-4 h-4"></i> Asentar Nota</button></div>${cards}</div>
                    </div>
                </div>
            </div>`;
        }).join("\n");
    }

    return `
    <div class="max-w-6xl mx-auto pb-16">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div><h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3 flex items-center gap-4">Mesas de Examen <i data-lucide="flame" class="w-10 h-10 text-rose-500"></i></h2><p class="text-slate-500 font-bold text-xl">Instancias de Intensificación.</p></div>
            <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div class="flex bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl shadow-inner border border-slate-300/50 dark:border-slate-700">
                    <button onclick="setPeriod('December')" class="flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${period==='December'?'bg-white dark:bg-slate-600 text-apple-blue dark:text-white shadow-md ring-1 ring-black/5 scale-[1.02]':'text-slate-500 hover:text-slate-700'}">Dic ${year}</button>
                    <button onclick="setPeriod('February')" class="flex-1 sm:flex-none px-8 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${period==='February'?'bg-white dark:bg-slate-600 text-apple-blue dark:text-white shadow-md ring-1 ring-black/5 scale-[1.02]':'text-slate-500 hover:text-slate-700'}">Feb ${year+1}</button>
                </div>
                <button onclick="addStudentToIntensification()" class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 ring-2 ring-slate-900/10 dark:ring-white/20"><i data-lucide="user-plus" class="w-5 h-5"></i> Citar Manual</button>
            </div>
        </header>
        <div class="space-y-4 save-scroll" data-scroll-key="intensification-list">${html}</div>
    </div>`;
};