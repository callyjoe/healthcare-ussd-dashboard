// =============================================
// HEALTHPORTAL USSD — Application Logic
// =============================================

// --- DOM Selection ---
const ussdDisplay   = document.getElementById('ussd-display');
const ussdInput     = document.getElementById('ussd-input');
const btnSubmit     = document.getElementById('ussd-submit');
const btnReset      = document.getElementById('ussd-reset');
const statAppointments = document.getElementById('stat-appointments');
const statAlerts    = document.getElementById('stat-alerts');
const statSessions  = document.getElementById('stat-sessions');
const tableBody     = document.getElementById('table-body');
const emptyMessage  = document.getElementById('empty-message');
const entryCount    = document.getElementById('entry-count');
const clearBtn      = document.getElementById('clear-btn');
const themeToggle   = document.getElementById('theme-toggle');
const toggleIcon    = document.getElementById('toggle-icon');
const currentDate   = document.getElementById('current-date');
const apptFill      = document.getElementById('appt-fill');
const alertFill     = document.getElementById('alert-fill');
const sessionFill   = document.getElementById('session-fill');

// --- State ---
let currentState      = 'START';
let appointmentCount  = 0;
let alertCount        = 0;
let sessionCount      = 0;
let rowCount          = 0;
const MAX_BAR         = 10; // bar fills at 10 entries

// --- Date ---
if (currentDate) {
    const now = new Date();
    currentDate.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
}

// =============================================
// THEME TOGGLE
// =============================================
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    toggleIcon.textContent = theme === 'dark' ? '☀' : '☾';
    localStorage.setItem('hp-theme', theme);
}

// Load saved theme
const savedTheme = localStorage.getItem('hp-theme') || 'dark';
setTheme(savedTheme);

themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
});

// =============================================
// USSD CORE LOGIC
// =============================================
function handleUssdInput() {
    const input = ussdInput.value.trim();
    ussdInput.value = '';
    if (input === '') return;

    switch (currentState) {
        case 'START':
            if (input === '*123#') {
                sessionCount++;
                statSessions.textContent = sessionCount;
                updateBar(sessionFill, sessionCount);
                setDisplay("Welcome to HealthPortal\n\n1. Book Appointment\n2. Log Symptom");
                currentState = 'MENU';
            } else {
                setDisplay("Invalid code.\n\nEnter USSD code\ne.g. *123#");
            }
            break;

        case 'MENU':
            if (input === '1') {
                setDisplay("Book Appointment\n\nEnter Patient Name:");
                currentState = 'BOOK_APPT';
            } else if (input === '2') {
                setDisplay("Log Symptom\n\nDescribe symptom:\n(e.g. Fever, Cough)");
                currentState = 'LOG_SYMPTOM';
            } else {
                setDisplay("Invalid choice.\n\n1. Book Appointment\n2. Log Symptom");
            }
            break;

        case 'BOOK_APPT':
            setDisplay(`✓ Appointment Confirmed\n\nPatient: ${input}\nStatus: Pending Review`);
            addDashboardRow(input, 'Appointment', 'Scheduled — pending review', false);
            appointmentCount++;
            statAppointments.textContent = appointmentCount;
            updateBar(apptFill, appointmentCount);
            currentState = 'DONE';
            break;

        case 'LOG_SYMPTOM':
            setDisplay(`⚠ Symptom Logged\n\nSymptom: ${input}\nAlert sent to clinic`);
            addDashboardRow('Unknown Patient', 'Symptom Alert', input, true);
            alertCount++;
            statAlerts.textContent = alertCount;
            updateBar(alertFill, alertCount);
            currentState = 'DONE';
            break;

        case 'DONE':
            setDisplay("Session ended.\n\nPress END CALL\nto restart.");
            break;
    }
}

function setDisplay(text) {
    ussdDisplay.textContent = text;
    // Trigger flicker animation by toggling a class
    ussdDisplay.style.animation = 'none';
    ussdDisplay.offsetHeight; // reflow
    ussdDisplay.style.animation = '';
}

// =============================================
// STAT BAR UPDATE
// =============================================
function updateBar(barEl, count) {
    const pct = Math.min((count / MAX_BAR) * 100, 100);
    barEl.style.width = pct + '%';
}

// =============================================
// DASHBOARD ROW INJECTION
// =============================================
function addDashboardRow(name, action, details, isAlert) {
    // Hide empty state
    if (emptyMessage) emptyMessage.style.display = 'none';

    rowCount++;
    entryCount.textContent = `${rowCount} entr${rowCount === 1 ? 'y' : 'ies'}`;

    const row = document.createElement('tr');
    row.classList.add('row-new');

    if (isAlert) {
        row.classList.add('row-alert');
    } else {
        row.classList.add('row-appointment');
    }

    const time = new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const badgeClass = isAlert ? 'badge-alert' : 'badge-scheduled';
    const badgeText  = isAlert ? '⚠ Alert' : '✓ Scheduled';

    row.innerHTML = `
        <td class="time-cell">${time}</td>
        <td class="name-cell">${escapeHtml(name)}</td>
        <td>${escapeHtml(action)}</td>
        <td>${escapeHtml(details)}</td>
        <td><span class="status-badge ${badgeClass}">${badgeText}</span></td>
    `;

    tableBody.insertBefore(row, tableBody.firstChild);

    // Remove animation class after it plays
    setTimeout(() => row.classList.remove('row-new'), 500);
}

// =============================================
// CLEAR LOG
// =============================================
clearBtn.addEventListener('click', () => {
    // Remove all rows except the empty message
    const rows = tableBody.querySelectorAll('tr:not(#empty-message)');
    rows.forEach(r => r.remove());
    rowCount = 0;
    entryCount.textContent = '0 entries';
    emptyMessage.style.display = '';
});

// =============================================
// RESET
// =============================================
function resetPhone() {
    currentState = 'START';
    setDisplay("Enter USSD code\ne.g. *123#");
    ussdInput.value = '';
    ussdInput.focus();
}

// =============================================
// HELPERS
// =============================================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// =============================================
// EVENT LISTENERS
// =============================================
btnSubmit.addEventListener('click', handleUssdInput);
btnReset.addEventListener('click', resetPhone);

ussdInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUssdInput();
});

// Focus input on load
ussdInput.focus();
