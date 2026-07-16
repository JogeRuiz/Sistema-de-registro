// js/vxews/files.js
const FilesView = () => {
    const courseId = state.ui.activeCourseId;

    return `
    <div class="max-w-5xl mx-auto pb-16">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
                <h2 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 flex items-center gap-4">Archivos <i data-lucide="paperclip" class="w-10 h-10 text-sky-500"></i></h2>
                <p class="text-slate-500 font-bold text-xl">Documentos por materia y unidad</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                <div class="relative w-full sm:w-64">
                    <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"></i>
                    <input id="file-unit-filter" type="text" placeholder="Filtrar por unidad..." class="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm font-bold bg-white/80 dark:bg-slate-800/80 border-none shadow-sm focus:ring-2 focus:ring-apple-blue" oninput="refreshFileList()">
                </div>
                <div>
                    <input type="file" id="file-upload-input" class="hidden" onchange="handleFileUpload(this)">
                    <button onclick="document.getElementById('file-upload-input').click()" class="w-full sm:w-auto px-8 py-4 bg-apple-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-sky-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                        <i data-lucide="upload" class="w-5 h-5"></i> Subir archivo
                    </button>
                </div>
            </div>
        </header>

        <div id="files-list-container" class="space-y-4 save-scroll" data-scroll-key="files-list">
            <div class="text-center p-12 text-slate-400 dark:text-slate-500 font-bold">
                <i data-lucide="loader" class="w-8 h-8 mx-auto mb-4 animate-spin"></i>Cargando archivos...
            </div>
        </div>
    </div>`;
};

// Función de inicialización (se llama después de renderizar)
async function initFilesView() {
    const courseId = state.ui.activeCourseId;
    if (!courseId) return;
    await refreshFileList();
}

// Refrescar la lista de archivos
async function refreshFileList(filterUnit = '') {
    const container = document.getElementById('files-list-container');
    if (!container) return;
    const courseId = state.ui.activeCourseId;
    const files = await getFiles(courseId, filterUnit);
    container.innerHTML = renderFileList(files);
    if (window.lucide) lucide.createIcons();
}

// Renderizar la lista de archivos
function renderFileList(files) {
    if (files.length === 0) {
        return `<div class="text-center p-12 text-slate-400 dark:text-slate-500 font-bold"><i data-lucide="file-x" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>No hay archivos adjuntos</div>`;
    }
    return files.map(f => `
        <div class="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 hover:shadow-md transition-shadow">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-apple-blue">
                    <i data-lucide="${getFileIcon(f.fileType)}" class="w-6 h-6"></i>
                </div>
                <div>
                    <div class="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] md:max-w-[400px]" title="${escapeHtml(f.fileName)}">${escapeHtml(f.fileName)}</div>
                    <div class="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span class="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold uppercase">${escapeHtml(f.unit)}</span>
                        <span>${formatFileSize(f.size)}</span>
                        <span>${new Date(f.uploadedAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="downloadFile('${f.id}')" class="p-2 text-slate-500 hover:text-apple-blue hover:bg-sky-50 dark:hover:bg-slate-700 rounded-xl transition" title="Descargar"><i data-lucide="download" class="w-5 h-5"></i></button>
                <button onclick="deleteFileConfirm('${f.id}')" class="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition" title="Eliminar"><i data-lucide="trash-2" class="w-5 h-5"></i></button>
            </div>
        </div>
    `).join("");
}

// Subir archivo
async function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const unit = prompt('Unidad o etiqueta (ej. "Unidad 1", "TP Final"):', 'General');
    if (unit === null) { input.value = ''; return; }
    try {
        await uploadFile(state.ui.activeCourseId, unit, file);
        notify(`Archivo "${file.name}" subido`, 'success');
        input.value = '';
        await refreshFileList(document.getElementById('file-unit-filter')?.value || '');
    } catch (err) {
        notify('Error al subir archivo', 'error');
        console.error(err);
    }
}

// Confirmar eliminación
async function deleteFileConfirm(fileId) {
    if (!confirm('¿Eliminar este archivo permanentemente?')) return;
    await deleteFile(fileId);
    notify('Archivo eliminado', 'success');
    await refreshFileList(document.getElementById('file-unit-filter')?.value || '');
}

// Utilidades de vista
function getFileIcon(type) {
    if (type.includes('pdf')) return 'file-text';
    if (type.includes('image')) return 'image';
    if (type.includes('word') || type.includes('document')) return 'file-text';
    if (type.includes('sheet') || type.includes('excel')) return 'file-spreadsheet';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'presentation';
    return 'file';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}