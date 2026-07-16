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