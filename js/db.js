// js/db.js
// Motor de persistencia: IndexedDB, backups locales y guardado automático

// --------------- IndexedDB ---------------
const dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject("IndexedDB no soportado"); return; }
    const req = indexedDB.open(DB_NAME, 2); // Versión 2 para incluir 'files'
    req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
        if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'id' });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
});

async function loadStateFromDB() {
    try {
        const db = await dbPromise;
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get('master_state');
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    } catch (error) { return null; }
}

async function saveStateToDB(data) {
    try {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(data, 'master_state');
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (error) { console.error("Error saveStateToDB:", error); }
}

// --------------- Backups locales (localStorage) ---------------


function restoreBackup(index = -1) {
    try {
        const backups = JSON.parse(localStorage.getItem('docenteos_backups') || '[]');
        if (backups.length === 0) return null;
        if (index >= 0 && index < backups.length) {
            return JSON.parse(backups[index].data);
        }
        const latest = backups[backups.length - 1];
        if (latest && latest.data) {
            return JSON.parse(latest.data);
        }
        return null;
    } catch (e) { return null; }
}

// --------------- Guardado principal ---------------
const save = () => { 
    if (!state) return;
    saveStateToDB(state).catch(err => {
        console.error("Fallo save():", err);
        saveBackup(state);
        if (typeof notify === 'function') notify("Fallo al guardar en IndexedDB, se guardó backup local", "error");
    });
};


// --------------- Almacenamiento de archivos ---------------
async function uploadFile(courseId, unit, file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const fileData = {
                id: uid(),
                courseId,
                unit: unit.trim() || "General",
                fileName: file.name,
                fileType: file.type,
                size: file.size,
                uploadedAt: new Date().toISOString(),
                data: reader.result
            };
            try {
                const db = await dbPromise;
                const tx = db.transaction('files', 'readwrite');
                const store = tx.objectStore('files');
                store.add(fileData);
                tx.oncomplete = () => resolve(fileData);
                tx.onerror = (e) => reject(e.target.error);
            } catch (err) { reject(err); }
        };
        reader.onerror = (e) => reject(e.target.error);
        reader.readAsArrayBuffer(file);
    });
}

async function getFiles(courseId, unitFilter = null) {
    try {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const req = store.getAll();
            req.onsuccess = () => {
                let files = req.result.filter(f => f.courseId === courseId);
                if (unitFilter) {
                    files = files.filter(f => f.unit.toLowerCase().includes(unitFilter.toLowerCase()));
                }
                files = files.map(({ data, ...rest }) => rest);
                resolve(files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
            };
            req.onerror = (e) => reject(e.target.error);
        });
    } catch (err) { return []; }
}

async function downloadFile(fileId) {
    try {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const req = store.get(fileId);
            req.onsuccess = () => {
                const file = req.result;
                if (!file) return reject("Archivo no encontrado");
                const blob = new Blob([file.data], { type: file.fileType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                resolve();
            };
            req.onerror = (e) => reject(e.target.error);
        });
    } catch (err) { notify("Error al descargar", "error"); }
}

async function deleteFile(fileId) {
    try {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const req = store.delete(fileId);
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    } catch (err) { console.error(err); }
}