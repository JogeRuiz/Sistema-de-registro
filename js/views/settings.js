// js/views/settings.js
const SettingsView = () => {
    const s = state.settings;
    const backups = JSON.parse(localStorage.getItem('docenteos_backups') || '[]');
    let backupList = '';
    if (backups.length > 0) {
        backupList = backups.map((b, i) => {
            const date = new Date(b.timestamp).toLocaleString();
            return `<div class="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl mb-3 shadow-sm"><div class="flex items-center gap-3"><i data-lucide="archive" class="w-5 h-5 text-slate-400"></i><span class="text-sm font-bold">Backup ${i+1}: ${date}</span></div><button onclick="restoreBackupByIndex(${i})" class="px-4 py-2 bg-apple-blue text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition">Restaurar</button></div>`;
        }).join("");
    } else {
        backupList = '<p class="text-slate-500 dark:text-slate-400 font-medium p-4 bg-white/40 dark:bg-slate-800/40 rounded-2xl">No hay backups locales almacenados.</p>';
    }

    const evalTypes = state.settings.evaluationTypes || [];
    const typeItems = evalTypes.map(t => `
        <span class="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
            <span class="font-bold text-sm">${escapeHtml(t)}</span>
            <button onclick="removeEvaluationType('${escapeHtml(t)}')" class="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
        </span>
    `).join('');

    const googleSection = `
    <div class="lg-panel p-0 relative overflow-hidden group border-l-8 border-l-purple-500">
        <div class="lg-specular"></div>
        <div class="lg-content p-8 md:p-10">
            <div class="flex flex-col lg:flex-row gap-8 items-start relative z-10">
                <div class="w-20 h-20 bg-purple-100 dark:bg-purple-900/50 rounded-[24px] flex shrink-0 items-center justify-center shadow-inner ring-2 ring-purple-200 dark:ring-purple-800"><i data-lucide="cloud" class="w-10 h-10 text-purple-600 dark:text-purple-400"></i></div>
                <div class="flex-1 w-full">
                    <h3 class="font-black text-3xl text-slate-900 dark:text-white mb-3 tracking-tight">Respaldo Automático en Google Drive</h3>
                    <p class="text-base text-slate-500 font-medium mb-8 leading-relaxed max-w-2xl">
                        Tus datos se guardan automáticamente cada 5 minutos en una carpeta exclusiva de tu Drive. Al iniciar sesión, se restaura la última copia.
                    </p>
                    <div class="flex items-center gap-4 mb-4">
                        <span class="px-4 py-2 rounded-full text-sm font-bold ${accessToken ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}">
                            ${accessToken ? '✅ Conectado' : '❌ No conectado'}
                        </span>
                        ${!accessToken ? `<button onclick="initGoogleAuth()" class="px-6 py-2 bg-purple-500 text-white rounded-xl font-black text-sm hover:bg-purple-600 transition shadow-lg shadow-purple-500/30">Conectar ahora</button>` : ''}
                    </div>
                    <button onclick="manualBackupToDrive()" class="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-600 dark:text-emerald-400 rounded-xl font-black text-sm flex items-center gap-2 transition">
                        <i data-lucide="upload-cloud" class="w-5 h-5"></i> Forzar backup ahora
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    return `
    <div class="max-w-5xl mx-auto pb-16">
        <header class="mb-14">
            <h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-3">Panel de Control</h2>
            <p class="text-slate-500 font-bold text-xl">Configuraciones core y manejo de datos.</p>
        </header>
        <div class="space-y-10">
            <div class="lg-panel p-0 relative overflow-hidden group border-l-8 border-l-amber-500">
                <div class="lg-specular"></div>
                <div class="lg-content p-8 md:p-10">
                    <div class="flex flex-col lg:flex-row gap-8 items-start relative z-10">
                        <div class="w-20 h-20 bg-amber-100 dark:bg-amber-900/50 rounded-[24px] flex shrink-0 items-center justify-center shadow-inner ring-2 ring-amber-200 dark:ring-amber-800"><i data-lucide="target" class="w-10 h-10 text-amber-600 dark:text-amber-400"></i></div>
                        <div class="flex-1 w-full">
                            <h3 class="font-black text-3xl text-slate-900 dark:text-white mb-3 tracking-tight">Arquitectura de Evaluación</h3>
                            <p class="text-base text-slate-500 font-medium mb-8 leading-relaxed max-w-2xl">Modifica los pisos matemáticos para TTA/TED/TEP.</p>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-white/40 dark:bg-black/20 p-8 rounded-3xl border border-white/80 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                                <div class="flex flex-col"><label class="block text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-emerald-500"></div> Piso Mínimo TTA</label><input type="number" step="0.5" onchange="updateSetting('gradeTtaMin', this.value)" value="${s.gradeTtaMin}" class="w-full p-5 rounded-2xl font-black text-4xl text-center text-slate-800 dark:text-white bg-white dark:bg-slate-800 shadow-inner focus:ring-4 focus:ring-emerald-500/30 border-none"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3 text-center">Recomendado: 7</p></div>
                                <div class="flex flex-col"><label class="block text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div class="w-2 h-2 rounded-full bg-amber-500"></div> Piso Mínimo TED</label><input type="number" step="0.5" onchange="updateSetting('gradeTedMin', this.value)" value="${s.gradeTedMin}" class="w-full p-5 rounded-2xl font-black text-4xl text-center text-slate-800 dark:text-white bg-white dark:bg-slate-800 shadow-inner focus:ring-4 focus:ring-amber-500/30 border-none"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3 text-center">Bajo este valor = TEP</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg-panel p-0 relative overflow-hidden group border-l-8 border-l-emerald-500">
                <div class="lg-specular"></div>
                <div class="lg-content p-8 md:p-10">
                    <div class="flex flex-col lg:flex-row gap-8 items-start relative z-10">
                        <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-[24px] flex shrink-0 items-center justify-center shadow-inner ring-2 ring-emerald-200 dark:ring-emerald-800"><i data-lucide="percent" class="w-10 h-10 text-emerald-600 dark:text-emerald-400"></i></div>
                        <div class="flex-1 w-full">
                            <h3 class="font-black text-3xl text-slate-900 dark:text-white mb-3 tracking-tight">Algoritmo de Faltas</h3>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-white/40 dark:bg-black/20 p-8 rounded-3xl border border-white/80 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                                <div class="flex flex-col"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Requisito Aprobatorio (%)</label><input type="number" onchange="updateSetting('attendanceMin', this.value)" value="${s.attendanceMin}" class="w-full p-5 rounded-2xl font-black text-4xl text-center text-slate-800 dark:text-white bg-white dark:bg-slate-800 shadow-inner focus:ring-4 focus:ring-slate-500/30 border-none"></div>
                                <div class="flex flex-col"><label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">Penalidad "Llegada Tarde"</label><input type="number" step="0.1" onchange="updateSetting('lateWeight', this.value)" value="${s.lateWeight}" class="w-full p-5 rounded-2xl font-black text-4xl text-center text-slate-800 dark:text-white bg-white dark:bg-slate-800 shadow-inner focus:ring-4 focus:ring-slate-500/30 border-none"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-3 text-center">Ej: 0.5 = media falta.</p></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="lg-panel p-0 relative overflow-hidden group border-l-8 border-l-indigo-500">
                <div class="lg-specular"></div>
                <div class="lg-content p-8 md:p-10">
                    <div class="flex flex-col lg:flex-row gap-8 items-start relative z-10">
                        <div class="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-[24px] flex shrink-0 items-center justify-center shadow-inner ring-2 ring-indigo-200 dark:ring-indigo-800"><i data-lucide="tags" class="w-10 h-10 text-indigo-600 dark:text-indigo-400"></i></div>
                        <div class="flex-1 w-full">
                            <h3 class="font-black text-3xl text-slate-900 dark:text-white mb-3 tracking-tight">Tipos de Evaluación</h3>
                            <p class="text-base text-slate-500 font-medium mb-8 leading-relaxed max-w-2xl">Define los tipos de evaluación que usarás (Ej: Trabajo Práctico, Examen, Lección Oral).</p>
                            <div class="bg-white/40 dark:bg-black/20 p-8 rounded-3xl border border-white/80 dark:border-slate-700/50 shadow-sm backdrop-blur-sm">
                                <div class="flex flex-wrap gap-3 mb-4">
                                    <input type="text" id="new-eval-type" placeholder="Nuevo tipo..." class="flex-1 p-3 rounded-xl font-bold bg-white dark:bg-slate-800 shadow-inner focus:ring-4 focus:ring-indigo-500/30 border-none min-w-[150px]">
                                    <button onclick="addEvaluationType()" class="px-6 py-3 bg-indigo-500 text-white rounded-xl font-black text-sm hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/30">Agregar</button>
                                </div>
                                <div id="eval-types-list" class="flex flex-wrap gap-2 mb-4">
                                    ${typeItems}
                                </div>
                                <div class="mt-4">
                                    <label class="block text-[10px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Ayuda / Descripción</label>
                                    <textarea id="eval-help-text" class="w-full p-4 rounded-2xl font-medium resize-none bg-white dark:bg-slate-800 shadow-inner focus:ring-4 focus:ring-indigo-500/30 border-none h-24" placeholder="Explicación sobre el uso de tipos...">${escapeHtml(state.settings.evaluationHelp)}</textarea>
                                    <button onclick="saveEvaluationHelp()" class="mt-3 px-6 py-3 bg-indigo-500 text-white rounded-xl font-black text-sm hover:bg-indigo-600 transition">Guardar Ayuda</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${googleSection}

            <div class="lg-panel p-0 relative overflow-hidden group border-l-8 border-l-apple-blue">
                <div class="lg-specular"></div>
                <div class="lg-content p-8 md:p-10">
                    <div class="flex flex-col lg:flex-row gap-8 items-start relative z-10">
                        <div class="w-20 h-20 bg-sky-100 dark:bg-sky-900/50 rounded-[24px] flex shrink-0 items-center justify-center shadow-inner ring-2 ring-sky-200 dark:ring-sky-800"><i data-lucide="hard-drive" class="w-10 h-10 text-apple-blue dark:text-sky-400"></i></div>
                        <div class="flex-1 w-full">
                            <h3 class="font-black text-3xl text-slate-900 dark:text-white mb-3 tracking-tight">Gestión de Datos y Backups</h3>
                            <p class="text-base text-slate-500 font-medium mb-8 leading-relaxed max-w-2xl">Backups automáticos cada 5 minutos (últimas 5 versiones).</p>
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <button onclick="exportToExcel()" class="flex flex-col items-center justify-center gap-3 p-8 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-3xl font-black shadow-xl shadow-emerald-500/40 hover:-translate-y-2 transition-all ring-1 ring-white/30 border-t-2 border-white/40 focus:outline-none focus:ring-4 focus:ring-emerald-500"><i data-lucide="file-spreadsheet" class="w-10 h-10 mb-2"></i><span class="text-xl">Exportar Excel</span><span class="text-[10px] font-black opacity-90 uppercase tracking-widest bg-black/10 px-3 py-1 rounded-full">CSV UTF-8</span></button>
                                <button onclick="exportData()" class="flex flex-col items-center justify-center gap-3 p-8 bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white rounded-3xl font-black shadow-xl hover:-translate-y-2 transition-all ring-1 ring-white/10 border-t-2 border-white/10 focus:outline-none focus:ring-4 focus:ring-slate-500"><i data-lucide="database-backup" class="w-10 h-10 mb-2 text-sky-400"></i><span class="text-xl">Extraer Backup</span><span class="text-[10px] font-black opacity-80 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">.JSON</span></button>
                                <button onclick="document.getElementById('importFile').click()" class="flex flex-col items-center justify-center gap-3 p-8 bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-3xl font-black shadow-sm border-2 border-dashed border-slate-300 dark:border-slate-600 hover:-translate-y-2 hover:bg-white dark:hover:bg-slate-700 hover:border-apple-blue transition-all focus:outline-none focus:ring-4 focus:ring-apple-blue/30 backdrop-blur-md"><i data-lucide="upload-cloud" class="w-10 h-10 mb-2 text-slate-400"></i><span class="text-xl">Inyectar Backup</span><span class="text-[10px] font-black opacity-60 uppercase tracking-widest bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full">Restaurar</span></button>
                                <input type="file" id="importFile" class="hidden" accept=".json" onchange="importData(this)">
                            </div>
                            <div class="mt-8 bg-white/40 dark:bg-black/20 p-6 rounded-3xl border border-white/80 dark:border-slate-700/50">
                                <h4 class="font-black text-lg mb-4 flex items-center gap-2"><i data-lucide="history" class="w-5 h-5"></i> Restaurar desde Backup Local</h4>
                                ${backupList}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};
