// js/config.js
// Configuración global, constantes y estado inicial de DocenteOS

// Base de datos
const DB_NAME = "DocenteOS_DB";
const STORE_NAME = "app_state";
const DB_VERSION = 1;

// Variables de UI (chart, vista actual)
let chartInstance = null;
let lastView = null;

// Términos académicos
const TERMS_CONFIG = {
    "T1": { label: "1º Cuatrimestre", months: [2, 3, 4, 5, 6] }, 
    "T2": { label: "2º Cuatrimestre", months: [7, 8, 9, 10, 11] } 
};

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Estado por defecto
const DEFAULT_STATE = {
    ui: { 
        view: "dashboard", termKey: "T1", selectedMonthIdx: null, 
        activeCourseId: null, activeStudentId: null, modalTab: 'ficha',
        darkMode: null,
        searchQuery: "", intensificationPeriod: "December",
        sidebarOpen: false
    },
    settings: { 
        attendanceMin: 75, lateWeight: 0.5, 
        gradeTtaMin: 7, gradeTedMin: 4,
        googleClientId: "",
        googleAuthToken: "",
        evaluationTypes: ["Evaluación", "Trabajo Práctico", "Lección oral", "Examen"],
        evaluationHelp: "Los tipos de evaluación te permiten categorizar las calificaciones. Puedes agregar, editar o eliminar tipos desde esta sección. Cada nota puede asignarse a un tipo para mejor organización.",
        lastBackupFileId: ""
    },
    courses: [], students: [], attendance: [], grades: [], classLogs: [], tasks: [], intensification: [], notes: [],
    finalGrades: [],
    planning: []
};

// Estado global (se inicializará en boot)
let state = null;

// Timeout del buscador
let searchTimeout = null;
let lastFocusedInputId = null;

// Backup automático
let backupInterval = null;
let notificationPermission = false;

// Google Auth
let accessToken = null;
const CLIENT_ID = "1074987596307-0qa9ejmlna92mq66ohmo51n37fctlbkq.apps.googleusercontent.com";
