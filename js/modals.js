// js/modals.js
// Funciones de modales, CRUD de cursos, notas, estudiantes, etc.

// ========================================================================
// EXPORTACIÓN EXCEL (CSV)
// ========================================================================
window.exportToExcel = () => {
    try {
        const cId = state.ui.activeCourseId;
        if (!cId) return notify("Selecciona una materia primero", "error");
        const course = state.courses.find(c => c.id === cId);
        if (!course) return;
        const termKey = state.ui.termKey;
        const students = getStudents(cId);
        if (students.length === 0) return notify("Directorio vacío", "info");
        let csv = "\uFEFF";
        csv += "Apellido y Nombre,Porcentaje Asistencia (%),Promedio Global,Estado Trayectoria (TTA/TED/TEP)\n";
        students.forEach(s => {
            const att = calcAtt(termKey, cId, s.id);
            const avg = calcGrade(termKey, cId, s.id);
            const num = avg !== null ? parseFloat(avg) : null;
            const traj = num !== null ? getTrajectoryLabel(num) : "Sin Evaluar";
            csv += `"${escapeHtml(s.name)}",${att.pct},"${avg || 'S/C'}",${traj}\n`;
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const a = document.createElement("a");
        const name = course.name.replace(/[^a-z0-9]/gi, '_').toUpperCase();
        const termLabel = TERMS_CONFIG[termKey].label.replace(/[^a-z0-9]/gi, '_');
        a.download = `Planilla_${name}_${termLabel}_DocenteOS.csv`;
        a.href = URL.createObjectURL(blob);
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 100);
        notify("Excel exportado", "success");
    } catch (e) { notify("Fallo en exportación Excel", "error"); }
};

// ========================================================================
// TIPOS DE EVALUACIÓN Y AYUDA
// ========================================================================
window.addEvaluationType = () => {
    const input = document.getElementById('new-eval-type');
    const val = input.value.trim();
    if (!val) return notify("Ingresa un nombre", "error");
    if (state.settings.evaluationTypes.includes(val)) return notify("Ya existe", "error");
    state.settings.evaluationTypes.push(val);
    save();
    render();
    notify("Tipo agregado", "success");
};

window.removeEvaluationType = (type) => {
    if (!confirm(`¿Eliminar el tipo "${type}"?`)) return;
    state.settings.evaluationTypes = state.settings.evaluationTypes.filter(t => t !== type);
    save();
    render();
    notify("Tipo eliminado", "success");
};

window.saveEvaluationHelp = () => {
    const text = document.getElementById('eval-help-text').value.trim();
    state.settings.evaluationHelp = text;
    save();
    notify("Ayuda guardada", "success");
};

// ========================================================================
// IMPRESIÓN DE LEGAJO COMPLETO
// ========================================================================
window.printStudentReport = (studentId) => {
    const student = state.students.find(s => s.id === studentId);
    if (!student) return notify("Alumno no encontrado", "error");
    const term = state.ui.termKey;
    const cId = student.courseId;
    const course = state.courses.find(c => c.id === cId);
    const att = calcAtt(term, cId, student.id);
    const avg = calcGrade(term, cId, student.id);
    const finalKey = `${cId}|${student.id}|${term}`;
    const finalEntry = state.finalGrades.find(f => f.key === finalKey);
    const hasFinal = finalEntry && finalEntry.grade !== null && !isNaN(parseFloat(finalEntry.grade));
    const displayGrade = hasFinal ? parseFloat(finalEntry.grade).toFixed(2) : avg;
    const trajLabel = getTrajectoryLabel(displayGrade);
    const grades = state.grades.filter(g => g.term === term && g.courseId === cId && g.studentId === student.id && !g.isIntensification).sort((a,b) => a.date.localeCompare(b.date));
    const attDates = state.attendance.filter(a => a.term === term && a.courseId === cId && a.studentId === student.id).sort((a,b) => a.date.localeCompare(b.date));
    const attMap = {};
    attDates.forEach(r => { attMap[r.date] = r.status; });

    let allDates = [];
    TERMS_CONFIG[term].months.forEach(m => {
        allDates = allDates.concat(getDatesForMonth(course, m));
    });
    const today = todayISO();
    const validDates = allDates.filter(d => d <= today || attMap[d]);

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return notify("Permite ventanas emergentes para imprimir", "error");
    printWindow.document.write(`
        <html><head><title>Legajo - ${escapeHtml(student.name)}</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2rem; color: #1a202c; background: white; max-width: 1000px; margin: 0 auto; }
            h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.25rem; }
            h2 { font-size: 1.8rem; font-weight: 700; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 2rem; }
            .sub { color: #4a5568; margin-bottom: 1.5rem; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin: 1.5rem 0; }
            .card { background: #f7fafc; border-radius: 0.75rem; padding: 1rem; border-left: 4px solid #0ea5e9; }
            .card .label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #718096; letter-spacing: 0.05em; }
            .card .value { font-size: 1.8rem; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
            th { background: #edf2f7; text-align: left; padding: 0.5rem; font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #4a5568; }
            td { padding: 0.5rem; border-bottom: 1px solid #e2e8f0; }
            .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
            .badge-green { background: #c6f6d5; color: #22543d; }
            .badge-amber { background: #fefcbf; color: #744210; }
            .badge-red { background: #fed7d7; color: #742a2a; }
            .badge-sky { background: #bee3f8; color: #2a4365; }
            .print-avoid { page-break-inside: avoid; }
            @media print { body { padding: 0.5in; } .no-print { display: none; } }
        </style>
        </head><body>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <div><h1>${escapeHtml(student.name)}</h1><div class="sub">Legajo Académico - ${escapeHtml(course ? course.name : '')}</div></div>
            <div style="font-size:1.5rem; font-weight:900; color:#0ea5e9;">DocenteOS</div>
        </div>
        <div class="grid">
            <div class="card"><div class="label">Asistencia Global</div><div class="value">${att.pct}%</div><div style="font-size:0.8rem;">Presentes: ${att.present} | Tardes: ${att.late} | Ausentes: ${att.absent}</div></div>
            <div class="card"><div class="label">Promedio</div><div class="value">${displayGrade || '—'}</div><div style="font-size:0.8rem;">${hasFinal ? 'Nota final aplicada' : 'Promedio de notas'}</div></div>
            <div class="card"><div class="label">Trayectoria</div><div class="value" style="color: ${trajLabel === 'TTA' ? '#10b981' : trajLabel === 'TED' ? '#f59e0b' : '#f43f5e'};">${trajLabel}</div></div>
            <div class="card"><div class="label">Estado</div><div class="value" style="color: ${att.pct < state.settings.attendanceMin ? '#f43f5e' : '#10b981'};">${att.pct < state.settings.attendanceMin ? 'Riesgo de asistencia' : 'Regular'}</div></div>
        </div>
        <h2>Registro de Asistencia</h2>
        <table>
            <thead><tr><th>Fecha</th><th>Estado</th></tr></thead>
            <tbody>
                ${validDates.map(d => {
                    const status = attMap[d] || '—';
                    const badge = status === 'P' ? 'badge-green' : status === 'T' ? 'badge-amber' : status === 'A' ? 'badge-red' : status === 'M' ? 'badge-sky' : '';
                    return `<tr><td>${d}</td><td><span class="badge ${badge}">${status}</span></td></tr>`;
                }).join('')}
            </tbody>
        </table>
        <h2>Historial de Notas</h2>
        ${grades.length === 0 ? '<p>No hay calificaciones registradas.</p>' : `
            <table>
                <thead><tr><th>Fecha</th><th>Título</th><th>Nota</th><th>Estado</th></tr></thead>
                <tbody>
                    ${grades.map(g => {
                        const score = (g.score !== null && g.score !== "") ? parseFloat(g.score) : '—';
                        const color = score !== '—' ? (score >= state.settings.gradeTtaMin ? 'color:#10b981' : score >= state.settings.gradeTedMin ? 'color:#f59e0b' : 'color:#f43f5e') : 'color:#4a5568';
                        const badge = g.noEntregado ? 'No Entregó' : 'Entregado';
                        const badgeCls = g.noEntregado ? 'badge-red' : 'badge-green';
                        return `<tr><td>${g.date || '—'}</td><td>${escapeHtml(g.title)}</td><td style="${color}; font-weight:800;">${score}</td><td><span class="badge ${badgeCls}">${badge}</span></td></tr>`;
                    }).join('')}
                </tbody>
            </table>
        `}
        ${student.observations ? `<h2>Observaciones</h2><p style="background:#f7fafc; padding:1rem; border-radius:0.5rem;">${escapeHtml(student.observations)}</p>` : ''}
        <p style="margin-top:2rem; font-size:0.7rem; color:#a0aec0; text-align:center;">Documento generado por DocenteOS - ${new Date().toLocaleString()}</p>
        <script>
            window.onload = function() { window.print(); setTimeout(window.close, 500); };
        <\/script>
        </body></html>
    `);
    printWindow.document.close();
};

// ========================================================================
// MODAL DEL ESTUDIANTE
// ========================================================================
window.StudentModalComponent = () => {
    const id = state.ui.activeStudentId;
    const student = state.students.find(s => s.id === id);
    if (!student) return '';
    const term = state.ui.termKey;
    const cId = student.courseId;
    const tab = state.ui.modalTab;
    const att = calcAtt(term, cId, student.id);
    const avg = calcGrade(term, cId, student.id);
    const finalKey = `${cId}|${student.id}|${term}`;
    const finalEntry = state.finalGrades.find(f => f.key === finalKey);
    const hasFinal = finalEntry && finalEntry.grade !== null && !isNaN(parseFloat(finalEntry.grade));
    const finalVal = hasFinal ? parseFloat(finalEntry.grade) : null;
    const displayGrade = hasFinal ? finalVal.toFixed(2) : avg;
    const displayColor = displayGrade ? getScoreColor(displayGrade) : 'text-slate-300 dark:text-slate-600';
    const risk = att.pct < state.settings.attendanceMin;
    const attColor = risk ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400';
    const trajLabel = getTrajectoryLabel(displayGrade);
    let trajColor = "text-slate-400", trajBg = "bg-slate-100 dark:bg-slate-800", trajDesc = "Sin calificaciones.";
    if (trajLabel === 'TTA') { trajColor = "text-emerald-500"; trajBg = "bg-emerald-50 dark:bg-emerald-900/20 ring-emerald-500/30"; trajDesc = "Trayectoria Totalmente Alcanzada."; }
    else if (trajLabel === 'TED') { trajColor = "text-amber-500"; trajBg = "bg-amber-50 dark:bg-amber-900/20 ring-amber-500/30"; trajDesc = "Trayectoria en Proceso."; }
    else if (trajLabel === 'TEP') { trajColor = "text-rose-500"; trajBg = "bg-rose-50 dark:bg-rose-900/20 ring-rose-500/30"; trajDesc = "Trayectoria en Evaluación. Derivar a Intensificación."; }

    const grades = state.grades.filter(g => g.term === term && g.courseId === cId && g.studentId === student.id && !g.isIntensification).sort((a,b) => a.date.localeCompare(b.date));

    const tabBoletin = () => {
        if (grades.length === 0) return `<div class="text-center p-20 bg-white/40 dark:bg-slate-800/40 rounded-[32px] border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-inner"><i data-lucide="file-minus" class="w-20 h-20 mx-auto mb-6 text-slate-300 dark:text-slate-600"></i><h3 class="font-black text-2xl text-slate-400 dark:text-slate-500 mb-2">Historial Limpio</h3></div>`;
        const rows = grades.map(g => {
            const badge = g.noEntregado ? '<span class="text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-400 text-[10px] ml-3 font-black uppercase px-2.5 py-1 rounded-md ring-1 ring-rose-300 dark:ring-rose-700">No Entregado</span>' : '<span class="text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] ml-3 font-black uppercase px-2.5 py-1 rounded-md ring-1 ring-emerald-300 dark:ring-emerald-700">Entregado</span>';
            const score = (g.score !== null && g.score !== "") ? parseFloat(g.score) : null;
            const color = score !== null ? getScoreColor(score) : 'text-slate-300 dark:text-slate-600';
            const disp = score !== null ? score : '—';
            const date = g.date ? g.date.split("-").reverse().join("/") : "--/--/----";
            const evalType = g.evaluationType ? `<span class="text-[10px] font-black text-indigo-500 ml-2">${escapeHtml(g.evaluationType)}</span>` : '';
            return `<tr class="hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all cursor-pointer group border-b border-slate-100 dark:border-slate-800/50" onclick="loadGradeToEdit('${student.id}','${escapeHtml(student.name)}','${g.id}')"><td class="p-6 text-slate-500 dark:text-slate-400 font-black text-sm font-mono group-hover:text-apple-blue"><i data-lucide="calendar" class="w-4 h-4 inline mr-2 opacity-50"></i>${date}</td><td class="p-6 font-black text-slate-800 dark:text-slate-200 text-lg">${escapeHtml(g.title)} ${badge} ${evalType}</td><td class="p-6 text-right font-black text-3xl tracking-tighter ${color} drop-shadow-sm group-hover:scale-110 transition-transform origin-right">${disp}</td></tr>`;
        }).join("");
        return `<div class="glass-panel overflow-hidden border border-white/60 dark:border-slate-700 shadow-2xl flex flex-col h-full max-h-[600px] animate-fade-in"><div class="bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0"><h3 class="font-black text-sm uppercase tracking-[0.2em] text-slate-500 flex items-center gap-3"><i data-lucide="history" class="w-5 h-5 text-apple-blue"></i>Expediente</h3><div class="flex gap-2 no-print"><button onclick="printStudentReport('${student.id}')" class="px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-apple-blue transition-colors flex items-center gap-2"><i data-lucide="printer" class="w-4 h-4"></i> Imprimir</button></div></div><div class="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 relative bg-slate-50/30 dark:bg-slate-900/30 save-scroll" data-scroll-key="student-grades"><table class="w-full text-left border-collapse"><tbody>${rows}</tbody></table></div></div>`;
    };

    const tabResumen = () => {
        const finalBadge = hasFinal ? `<div class="flex items-center gap-2 mt-2"><span class="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-[10px] font-black px-3 py-1 rounded-full ring-1 ring-sky-300 dark:ring-sky-700">Nota Final</span></div>` : '';
        const obs = student.observations || '';
        return `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 animate-spring-up">
            <div class="glass-panel p-10 text-center flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/50 shadow-2xl border-t-8 border-t-sky-400 group"><div class="absolute -top-20 -right-20 w-48 h-48 bg-sky-100 dark:bg-sky-900/40 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div><div class="relative z-10 flex flex-col items-center"><div class="text-[10px] font-black uppercase text-sky-500 mb-6 tracking-[0.3em] bg-sky-50 dark:bg-sky-900/30 px-4 py-2 rounded-xl shadow-sm ring-1 ring-sky-200 dark:ring-sky-800 flex items-center gap-2"><i data-lucide="calendar-check-2" class="w-4 h-4"></i> Presencialidad</div><div class="text-8xl font-black ${attColor} mb-8 tracking-tighter drop-shadow-md relative">${att.pct}<span class="text-4xl absolute bottom-2 -right-10 opacity-50">%</span></div><div class="flex gap-4 items-center bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 w-full justify-center shadow-inner backdrop-blur-md"><div class="text-center px-4 border-r border-slate-200 dark:border-slate-700"><div class="font-black text-2xl text-slate-800 dark:text-slate-200 leading-none mb-1">${att.present}</div><div class="text-[9px] uppercase tracking-[0.2em] font-black text-emerald-500">Pres.</div></div><div class="text-center px-4 border-r border-slate-200 dark:border-slate-700"><div class="font-black text-2xl text-slate-800 dark:text-slate-200 leading-none mb-1">${att.late}</div><div class="text-[9px] uppercase tracking-[0.2em] font-black text-amber-500">Tarde</div></div><div class="text-center px-4"><div class="font-black text-2xl text-slate-800 dark:text-slate-200 leading-none mb-1">${att.absent}</div><div class="text-[9px] uppercase tracking-[0.2em] font-black text-rose-500">Aus.</div></div></div></div></div>
            <div class="glass-panel p-10 text-center flex flex-col justify-center items-center relative overflow-hidden bg-gradient-to-br from-white/90 to-slate-50/50 dark:from-slate-800/90 dark:to-slate-900/50 shadow-2xl border-t-8 border-t-purple-500 group"><div class="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-100 dark:bg-purple-900/30 rounded-full blur-[40px] group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div><div class="relative z-10 flex flex-col items-center w-full"><div class="text-[10px] font-black uppercase text-purple-500 mb-6 tracking-[0.3em] bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-xl shadow-sm ring-1 ring-purple-200 dark:ring-purple-800 flex items-center gap-2"><i data-lucide="award" class="w-4 h-4"></i> Rendimiento</div>
                <div class="text-5xl font-black ${displayColor} tracking-tighter drop-shadow-md">${displayGrade || "—"}</div>
                ${finalBadge}
                <div class="flex gap-2 mt-4 flex-wrap justify-center no-print">
                    <button onclick="roundGrade('${student.id}','up')" class="px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-sm hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/30 flex items-center gap-1"><i data-lucide="arrow-up" class="w-4 h-4"></i> Redondear Arriba</button>
                    <button onclick="roundGrade('${student.id}','down')" class="px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-sm hover:bg-amber-600 transition shadow-lg shadow-amber-500/30 flex items-center gap-1"><i data-lucide="arrow-down" class="w-4 h-4"></i> Redondear Abajo</button>
                    ${hasFinal ? `<button onclick="clearFinalGrade('${student.id}')" class="px-4 py-2 bg-rose-500 text-white rounded-xl font-black text-sm hover:bg-rose-600 transition shadow-lg shadow-rose-500/30 flex items-center gap-1"><i data-lucide="x-circle" class="w-4 h-4"></i> Quitar Final</button>` : ''}
                </div>
                <div class="flex flex-col items-center justify-center ${trajBg} p-5 w-full rounded-2xl ring-1 shadow-inner backdrop-blur-md transition-colors mt-6"><div class="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-2 flex items-center gap-2"><i data-lucide="compass" class="w-3 h-3"></i> Diagnóstico</div><div class="font-black text-3xl ${trajColor} tracking-tighter mb-2">${trajLabel}</div><div class="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">${trajDesc}</div></div>
                <div class="w-full mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <label class="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2"><i data-lucide="message-square" class="w-4 h-4"></i> Observaciones</label>
                    <textarea id="obs-${student.id}" class="w-full mt-2 p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner text-sm font-medium resize-none" rows="3" placeholder="Agrega comentarios sobre el desempeño...">${escapeHtml(obs)}</textarea>
                    <button onclick="saveStudentObservation('${student.id}')" class="mt-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-apple-blue hover:text-white transition-all no-print">Guardar</button>
                </div>
            </div></div>
        </div>`;
    };

    const tabClsActive = 'bg-white dark:bg-slate-700 text-apple-blue dark:text-sky-400 shadow-lg ring-1 ring-black/5 dark:ring-white/10 scale-105 z-10 relative';
    const tabClsNormal = 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 z-0 relative';

    return `
    <div class="absolute inset-0 bg-slate-100/60 dark:bg-slate-900/80 backdrop-blur-3xl z-40 animate-fade-in p-4 sm:p-6 md:p-10 overflow-y-auto custom-scrollbar flex justify-center">
        <div class="w-full max-w-5xl pb-20 relative mt-8 md:mt-12">
            <div class="flex items-center gap-2 absolute -top-6 -right-6 md:fixed md:top-10 md:right-10 z-50 no-print">
                <button onclick="printStudentReport('${student.id}')" class="w-14 h-14 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-apple-blue hover:bg-sky-50 dark:hover:bg-sky-900/50 transition-all shadow-2xl flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700 hover:scale-110 focus:outline-none"><i data-lucide="printer" class="w-6 h-6"></i></button>
                <button onclick="state.ui.activeStudentId=null; save(); render()" class="w-14 h-14 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/50 transition-all shadow-2xl flex items-center justify-center ring-2 ring-slate-200 dark:ring-slate-700 hover:rotate-90 hover:scale-110 focus:outline-none focus:ring-rose-400"><i data-lucide="x" class="w-6 h-6"></i></button>
            </div>
            <div class="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 text-center md:text-left">
                <div class="w-32 h-32 bg-gradient-to-br from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-[36px] flex shrink-0 items-center justify-center font-black text-6xl text-slate-400 dark:text-slate-300 shadow-2xl ring-4 ring-white dark:ring-slate-900 rotate-3 hover:rotate-0 transition-transform duration-500">${student.name.charAt(0)}</div>
                <div class="mt-2 flex-1"><h2 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white mb-4 drop-shadow-sm">${escapeHtml(student.name)}</h2><div class="flex flex-wrap justify-center md:justify-start items-center gap-4"><span class="px-4 py-1.5 bg-apple-blue/10 text-apple-blue dark:bg-sky-500/20 dark:text-sky-400 rounded-xl text-xs font-black uppercase tracking-[0.2em] ring-1 ring-apple-blue/20">LEGAJO ACADÉMICO</span><span class="text-slate-500 font-bold text-sm bg-white/60 dark:bg-slate-800/60 px-4 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm backdrop-blur-sm hidden sm:flex items-center gap-2"><i data-lucide="keyboard" class="w-4 h-4 opacity-70"></i>Presiona <kbd class="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 dark:text-slate-300 ring-1 ring-slate-300 dark:ring-slate-600 shadow-sm">ESC</kbd> para regresar</span></div></div>
            </div>
            <div class="flex bg-slate-200/60 dark:bg-slate-800/80 p-2 rounded-[20px] mb-10 w-full sm:w-max mx-auto md:mx-0 shadow-inner border border-slate-300/50 dark:border-slate-700 backdrop-blur-md no-print">
                <button onclick="setModalTab('ficha')" class="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${tab==='ficha' ? tabClsActive : tabClsNormal}"><i data-lucide="pie-chart" class="w-4 h-4"></i> Dashboard</button>
                <button onclick="setModalTab('boletin')" class="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 ${tab==='boletin' ? tabClsActive : tabClsNormal}"><i data-lucide="list-ordered" class="w-4 h-4"></i> Sábana de Notas</button>
            </div>
            <div class="relative min-h-[400px]">
                ${tab === 'ficha' ? tabResumen() : tabBoletin()}
            </div>
        </div>
    </div>`;
};

// ========================================================================
// FUNCIONES CORE Y CRUD
// ========================================================================
window.toggleAtt = (sId, date) => {
    const term = state.ui.termKey;
    const cId = state.ui.activeCourseId;
    const idx = state.attendance.findIndex(a => a.term === term && a.courseId === cId && a.studentId === sId && a.date === date);
    const current = idx !== -1 ? state.attendance[idx].status : null;
    let next;
    if (!current) next = "P";
    else if (current === "P") next = "T";
    else if (current === "T") next = "A";
    else if (current === "A") next = "M";
    else if (current === "M") next = undefined;
    if (next === undefined) {
        if (idx !== -1) state.attendance.splice(idx, 1);
    } else {
        if (idx !== -1) state.attendance[idx].status = next;
        else state.attendance.push({ id: uid(), term, courseId: cId, studentId: sId, date, status: next });
    }
    save(); render();
};

window.markAll = (date, status) => {
    const term = state.ui.termKey;
    const cId = state.ui.activeCourseId;
    const students = getStudents(cId);
    if (students.length === 0) return notify("No hay alumnos", "info");
    students.forEach(s => {
        const idx = state.attendance.findIndex(a => a.term === term && a.courseId === cId && a.studentId === s.id && a.date === date);
        if (idx !== -1) {
            state.attendance[idx].status = status;
        } else {
            state.attendance.push({ id: uid(), term, courseId: cId, studentId: s.id, date, status });
        }
    });
    save(); render();
    const labels = { P: "Presentes", T: "Tarde", A: "Ausentes", M: "Licencia" };
    notify(`Todos marcados como ${labels[status] || status}`, "success");
};


window.deleteCourse = (courseId) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    if (!confirm(`¿Eliminar la materia "${course.name}" y todos sus datos asociados?`)) return;
    state.courses = state.courses.filter(c => c.id !== courseId);
    state.students = state.students.filter(s => s.courseId !== courseId);
    state.attendance = state.attendance.filter(a => a.courseId !== courseId);
    state.grades = state.grades.filter(g => g.courseId !== courseId);
    state.classLogs = state.classLogs.filter(l => l.courseId !== courseId);
    state.tasks = state.tasks.filter(t => t.courseId !== courseId);
    state.notes = state.notes.filter(n => n.courseId !== courseId);
    state.intensification = state.intensification.filter(i => i.courseId !== courseId);
    state.finalGrades = state.finalGrades.filter(f => f.key.split('|')[0] !== courseId);
    state.planning = state.planning.filter(p => p.courseId !== courseId);
    if (state.ui.activeCourseId === courseId) state.ui.activeCourseId = null;
    save(); render(); notify(`Materia "${course.name}" eliminada`, "success");
};

window.editCourseFull = (courseId) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const mid = "modal-" + uid();
    const days = [
        { value: 1, label: 'Lun' },
        { value: 2, label: 'Mar' },
        { value: 3, label: 'Mié' },
        { value: 4, label: 'Jue' },
        { value: 5, label: 'Vie' }
    ];
    const checkboxes = days.map(d => {
        const checked = course.schedule.days.includes(d.value) ? 'checked' : '';
        return `<label class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer"><input type="checkbox" class="day-checkbox w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-apple-blue focus:ring-apple-blue/30" value="${d.value}" ${checked}>${d.label}</label>`;
    }).join("");

    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `
    <div class="modal-box">
        <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
            <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Editar Materia</h2>
            <button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre</label><input id="ec-name-${mid}" class="w-full p-4 rounded-2xl text-xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${escapeHtml(course.name)}"></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Sección</label><input id="ec-section-${mid}" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${escapeHtml(course.section || 'General')}"></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Días de clase</label><div class="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">${checkboxes}</div></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Hora inicio</label><input id="ec-start-${mid}" type="time" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${course.schedule.start || '08:00'}"></div>
                <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Hora fin</label><input id="ec-end-${mid}" type="time" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${course.schedule.end || '10:00'}"></div>
            </div>
            <button onclick="submitEditCourse('${courseId}','${mid}')" class="w-full py-4 bg-apple-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 hover:bg-sky-600 hover:-translate-y-1 transition-all">Guardar Cambios</button>
        </div>
    </div>`;
    document.body.appendChild(m); lucide.createIcons();
};

window.submitEditCourse = (courseId, mid) => {
    const name = document.getElementById(`ec-name-${mid}`).value.trim();
    const section = document.getElementById(`ec-section-${mid}`).value.trim() || "General";
    const start = document.getElementById(`ec-start-${mid}`).value || "08:00";
    const end = document.getElementById(`ec-end-${mid}`).value || "10:00";
    const checkboxes = document.querySelectorAll(`#${mid} .day-checkbox`);
    const days = [];
    checkboxes.forEach(cb => { if (cb.checked) days.push(parseInt(cb.value, 10)); });
    if (!name || days.length === 0) { notify("Nombre y al menos un día son obligatorios", "error"); return; }
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    course.name = name;
    course.section = section;
    course.schedule.days = days;
    course.schedule.start = start;
    course.schedule.end = end;
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Materia actualizada", "success");
};

window.ModalCourse = () => {
    const mid = "modal-" + uid();
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    const days = [
        { value: 1, label: 'Lun' },
        { value: 2, label: 'Mar' },
        { value: 3, label: 'Mié' },
        { value: 4, label: 'Jue' },
        { value: 5, label: 'Vie' }
    ];
    const checkboxes = days.map(d => `
        <label class="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" class="day-checkbox w-5 h-5 rounded-md border-slate-300 dark:border-slate-600 text-apple-blue focus:ring-apple-blue/30" value="${d.value}" checked>
            ${d.label}
        </label>
    `).join("");

    m.innerHTML = `
    <div class="modal-box">
        <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
            <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Nueva Materia</h2>
            <button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Nombre Oficial</label><input id="nc-name-${mid}" class="w-full p-4 rounded-2xl text-xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" placeholder="Ej: Sistemas Operativos..."></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Sección (opcional)</label><input id="nc-section-${mid}" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" placeholder="Ej: A, B, T.M., etc."></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Días de clase</label><div class="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">${checkboxes}</div><p class="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">Selecciona los días en que se dicta la materia</p></div>
            <div class="grid grid-cols-2 gap-4">
                <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Hora inicio</label><input id="nc-start-${mid}" type="time" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="08:00"></div>
                <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Hora fin</label><input id="nc-end-${mid}" type="time" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="10:00"></div>
            </div>
            <button onclick="submitCourse('${mid}')" class="w-full py-4 bg-apple-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 hover:bg-sky-600 hover:-translate-y-1 transition-all">Instanciar</button>
        </div>
    </div>`;
    document.body.appendChild(m);
    lucide.createIcons();
    setTimeout(() => document.getElementById(`nc-name-${mid}`).focus(), 100);
};

window.submitCourse = (mid) => {
    const nameInput = document.getElementById(`nc-name-${mid}`);
    const sectionInput = document.getElementById(`nc-section-${mid}`);
    const startInput = document.getElementById(`nc-start-${mid}`);
    const endInput = document.getElementById(`nc-end-${mid}`);
    const checkboxes = document.querySelectorAll(`#${mid} .day-checkbox`);
    const name = nameInput.value.trim();
    if (!name) { nameInput.classList.add('ring-2', 'ring-rose-500'); return notify("El nombre no puede estar vacío", "error"); }
    const selectedDays = [];
    checkboxes.forEach(cb => { if (cb.checked) selectedDays.push(parseInt(cb.value, 10)); });
    if (selectedDays.length === 0) { notify("Selecciona al menos un día de clase", "error"); return; }
    const section = sectionInput.value.trim() || "General";
    const start = startInput.value || "08:00";
    const end = endInput.value || "10:00";
    const newCourse = {
        id: uid(),
        name,
        section,
        schedule: { days: selectedDays, start, end },
        categories: [],
        classroomCourseId: null
    };
    state.courses.push(newCourse);
    state.ui.activeCourseId = newCourse.id;
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(true); notify(`Materia creada: ${name} (${section})`, "success");
};

window.ModalGrade = (sId, sName, editObj = null) => {
    const mid = "modal-" + uid();
    const defScore = editObj && editObj.score !== null && editObj.score !== "" ? editObj.score : "";
    const defTitle = editObj ? editObj.title : "";
    const defNE = editObj ? editObj.noEntregado : false;
    const editId = editObj ? editObj.id : "";
    const defType = editObj ? editObj.evaluationType : "";
    const evalTypes = state.settings.evaluationTypes || [];
    const evalOptions = evalTypes.map(t => `<option value="${escapeHtml(t)}" ${defType === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box"><div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md"><h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">${editId ? 'Corregir Calificación' : 'Nueva Evaluación'}</h2><div class="inline-block mt-2 px-3 py-1 bg-apple-blue/10 text-apple-blue dark:bg-sky-500/20 dark:text-sky-400 rounded-md text-xs font-black uppercase tracking-widest">${escapeHtml(sName)}</div><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-8"><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Estado</label><div class="flex gap-2 p-1 bg-slate-100/50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-slate-700"><button id="btn-entregado-${mid}" onclick="setDeliveryModal('${mid}', false)" class="flex-1 py-3.5 border rounded-xl font-black transition-all ${!defNE ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105' : 'bg-white/50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 opacity-70'}"><i data-lucide="check" class="w-4 h-4 inline mr-1"></i> Entregado</button><button id="btn-noentregado-${mid}" onclick="setDeliveryModal('${mid}', true)" class="flex-1 py-3.5 border rounded-xl font-black transition-all ${defNE ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30 scale-105' : 'bg-white/50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 opacity-70'}"><i data-lucide="x" class="w-4 h-4 inline mr-1"></i> No Entregó</button></div><input type="hidden" id="ng-noentregado-${mid}" value="${defNE}"></div>
    <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Calificación</label><div class="relative w-1/2 mx-auto"><input id="ng-score-${mid}" type="number" step="0.5" class="w-full p-4 rounded-2xl font-black text-4xl text-center bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/20" placeholder="-" value="${defScore}"></div></div>
    <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipo de Evaluación</label><select id="ng-type-${mid}" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner border-none focus:ring-4 focus:ring-apple-blue/30"><option value="">Sin tipo</option>${evalOptions}</select></div>
    <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Título</label><input id="ng-title-${mid}" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner" placeholder="Ej: TP 1" value="${escapeHtml(defTitle)}"></div>
    <input type="hidden" id="ng-id-${mid}" value="${escapeHtml(editId)}"><div class="flex gap-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">${editId ? `<button onclick="deleteGrade('${editId}','${mid}')" class="px-5 py-4 bg-white dark:bg-slate-900 text-rose-500 font-black rounded-2xl transition-all hover:bg-rose-50 dark:hover:bg-rose-900/30 border border-slate-200 dark:border-slate-700 shadow-sm"><i data-lucide="trash-2" class="w-6 h-6"></i></button>` : ''}<button onclick="submitGradeModal('${sId}','${mid}')" class="flex-1 py-4 bg-apple-blue text-white font-black text-lg rounded-2xl shadow-xl shadow-sky-500/30 hover:-translate-y-1 hover:bg-sky-600 transition-all">${editId ? 'Guardar' : 'Registrar'}</button></div></div></div>`;
    document.body.appendChild(m); lucide.createIcons(); setTimeout(() => document.getElementById(`ng-score-${mid}`).focus(), 100);
};

window.setDeliveryModal = (mid, isNE) => {
    const inp = document.getElementById(`ng-noentregado-${mid}`);
    const btnE = document.getElementById(`btn-entregado-${mid}`);
    const btnNE = document.getElementById(`btn-noentregado-${mid}`);
    if (!inp || !btnE || !btnNE) return;
    inp.value = isNE.toString();
    btnE.className = `flex-1 py-3.5 border rounded-xl font-black transition-all ${!isNE ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105' : 'bg-white/50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 opacity-70'}`;
    btnNE.className = `flex-1 py-3.5 border rounded-xl font-black transition-all ${isNE ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30 scale-105' : 'bg-white/50 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 opacity-70'}`;
};

window.submitGradeModal = (sId, mid) => {
    const score = document.getElementById(`ng-score-${mid}`).value.trim();
    const scoreNum = score !== "" ? parseFloat(score) : null;
    const noEntregado = document.getElementById(`ng-noentregado-${mid}`).value === "true";
    const title = document.getElementById(`ng-title-${mid}`).value.trim();
    const editId = document.getElementById(`ng-id-${mid}`).value;
    const evalType = document.getElementById(`ng-type-${mid}`).value;
    if (!title) { document.getElementById(`ng-title-${mid}`).classList.add('ring-2','ring-rose-500'); return notify("Título obligatorio", "error"); }
    const term = state.ui.termKey;
    const cId = state.ui.activeCourseId;
    const mIdx = state.ui.selectedMonthIdx;
    const date = `${new Date().getFullYear()}-${String(mIdx+1).padStart(2,'0')}-15`;
    if (editId) {
        const idx = state.grades.findIndex(g => g.id === editId);
        if (idx !== -1) { state.grades[idx].title = title; state.grades[idx].score = scoreNum; state.grades[idx].noEntregado = noEntregado; state.grades[idx].evaluationType = evalType; }
        else return notify("Error de ID", "error");
    } else {
        state.grades.push({ id: uid(), term, courseId: cId, studentId: sId, type: 'tps', title, score: scoreNum, date, noEntregado, isIntensification: false, evaluationType: evalType });
    }
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Calificación registrada", "success");
};

window.deleteGrade = (gId, mid) => {
    if (confirm("¿Eliminar definitivamente?")) {
        state.grades = state.grades.filter(g => g.id !== gId);
        const modal = document.getElementById(mid); if (modal) modal.remove();
        save(); render(); notify("Eliminado", "success");
    }
};

window.loadGradeToEdit = (sId, sName, gId) => {
    const g = state.grades.find(gr => gr.id === gId);
    if (g) ModalGrade(sId, sName, g);
    else notify("Registro no encontrado", "error");
};

window.editLogEntry = (logId) => {
    const log = state.classLogs.find(l => l.id === logId);
    if (!log) return notify("Entrada no encontrada", "error");
    const mid = "modal-" + uid();
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `
    <div class="modal-box">
        <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
            <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Editar Entrada del Libro</h2>
            <button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6">
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha</label><input id="el-date-${mid}" type="date" class="w-full p-4 rounded-2xl font-black bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${log.date}"></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Tema</label><textarea id="el-content-${mid}" class="w-full p-4 rounded-2xl font-medium bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" rows="3">${escapeHtml(log.content)}</textarea></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Observaciones</label><textarea id="el-remarks-${mid}" class="w-full p-4 rounded-2xl font-medium bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" rows="2">${escapeHtml(log.remarks || '')}</textarea></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Actividad Asignada</label><input id="el-hw-${mid}" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${escapeHtml(log.homework || '')}"></div>
            <div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha Límite</label><input id="el-due-${mid}" type="date" class="w-full p-4 rounded-2xl font-black bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-apple-blue/30 border-none" value="${log.due || ''}"></div>
            <button onclick="submitEditLog('${logId}','${mid}')" class="w-full py-4 bg-apple-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 hover:bg-sky-600 hover:-translate-y-1 transition-all">Guardar Cambios</button>
        </div>
    </div>`;
    document.body.appendChild(m); lucide.createIcons();
};

window.submitEditLog = (logId, mid) => {
    const log = state.classLogs.find(l => l.id === logId);
    if (!log) return notify("Error", "error");
    const date = document.getElementById(`el-date-${mid}`).value;
    const content = document.getElementById(`el-content-${mid}`).value.trim();
    const remarks = document.getElementById(`el-remarks-${mid}`).value.trim();
    const hw = document.getElementById(`el-hw-${mid}`).value.trim();
    const due = document.getElementById(`el-due-${mid}`).value;
    if (!date || !content) { notify("Fecha y Tema son obligatorios", "error"); return; }
    if (log.homework) {
        const oldTitle = `[Libro] ${log.homework}`;
        state.tasks = state.tasks.filter(t => !(t.title === oldTitle && t.courseId === log.courseId));
    }
    log.date = date; log.content = content; log.remarks = remarks; log.homework = hw; log.due = due;
    if (hw && due) {
        const title = `[Libro] ${hw}`;
        const exists = state.tasks.some(t => t.title === title && t.dueDate === due && t.courseId === log.courseId);
        if (!exists) {
            state.tasks.push({ id: uid(), term: log.term, courseId: log.courseId, title, dueDate: due });
        }
    }
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Entrada actualizada", "success");
};

window.ModalNote = (editId = null) => {
    const mid = "modal-" + uid();
    const note = editId ? state.notes.find(n => n.id === editId) : null;
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box flex flex-col h-[85vh] md:h-[75vh]"><div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center shrink-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md"><h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2"><i data-lucide="sticky-note" class="w-6 h-6 text-purple-500"></i>${editId ? 'Editar' : 'Crear'} Post-it</h2><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-6 lg:p-8 flex-1 flex flex-col min-h-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Concepto</label><input id="note-title-${mid}" class="w-full p-4 rounded-xl font-black text-xl mb-6 shrink-0 bg-white dark:bg-slate-900 shadow-inner focus:ring-2 focus:ring-purple-500 border-none" placeholder="Ej: Conformación Grupos..." value="${note ? escapeHtml(note.title) : ''}"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Texto</label><textarea id="note-content-${mid}" class="w-full flex-1 p-5 rounded-2xl text-base font-medium resize-none custom-scrollbar bg-white dark:bg-slate-900 shadow-inner focus:ring-2 focus:ring-purple-500 border-none leading-relaxed" placeholder="Escribe aquí...">${note ? escapeHtml(note.content) : ''}</textarea><div class="pt-6 shrink-0 flex gap-4"><button onclick="submitNote('${mid}','${editId||''}')" class="flex-1 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-purple-500/30 hover:-translate-y-1 transition-all">Guardar</button></div></div></div>`;
    document.body.appendChild(m); lucide.createIcons(); setTimeout(() => document.getElementById(`note-title-${mid}`).focus(), 100);
};

window.submitNote = (mid, editId) => {
    const title = document.getElementById(`note-title-${mid}`).value.trim();
    const content = document.getElementById(`note-content-${mid}`).value.trim();
    if (!title) { document.getElementById(`note-title-${mid}`).classList.add('ring-2','ring-rose-500'); return notify("Título requerido", "error"); }
    if (editId) {
        const idx = state.notes.findIndex(n => n.id === editId);
        if (idx > -1) { state.notes[idx].title = title; state.notes[idx].content = content; }
    } else {
        state.notes.push({ id: uid(), courseId: state.ui.activeCourseId, title, content, date: todayISO() });
    }
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Apunte guardado", "success");
};

window.deleteNote = (id) => {
    if (confirm("¿Eliminar este apunte?")) { state.notes = state.notes.filter(n => n.id !== id); save(); render(); notify("Eliminado", "success"); }
};

window.submitClassLog = () => {
    const date = document.getElementById('log-date').value;
    const content = document.getElementById('log-content').value.trim();
    const remarks = document.getElementById('log-remarks').value.trim();
    const hw = document.getElementById('log-hw').value.trim();
    const due = document.getElementById('log-due').value;
    if (!date || !content) { notify("Faltan datos", "error"); return; }
    state.classLogs.push({ id: uid(), term: state.ui.termKey, courseId: state.ui.activeCourseId, date, content, homework: hw, due, remarks });
    if (hw && due) {
        const exists = state.tasks.some(t => t.title === `[Libro] ${hw}` && t.dueDate === due && t.courseId === state.ui.activeCourseId);
        if (!exists) {
            state.tasks.push({ id: uid(), term: state.ui.termKey, courseId: state.ui.activeCourseId, title: `[Libro] ${hw}`, dueDate: due });
        }
    }
    document.getElementById('log-content').value = '';
    document.getElementById('log-remarks').value = '';
    document.getElementById('log-hw').value = '';
    document.getElementById('log-due').value = '';
    save(); render(); notify("Clase firmada", "success");
};

window.deleteLog = (id) => {
    if (confirm("¿Remover esta entrada?")) { state.classLogs = state.classLogs.filter(l => l.id !== id); save(); render(); notify("Removida", "success"); }
};

window.ModalStudentAdd = () => {
    const name = prompt("Nombre completo del estudiante:");
    if (name && name.trim()) {
        state.students.push({ id: uid(), courseId: state.ui.activeCourseId, name: name.trim(), observations: "", classroomStudentId: null });
        save(); render(); notify(`Matriculado: ${name.trim()}`, "success");
    }
};

window.editStudent = (id) => {
    const s = state.students.find(st => st.id === id);
    if (!s) return;
    const newName = prompt("Corregir nombre:", s.name);
    if (newName && newName.trim() && newName !== s.name) { s.name = newName.trim(); save(); render(); notify("Actualizado", "success"); }
};

window.deleteStudent = (id) => {
    if (confirm("¿Dar de baja definitiva?")) {
        state.students = state.students.filter(s => s.id !== id);
        state.grades = state.grades.filter(g => g.studentId !== id);
        state.attendance = state.attendance.filter(a => a.studentId !== id);
        state.intensification = state.intensification.filter(i => i.studentId !== id);
        state.finalGrades = state.finalGrades.filter(f => f.key.split('|')[1] !== id);
        save(); render(); notify("Baja realizada", "success");
    }
};

window.addTaskPrompt = () => {
    const title = prompt("Título de la tarea:");
    if (title && title.trim()) {
        let due = prompt("Fecha de vencimiento (YYYY-MM-DD):", todayISO());
        if (due && /^\d{4}-\d{2}-\d{2}$/.test(due)) {
            state.tasks.push({ id: uid(), term: state.ui.termKey, courseId: state.ui.activeCourseId, title: title.trim(), dueDate: due });
        } else {
            notify("Fecha inválida, se usará hoy", "error");
            state.tasks.push({ id: uid(), term: state.ui.termKey, courseId: state.ui.activeCourseId, title: title.trim(), dueDate: todayISO() });
        }
        save(); render(); notify("Tarea agregada", "success");
    }
};

window.editTask = (id) => {
    const t = state.tasks.find(ts => ts.id === id);
    if (!t) return;
    const newTitle = prompt("Modificar título:", t.title);
    if (newTitle && newTitle.trim() && newTitle !== t.title) { t.title = newTitle.trim(); save(); render(); notify("Actualizado", "success"); }
};

window.deleteTask = (id) => {
    if (confirm("¿Eliminar esta tarea?")) { state.tasks = state.tasks.filter(t => t.id !== id); save(); render(); notify("Eliminada", "success"); }
};

window.setPeriod = (p) => { state.ui.intensificationPeriod = p; save(); render(); };
window.updateIntStatus = (sId, status, pk) => {
    const idx = state.intensification.findIndex(i => i.courseId === state.ui.activeCourseId && i.studentId === sId && i.periodKey === pk);
    if (idx > -1) { state.intensification[idx].status = status; save(); render(); notify("Estado actualizado", "success"); }
};
window.updateIntPlan = (sId, plan, pk) => {
    const idx = state.intensification.findIndex(i => i.courseId === state.ui.activeCourseId && i.studentId === sId && i.periodKey === pk);
    if (idx > -1) { state.intensification[idx].plan = plan; save(); }
};
window.removeFromIntensification = (sId, pk) => {
    if (!confirm("¿Retirar de la mesa?")) return;
    state.intensification = state.intensification.filter(i => !(i.courseId === state.ui.activeCourseId && i.studentId === sId && i.periodKey === pk));
    save(); render(); notify("Retirado", "success");
};
window.addStudentToIntensification = () => {
    const cId = state.ui.activeCourseId;
    const period = state.ui.intensificationPeriod;
    const year = new Date().getFullYear();
    const pk = `${period}${period === "December" ? year : year + 1}`;
    const existing = state.intensification.filter(i => i.courseId === cId && i.periodKey === pk).map(i => i.studentId);
    const available = getStudents(cId).filter(s => !existing.includes(s.id));
    if (available.length === 0) return notify("No hay alumnos disponibles", "info");
    const mid = "modal-" + uid();
    const options = available.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box"><div class="p-5 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md"><h2 class="text-xl font-black tracking-tight text-slate-900 dark:text-white">Incluir Manual</h2><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Alumno</label><select id="add-int-student" class="w-full p-4 pl-5 rounded-xl font-bold mb-8 bg-white dark:bg-slate-900 shadow-inner focus:ring-2 focus:ring-amber-500 border-none">${options}</select><button onclick="confirmAddToInt('${pk}','${mid}')" class="w-full py-4 bg-amber-500 text-white rounded-xl font-black text-lg shadow-xl shadow-amber-500/30 hover:-translate-y-1 hover:bg-amber-600 transition-all">Convocar</button></div></div>`;
    document.body.appendChild(m); lucide.createIcons();
};
window.confirmAddToInt = (pk, mid) => {
    const sel = document.getElementById('add-int-student');
    if (!sel) return;
    state.intensification.push({ courseId: state.ui.activeCourseId, studentId: sel.value, periodKey: pk, status: "pending", plan: "" });
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Agregado a la mesa", "success");
};

window.addIntGrade = (sId, sName, pk) => {
    const mid = "modal-" + uid();
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box"><div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md"><h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2"><i data-lucide="file-check-2" class="w-6 h-6 text-amber-500"></i> Calificar Examen</h2><div class="inline-block mt-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-md text-xs font-black uppercase tracking-widest">${escapeHtml(sName)}</div><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6"><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Nota</label><input id="int-grade-score-${mid}" type="number" step="0.5" class="w-2/3 mx-auto block p-5 rounded-2xl font-black text-5xl text-center mb-2 bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-amber-500/30 text-amber-600 dark:text-amber-400 border-none" placeholder="0"></div><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Instancia</label><input id="int-grade-title-${mid}" class="w-full p-4 rounded-xl font-bold bg-white dark:bg-slate-900 shadow-inner border-none focus:ring-2 focus:ring-amber-500" placeholder="Ej: Oral Integrador"></div><div><button onclick="confirmAddIntGrade('${sId}','${pk}','${mid}')" class="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-500/30 hover:-translate-y-1 hover:bg-amber-600 transition-all">Asentar</button></div></div></div>`;
    document.body.appendChild(m); lucide.createIcons(); setTimeout(() => document.getElementById(`int-grade-score-${mid}`).focus(), 100);
};

window.confirmAddIntGrade = (sId, pk, mid) => {
    const score = parseFloat(document.getElementById(`int-grade-score-${mid}`).value);
    const title = document.getElementById(`int-grade-title-${mid}`).value.trim();
    if (!title || isNaN(score)) { notify("Completa todos los campos", "error"); return; }
    state.grades.push({ id: uid(), term: 'INT', courseId: state.ui.activeCourseId, studentId: sId, type: 'evals', title, score, date: todayISO(), isIntensification: true, periodKey: pk, noEntregado: false });
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Nota registrada", "success");
};

window.editIntGrade = (sId, sName, gId, pk) => {
    const g = state.grades.find(gr => gr.id === gId);
    if (!g) return;
    const mid = "modal-" + uid();
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box"><div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md"><h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Editar Examen</h2><div class="inline-block mt-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-md text-xs font-black uppercase tracking-widest">${escapeHtml(sName)}</div><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6"><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Nota</label><input id="int-grade-score-${mid}" type="number" step="0.5" class="w-2/3 mx-auto block p-5 rounded-2xl font-black text-5xl text-center mb-2 bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-amber-500/30 text-amber-600 dark:text-amber-400 border-none" value="${g.score}"></div><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Instancia</label><input id="int-grade-title-${mid}" class="w-full p-4 rounded-xl font-bold bg-white dark:bg-slate-900 shadow-inner border-none focus:ring-2 focus:ring-amber-500" value="${escapeHtml(g.title)}"></div><div class="flex gap-4 pt-4 border-t"><button onclick="deleteIntGrade('${gId}','${mid}')" class="px-5 py-4 bg-white dark:bg-slate-900 text-rose-500 font-black rounded-2xl hover:bg-rose-50 border border-slate-200 dark:border-slate-700 shadow-sm"><i data-lucide="trash-2" class="w-6 h-6"></i></button><button onclick="confirmEditIntGrade('${gId}','${mid}')" class="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-amber-500/30 hover:-translate-y-1 hover:bg-amber-600 transition-all">Guardar</button></div></div></div>`;
    document.body.appendChild(m); lucide.createIcons();
};

window.confirmEditIntGrade = (gId, mid) => {
    const score = parseFloat(document.getElementById(`int-grade-score-${mid}`).value);
    const title = document.getElementById(`int-grade-title-${mid}`).value.trim();
    if (!title || isNaN(score)) { notify("Datos inválidos", "error"); return; }
    const idx = state.grades.findIndex(g => g.id === gId);
    if (idx > -1) { state.grades[idx].score = score; state.grades[idx].title = title; }
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Actualizado", "success");
};

window.deleteIntGrade = (gId, mid) => {
    if (confirm("¿Anular esta nota?")) {
        state.grades = state.grades.filter(g => g.id !== gId);
        const modal = document.getElementById(mid); if (modal) modal.remove();
        save(); render(); notify("Anulado", "success");
    }
};

window.ModalPlanning = (editId = null) => {
    const mid = "modal-" + uid();
    const item = editId ? state.planning.find(p => p.id === editId) : null;
    const week = item ? item.week : (state.planning.length > 0 ? Math.max(...state.planning.map(p => p.week)) + 1 : 1);
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box"><div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md"><h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">${editId ? 'Editar' : 'Nueva'} Planeación</h2><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6"><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Semana</label><input id="plan-week-${mid}" type="number" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-purple-500/30 border-none" value="${week}" min="1"></div><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Tema</label><input id="plan-topic-${mid}" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-purple-500/30 border-none" placeholder="Ej: Introducción" value="${item ? escapeHtml(item.topic) : ''}"></div><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Objetivos</label><textarea id="plan-objectives-${mid}" class="w-full p-4 rounded-2xl font-medium resize-none bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-purple-500/30 border-none" rows="2">${item ? escapeHtml(item.objectives) : ''}</textarea></div><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Materiales</label><textarea id="plan-materials-${mid}" class="w-full p-4 rounded-2xl font-medium resize-none bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-purple-500/30 border-none" rows="2">${item ? escapeHtml(item.materials) : ''}</textarea></div><div><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha (opcional)</label><input id="plan-date-${mid}" type="date" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner focus:ring-4 focus:ring-purple-500/30 border-none" value="${item ? item.date : ''}"></div><input type="hidden" id="plan-id-${mid}" value="${editId || ''}"><button onclick="submitPlanning('${mid}')" class="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-purple-500/30 hover:-translate-y-1 transition-all">Guardar</button></div></div>`;
    document.body.appendChild(m); lucide.createIcons(); setTimeout(() => document.getElementById(`plan-topic-${mid}`).focus(), 100);
};

window.submitPlanning = (mid) => {
    const week = parseInt(document.getElementById(`plan-week-${mid}`).value);
    const topic = document.getElementById(`plan-topic-${mid}`).value.trim();
    const objectives = document.getElementById(`plan-objectives-${mid}`).value.trim();
    const materials = document.getElementById(`plan-materials-${mid}`).value.trim();
    const date = document.getElementById(`plan-date-${mid}`).value;
    const editId = document.getElementById(`plan-id-${mid}`).value;
    if (!topic || isNaN(week) || week < 1) { notify("Completa los campos obligatorios", "error"); return; }
    const courseId = state.ui.activeCourseId;
    if (editId) {
        const idx = state.planning.findIndex(p => p.id === editId);
        if (idx > -1) state.planning[idx] = { ...state.planning[idx], week, topic, objectives, materials, date };
    } else {
        const exists = state.planning.some(p => p.courseId === courseId && p.week === week);
        if (exists) { notify("Ya existe una planificación para esa semana", "error"); return; }
        state.planning.push({ id: uid(), courseId, week, topic, objectives, materials, date });
    }
    const modal = document.getElementById(mid); if (modal) modal.remove();
    save(); render(); notify("Planeación guardada", "success");
};

window.editPlanning = (id) => { ModalPlanning(id); };
window.deletePlanning = (id) => {
    if (confirm("¿Eliminar esta entrada?")) { state.planning = state.planning.filter(p => p.id !== id); save(); render(); notify("Eliminada", "success"); }
};

window.editCategories = (courseId) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const mid = "modal-" + uid();
    const cats = course.categories || [];
    let list = cats.map((cat, idx) => `
        <div class="flex items-center gap-3 mb-3">
            <input type="text" value="${escapeHtml(cat.name)}" placeholder="Nombre" class="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-inner" data-cat-name="${idx}">
            <input type="color" value="${cat.color || '#0ea5e9'}" class="w-12 h-12 rounded-xl border-none" data-cat-color="${idx}">
            <input type="number" step="0.1" value="${cat.weight || 1}" placeholder="Peso" class="w-20 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-inner" data-cat-weight="${idx}">
            <button onclick="removeCategory(${idx},'${courseId}')" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
    `).join("");
    const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
    m.innerHTML = `<div class="modal-box"><div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md"><h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Categorías</h2><button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button></div><div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar"><div id="categories-container">${list}</div><button onclick="addCategoryField('${courseId}')" class="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-slate-500 font-bold hover:border-apple-blue hover:text-apple-blue transition-all"><i data-lucide="plus" class="w-5 h-5 inline mr-2"></i>Agregar</button><button onclick="saveCategories('${courseId}','${mid}')" class="w-full py-4 bg-apple-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 hover:-translate-y-1 transition-all">Guardar</button></div></div>`;
    document.body.appendChild(m); lucide.createIcons();
};

window.addCategoryField = (courseId) => {
    const container = document.getElementById('categories-container');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex items-center gap-3 mb-3';
    div.innerHTML = `<input type="text" placeholder="Nombre" class="flex-1 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-inner" data-cat-name=""><input type="color" value="#0ea5e9" class="w-12 h-12 rounded-xl border-none" data-cat-color=""><input type="number" step="0.1" value="1" placeholder="Peso" class="w-20 p-3 rounded-xl bg-white dark:bg-slate-900 shadow-inner" data-cat-weight=""><button onclick="this.parentElement.remove()" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"><i data-lucide="x" class="w-5 h-5"></i></button>`;
    container.appendChild(div);
    lucide.createIcons();
};

window.removeCategory = (idx, courseId) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    course.categories.splice(idx, 1);
    save(); render(); editCategories(courseId);
};

window.saveCategories = (courseId, mid) => {
    const course = state.courses.find(c => c.id === courseId);
    if (!course) return;
    const container = document.getElementById('categories-container');
    if (!container) return;
    const items = container.querySelectorAll('div');
    const newCats = [];
    items.forEach(el => {
        const name = el.querySelector('[data-cat-name]');
        const color = el.querySelector('[data-cat-color]');
        const weight = el.querySelector('[data-cat-weight]');
        if (name && name.value.trim()) {
            newCats.push({
                name: name.value.trim(),
                color: color ? color.value : '#0ea5e9',
                weight: parseFloat(weight ? weight.value : 1) || 1
            });
        }
    });
    course.categories = newCats;
    save(); render();
    const modal = document.getElementById(mid); if (modal) modal.remove();
    notify("Categorías actualizadas", "success");
};

window.saveStudentObservation = (studentId) => {
    const ta = document.getElementById(`obs-${studentId}`);
    if (!ta) return;
    const student = state.students.find(s => s.id === studentId);
    if (!student) return;
    student.observations = ta.value;
    save();
    notify("Observación guardada", "success");
};

window.roundGrade = (studentId, direction) => {
    try {
        const term = state.ui.termKey;
        const cId = state.ui.activeCourseId;
        const grades = state.grades.filter(g => g.term === term && g.courseId === cId && g.studentId === studentId && !g.isIntensification);
        const valid = grades.filter(g => g.score !== null && g.score !== "" && !isNaN(parseFloat(g.score)));
        if (valid.length === 0) { notify("No hay calificaciones", "error"); return; }
        const sum = valid.reduce((acc, g) => acc + parseFloat(g.score), 0);
        const avg = sum / valid.length;
        const rounded = direction === 'up' ? Math.ceil(avg) : Math.floor(avg);
        const key = `${cId}|${studentId}|${term}`;
        state.finalGrades = state.finalGrades.filter(f => f.key !== key);
        state.finalGrades.push({ key, grade: rounded });
        save(); render();
        notify(`Nota final redondeada a ${rounded}`, "success");
    } catch (e) { notify("Error", "error"); }
};

window.clearFinalGrade = (studentId) => {
    const term = state.ui.termKey;
    const cId = state.ui.activeCourseId;
    const key = `${cId}|${studentId}|${term}`;
    state.finalGrades = state.finalGrades.filter(f => f.key !== key);
    save(); render();
    notify("Nota final eliminada", "success");
};
// Backup manual (forzar)
window.manualBackupToDrive = async () => {
    if (!accessToken) return notify("Inicia sesión con Google primero", "error");
    try {
        const json = JSON.stringify(state);
        await uploadBackupToDrive(json);
        notify("Backup manual subido a Drive", "success");
    } catch (err) {
        notify("Error al subir backup manual", "error");
    }
};