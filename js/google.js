// js/google.js
// Autenticación Google + Gestión automática de backups en Drive
// + Funciones de Classroom

const BACKUP_FOLDER_NAME = 'DocenteOS_Backups';
let backupIntervalId = null;

// Verificar si el token es válido (llamada ligera)
async function isTokenValid() {
    if (!accessToken) return false;
    try {
        const res = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + accessToken);
        return res.ok;
    } catch (e) {
        return false;
    }
}
window.isTokenValid = isTokenValid;

// Iniciar autenticación (se llama desde el modal o desde settings)
window.initGoogleAuth = () => {
    if (!state) {
        notify("La aplicación se está iniciando. Intenta de nuevo en un momento.", "info");
        return;
    }
    const clientId = state.settings.googleClientId || CLIENT_ID;
    if (!clientId) {
        notify("Configura el Google Client ID en Ajustes", "error");
        return;
    }
    if (typeof google === 'undefined' || !google.accounts) {
        notify("Librería de Google no cargada", "error");
        return;
    }
    const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file ' +
               'https://www.googleapis.com/auth/classroom.courses ' +
               'https://www.googleapis.com/auth/classroom.rosters ' +
               'https://www.googleapis.com/auth/classroom.coursework.students',
        callback: async (resp) => {
            if (resp.error) {
                notify("Error de autenticación: " + resp.error, "error");
                return;
            }
            accessToken = resp.access_token;
            state.settings.googleAuthToken = accessToken;
            save();
            notify("Conectado a Google Drive", "success");
            // Ocultar login, mostrar loading y restaurar
            document.getElementById('login-modal').style.display = 'none';
            document.getElementById('loading').style.display = 'flex';
            await initDriveBackup();
            startAutoBackupToDrive();
            document.getElementById('loading').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('app-layout').classList.remove('hidden');
                render(true);
            }, 700);
        }
    });
    client.requestAccessToken();
};

// Buscar o crear la carpeta de backups en Drive
async function getOrCreateBackupFolder() {
    const query = `name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.files && data.files.length > 0) {
        return data.files[0].id;
    }
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: BACKUP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder'
        })
    });
    if (!createRes.ok) throw new Error(await createRes.text());
    const folder = await createRes.json();
    return folder.id;
}

// Subir backup a Drive
async function uploadBackupToDrive(jsonStr) {
    const folderId = await getOrCreateBackupFolder();
    const fileName = `DocenteOS_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const metadata = {
        name: fileName,
        parents: [folderId]
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form
    });
    if (!res.ok) throw new Error(await res.text());
    await deleteOldBackups(folderId);
    return await res.json();
}

// Eliminar backups más antiguos (dejar solo los últimos 5)
async function deleteOldBackups(folderId) {
    const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    const files = data.files || [];
    if (files.length > 5) {
        const toDelete = files.slice(5);
        for (const file of toDelete) {
            await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${accessToken}` }
            });
        }
    }
}

// Restaurar el último backup de la carpeta
async function restoreLatestBackup() {
    const folderId = await getOrCreateBackupFolder();
    const query = `'${folderId}' in parents and mimeType='application/json' and trashed=false`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&pageSize=1&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (!data.files || data.files.length === 0) return false;
    const fileId = data.files[0].id;
    const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!contentRes.ok) throw new Error(await contentRes.text());
    const json = await contentRes.text();
    const parsed = JSON.parse(json);
    state = parsed;
    const arrays = ['courses','students','attendance','grades','classLogs','tasks','notes','intensification','finalGrades','planning'];
    arrays.forEach(k => { if (!Array.isArray(state[k])) state[k] = []; });
    await saveStateToDB(state);
    return true;
}

// Iniciar restauración al arrancar (solo si token válido)
window.initDriveBackup = async () => {
    if (!(await isTokenValid())) {
        // Token inválido → limpiarlo y mostrar login
        accessToken = null;
        if (state) {
            state.settings.googleAuthToken = '';
            save();
        }
        document.getElementById('login-modal').style.display = 'flex';
        document.getElementById('loading').style.display = 'none';
        return;
    }
    try {
        const restored = await restoreLatestBackup();
        if (restored) {
            notify("Último backup restaurado desde Drive", "success");
        } else {
            notify("No se encontraron backups previos. Comenzando con estado limpio.", "info");
        }
    } catch (err) {
        console.error("Error al restaurar backup:", err);
        notify("No se pudo restaurar el backup. Revisa tu conexión.", "error");
    }
};

// Backup automático cada 5 minutos
function startAutoBackupToDrive() {
    if (backupIntervalId) clearInterval(backupIntervalId);
    backupIntervalId = setInterval(async () => {
        if (!accessToken || !state) return;
        try {
            const json = JSON.stringify(state);
            await uploadBackupToDrive(json);
            console.log("Backup automático subido a Drive");
        } catch (err) {
            console.error("Error en backup automático:", err);
        }
    }, 5 * 60 * 1000);
}

// Forzar backup manual
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

// ===================== FUNCIONES DE CLASSROOM =====================
window.fetchCoursesFromClassroom = async () => {
    if (!accessToken) { notify("Debes iniciar sesión con Google primero", "info"); return; }
    try {
        const response = await fetch('https://classroom.googleapis.com/v1/courses?pageSize=50', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (!response.ok) throw new Error(await response.text());
        const data = await response.json();
        const courses = data.courses || [];
        if (courses.length === 0) { notify("No tienes cursos en Google Classroom", "info"); return; }
        const mid = "modal-" + uid();
        const opts = courses.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.section || 'Sin sección'})</option>`).join("");
        const m = document.createElement('div'); m.id = mid; m.className = 'modal-overlay';
        m.innerHTML = `
        <div class="modal-box">
            <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 relative text-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                <h2 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Vincular materia con Classroom</h2>
                <button onclick="document.getElementById('${mid}').remove()" class="absolute right-5 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"><i data-lucide="x" class="w-5 h-5"></i></button>
            </div>
            <div class="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md space-y-6">
                <div>
                    <label class="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2">Selecciona un curso de Classroom</label>
                    <select id="classroom-course-select" class="w-full p-4 rounded-2xl font-bold bg-white dark:bg-slate-900 shadow-inner">${opts}</select>
                </div>
                <div class="flex gap-4">
                    <button onclick="linkCourseToClassroom('${mid}')" class="flex-1 py-4 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:bg-blue-600 transition">Vincular a materia actual</button>
                    <button onclick="importClassroomAsNewCourse('${mid}')" class="flex-1 py-4 bg-purple-500 text-white rounded-2xl font-black shadow-xl hover:bg-purple-600 transition">Importar como nueva materia</button>
                </div>
            </div>
        </div>`;
        document.body.appendChild(m);
        lucide.createIcons();
    } catch (err) { notify("Error al obtener cursos: " + err.message, "error"); }
};

window.linkCourseToClassroom = async (mid) => { /* ... igual que antes ... */ };
window.importClassroomAsNewCourse = async (mid) => { /* ... igual que antes ... */ };
window.publishTaskToClassroom = async (taskId) => { /* ... igual que antes ... */ };
window.syncGradeToClassroom = async (studentId, gradeId) => { /* ... igual que antes ... */ };
window.importTasksFromClassroom = async () => { /* ... igual que antes ... */ };