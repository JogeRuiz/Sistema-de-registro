// js/state.js
// Funciones auxiliares y de cálculo para DocenteOS

// --------------- Utilidades generales ---------------
const uid = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const escapeHtml = (s) => {
    if (s === null || s === undefined) return "";
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(s).replace(/[&<>"']/g, m => map[m]);
};

// --------------- Funciones de datos ---------------
const getStudents = (cId) => {
    if (!cId || !state.students) return [];
    let st = state.students.filter(s => s.courseId === cId);
    if (state.ui.searchQuery && state.ui.searchQuery.trim()) {
        const q = state.ui.searchQuery.toLowerCase().trim();
        st = st.filter(s => s.name.toLowerCase().includes(q));
    }
    return st.sort((a,b) => a.name.localeCompare(b.name));
};

// --------------- Sistema de calificaciones ---------------
const getScoreColor = (n) => {
    const num = parseFloat(n);
    if (isNaN(num)) return "text-slate-400 dark:text-slate-500";
    if (num >= state.settings.gradeTtaMin) return "text-emerald-500 dark:text-emerald-400";
    if (num >= state.settings.gradeTedMin) return "text-amber-500 dark:text-amber-400";
    return "text-rose-500 dark:text-rose-400";
};

const getTrajectoryLabel = (n) => {
    const num = parseFloat(n);
    if (isNaN(num)) return "Sin Evaluar";
    if (num >= state.settings.gradeTtaMin) return "TTA";
    if (num >= state.settings.gradeTedMin) return "TED";
    return "TEP";
};

// --------------- Asistencia ---------------
function getDatesForMonth(course, monthIdx) {
    try {
        if (!course || !course.schedule || !course.schedule.days || course.schedule.days.length === 0) return [];
        const dates = [];
        const year = new Date().getFullYear();
        const cursor = new Date(year, monthIdx, 1);
        const allowed = course.schedule.days;
        while (cursor.getMonth() === monthIdx) {
            if (allowed.includes(cursor.getDay())) {
                dates.push(`${year}-${String(monthIdx+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`);
            }
            cursor.setDate(cursor.getDate() + 1);
        }
        return dates;
    } catch (e) { return []; }
}

function calcAtt(term, cId, sId, periodMonths = null) {
    const def = { pct: 100, present: 0, late: 0, absent: 0, total: 0 };
    try {
        const course = state.courses.find(c => c.id === cId);
        if (!course) return def;
        const targetMonths = periodMonths || TERMS_CONFIG[term].months;
        let allDates = [];
        targetMonths.forEach(m => { allDates = allDates.concat(getDatesForMonth(course, m)); });
        const atts = state.attendance.filter(a => a.term === term && a.courseId === cId);
        const active = {}, studentMap = {};
        atts.forEach(r => { active[r.date] = true; if (r.studentId === sId) studentMap[r.date] = r.status; });
        const today = todayISO();
        const valid = allDates.filter(d => d <= today || active[d]);
        if (valid.length === 0) return def;
        let points = 0, total = 0, p=0, l=0, a=0;
        const lateW = parseFloat(state.settings.lateWeight || 0.5);
        valid.forEach(d => {
            const status = studentMap[d];
            const wasActive = active[d];
            if (d > today && !status) return;
            if (wasActive) {
                if (status !== "M") {
                    total++;
                    if (status === "P") { points += 1; p++; }
                    else if (status === "T") { points += lateW; l++; }
                    else if (status === "A") { a++; }
                }
            }
        });
        if (total === 0) return def;
        return { pct: Math.round((points/total)*100), present: p, late: l, absent: a, total };
    } catch (e) { return def; }
}

function calcGrade(term, cId, sId, periodMonths = null) {
    try {
        if (state.finalGrades && periodMonths === null) {
            const key = `${cId}|${sId}|${term}`;
            const found = state.finalGrades.find(f => f.key === key);
            if (found && found.grade !== null && !isNaN(parseFloat(found.grade))) {
                return parseFloat(found.grade).toFixed(2);
            }
        }
        let grades = state.grades.filter(g => g.term === term && g.courseId === cId && g.studentId === sId && !g.isIntensification);
        if (periodMonths) {
            grades = grades.filter(g => g.date && periodMonths.includes(parseInt(g.date.split("-")[1], 10)-1));
        }
        const valid = grades.filter(g => g.score !== null && g.score !== "" && !isNaN(Number(g.score)));
        if (valid.length === 0) return null;
        const sum = valid.reduce((acc, g) => acc + Number(g.score), 0);
        return (sum / valid.length).toFixed(2);
    } catch (e) { return null; }
}

// --------------- Notificaciones ---------------
function notify(message, type = 'info') {
    try {
        const toast = document.createElement('div');
        const colors = {
            success: 'bg-emerald-500 text-white shadow-emerald-500/30 border-emerald-400',
            error: 'bg-rose-500 text-white shadow-rose-500/30 border-rose-400',
            info: 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-black/20 border-slate-700'
        };
        toast.className = `toast w-max max-w-full px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 ${colors[type] || colors.info} font-bold text-sm tracking-wide backdrop-blur-md border pointer-events-auto mx-auto`;
        let icon = '<i data-lucide="info" class="w-5 h-5 shrink-0"></i>';
        if (type === 'success') icon = '<i data-lucide="check-circle" class="w-5 h-5 shrink-0"></i>';
        if (type === 'error') icon = '<i data-lucide="alert-triangle" class="w-5 h-5 shrink-0"></i>';

        toast.innerHTML = `${icon}<span class="break-words">${escapeHtml(message)}</span>`;

        const container = document.getElementById('toast-container');
        if (container) container.appendChild(toast);
        else document.body.appendChild(toast);

        lucide.createIcons();

        setTimeout(() => {
            if (toast && toast.style) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(20px) scale(0.9)';
                setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
            }
        }, 3500);
    } catch (e) { console.log(`NOTIFY [${type}]: ${message}`); }
}

// --------------- Notificaciones push ---------------
function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        notificationPermission = true;
        return;
    }
    if (Notification.permission === 'denied') {
        notificationPermission = false;
        return;
    }
    Notification.requestPermission().then(perm => {
        notificationPermission = (perm === 'granted');
        if (notificationPermission) {
            console.log("Permiso de notificaciones concedido");
        }
    });
}

function sendPushNotification(title, body) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (!notificationPermission) return;
    navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
            body: body,
            icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgM2g2YTRgMCAwIDEgNCA0djE0YTMgMyAwIDAgMC0zLTNIMnoiPjwvcGF0aD48cGF0aCBkPSJNMjIgM2gtNmEtNCA0IDAgMCAwLTQgNHYxNGEzIDMgMCAwIDEgMy0zaDdaIj48L3BhdGg+PC9zdmc+',
            badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIgM2g2YTRgMCAwIDEgNCA0djE0YTMgMyAwIDAgMC0zLTNIMnoiPjwvcGF0aD48cGF0aCBkPSJNMjIgM2gtNmEtNCA0IDAgMCAwLTQgNHYxNGEzIDMgMCAwIDEgMy0zaDdaIj48L3BhdGg+PC9zdmc+',
            vibrate: [200, 100, 200]
        });
    }).catch(err => console.warn("Error enviando notificación:", err));
}

function checkUpcomingTasks() {
    if (!state || !state.tasks) return;
    const today = new Date();
    today.setHours(0,0,0,0);
    const threeDays = new Date(today);
    threeDays.setDate(threeDays.getDate() + 3);

    const upcoming = state.tasks.filter(t => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        due.setHours(0,0,0,0);
        return due >= today && due <= threeDays;
    });

    if (upcoming.length > 0) {
        const count = upcoming.length;
        const firstTitles = upcoming.slice(0, 3).map(t => t.title).join(', ');
        const msg = count > 3 ? `${firstTitles} y ${count-3} más.` : firstTitles;
        notify(`📅 Tienes ${count} tarea(s) próximas: ${msg}`, "info");
        sendPushNotification('DocenteOS - Tareas próximas', `Tienes ${count} tarea(s) que vencen en los próximos 3 días.`);
    }
}