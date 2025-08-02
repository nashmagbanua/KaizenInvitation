document.addEventListener('DOMContentLoaded', () => {
    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }

    // DOM Elements
    const employeeTab = document.getElementById('employeeTab');
    const supervisorTab = document.getElementById('supervisorTab');
    const headTab = document.getElementById('headTab');

    const employeeView = document.getElementById('employeeView');
    const supervisorView = document.getElementById('supervisorView');
    const headView = document.getElementById('headView');

    const employeeForm = document.getElementById('employeeForm');
    const companyIdInput = document.getElementById('companyId');
    const areaSelect = document.getElementById('areaSelect');
    const employeeMessage = document.getElementById('employeeMessage');

    const supervisorLoginForm = document.getElementById('supervisorLoginForm');
    const supervisorPasswordInput = document.getElementById('supervisorPassword');
    const supervisorContent = document.getElementById('supervisorContent');
    const supervisorMessage = document.getElementById('supervisorMessage');
    const supervisorLogTableBody = document.querySelector('#supervisorLogTable tbody');
    const submitSummaryBtn = document.getElementById('submitSummaryBtn');

    const headLoginForm = document.getElementById('headLoginForm');
    const headPasswordInput = document.getElementById('headPassword');
    const headContent = document.getElementById('headContent');
    const headMessage = document.getElementById('headMessage');
    const summaryCardsContainer = document.getElementById('summaryCards');
    const headLogTableBody = document.querySelector('#headLogTable tbody');

    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // --- Tab Switching Logic ---
    function showView(viewToShow) {
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        viewToShow.classList.add('active');

        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        if (viewToShow === employeeView) {
            employeeTab.classList.add('active');
        } else if (viewToShow === supervisorView) {
            supervisorTab.classList.add('active');
        } else if (viewToShow === headView) {
            headTab.classList.add('active');
        }
    }

    employeeTab.addEventListener('click', () => showView(employeeView));
    supervisorTab.addEventListener('click', () => {
        showView(supervisorView);
        supervisorContent.classList.add('content-hidden'); // Hide content until logged in
        supervisorLoginForm.reset(); // Clear password field
        supervisorMessage.textContent = ''; // Clear messages
    });
    headTab.addEventListener('click', () => {
        showView(headView);
        headContent.classList.add('content-hidden'); // Hide content until logged in
        headLoginForm.reset(); // Clear password field
        headMessage.textContent = ''; // Clear messages
    });

    // Initialize to Employee view
    showView(employeeView);

    // --- Utility Functions ---
    function getFormattedDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getFormattedTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }

    function showMessage(element, message, type) {
        element.textContent = message;
        element.className = `message ${type}`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message';
        }, 5000); // Message disappears after 5 seconds
    }

    // --- Employee View Logic ---
    employeeForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const companyId = companyIdInput.value.trim();
        const area = areaSelect.value;

        if (companyId.length !== 6 || !/^\d{6}$/.test(companyId)) {
            showMessage(employeeMessage, 'Please enter a valid 6-digit Company ID.', 'error');
            return;
        }

        if (!area) {
            showMessage(employeeMessage, 'Please select an Area.', 'error');
            return;
        }

        const now = new Date();
        const date = getFormattedDate(now);
        const time = getFormattedTime(now);

        let logs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];

        // Prevent duplicate entries for the same Company ID per day
        const isDuplicate = logs.some(log =>
            log.companyId === companyId && log.date === date
        );

        if (isDuplicate) {
            showMessage(employeeMessage, 'You have already logged your attendance today.', 'error');
            return;
        }

        const newLog = { date, time, companyId, area };
        logs.push(newLog);
        localStorage.setItem('attendanceLogs', JSON.stringify(logs));

        showMessage(employeeMessage, 'Attendance logged successfully!', 'success');
        employeeForm.reset(); // Clear form
    });

    // --- Supervisor View Logic ---
    const SUPERVISOR_PASSWORD = `abn${new Date().getFullYear()}`; // e.g., abn2025
    const RESTRICTED_ROLES = ["mantech", "opscrew"]; // Example restricted roles - assuming this would be derived from companyId or an external system

    supervisorLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = supervisorPasswordInput.value.trim();

        // For demonstration, let's assume specific company IDs map to roles
        // In a real scenario, this would come from a backend or a more complex local storage structure
        const dummyRoleCheck = (passwordToCheck) => {
            if (passwordToCheck === 'abnmantech') return "mantech"; // Example for testing restriction
            if (passwordToCheck === 'abnopscrew') return "opscrew"; // Example for testing restriction
            return "supervisor"; // Default role if not restricted
        };

        const role = dummyRoleCheck(password); // This is a placeholder for actual role checking

        if (password === SUPERVISOR_PASSWORD) {
            if (RESTRICTED_ROLES.includes(role)) { // Check if the "role" derived from password is restricted
                showMessage(supervisorMessage, 'Access Denied: Your role does not permit access to this panel.', 'error');
                supervisorContent.classList.add('content-hidden');
            } else {
                supervisorContent.classList.remove('content-hidden');
                supervisorLoginForm.classList.add('content-hidden');
                loadSupervisorLogs();
                showMessage(supervisorMessage, 'Login successful!', 'success');
            }
        } else {
            showMessage(supervisorMessage, 'Invalid password.', 'error');
            supervisorContent.classList.add('content-hidden');
        }
    });

    function loadSupervisorLogs() {
        let logs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];
        supervisorLogTableBody.innerHTML = ''; // Clear existing rows

        logs.forEach((log, index) => {
            const row = supervisorLogTableBody.insertRow();
            row.dataset.index = index; // Store original index for editing/deleting

            row.innerHTML = `
                <td>${log.date}</td>
                <td>${log.time}</td>
                <td>${log.companyId}</td>
                <td>${log.area}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="save-btn" style="display:none;">Save</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;
        });
    }

    supervisorLogTableBody.addEventListener('click', (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;

        const rowIndex = parseInt(row.dataset.index);
        let logs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];

        if (target.classList.contains('edit-btn')) {
            const cells = row.querySelectorAll('td');
            // Make Time, Company ID, Area editable
            cells[1].contentEditable = true; // Time
            cells[2].contentEditable = true; // Company ID
            cells[3].contentEditable = true; // Area
            cells[1].focus(); // Focus on the first editable cell

            target.style.display = 'none';
            row.querySelector('.save-btn').style.display = 'inline-block';
        } else if (target.classList.contains('save-btn')) {
            const cells = row.querySelectorAll('td');
            logs[rowIndex].time = cells[1].textContent.trim();
            logs[rowIndex].companyId = cells[2].textContent.trim();
            logs[rowIndex].area = cells[3].textContent.trim();

            // Basic validation for edited fields (can be expanded)
            if (!/^\d{2}:\d{2}:\d{2}$/.test(logs[rowIndex].time)) {
                showMessage(supervisorMessage, 'Invalid time format (HH:MM:SS).', 'error');
                return;
            }
            if (!/^\d{6}$/.test(logs[rowIndex].companyId)) {
                showMessage(supervisorMessage, 'Invalid Company ID (6 digits).', 'error');
                return;
            }
            if (logs[rowIndex].area === '' || !['Boiler', 'WTP', 'WWTP', 'Maintenance', 'Bottling', 'Q.A', 'Process', 'Full Goods'].includes(logs[rowIndex].area)) {
                showMessage(supervisorMessage, 'Invalid Area.', 'error');
                return;
            }

            localStorage.setItem('attendanceLogs', JSON.stringify(logs));
            showMessage(supervisorMessage, 'Log updated successfully!', 'success');

            cells[1].contentEditable = false;
            cells[2].contentEditable = false;
            cells[3].contentEditable = false;

            target.style.display = 'none';
            row.querySelector('.edit-btn').style.display = 'inline-block';
            loadSupervisorLogs(); // Reload to refresh the view and clean up contentEditable
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this log?')) {
                logs.splice(rowIndex, 1); // Remove the log
                localStorage.setItem('attendanceLogs', JSON.stringify(logs));
                showMessage(supervisorMessage, 'Log deleted successfully!', 'success');
                loadSupervisorLogs(); // Reload the table
            }
        }
    });

    submitSummaryBtn.addEventListener('click', () => {
        let logs = JSON.parse(localStorage.getItem('attendanceLogs')) || [];
        localStorage.setItem('submittedSummary', JSON.stringify(logs));
        showMessage(supervisorMessage, 'Summary submitted to Head view!', 'success');
    });

    // --- Head View Logic ---
    headLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = headPasswordInput.value.trim();

        if (password === SUPERVISOR_PASSWORD) { // Same password as supervisor
            headContent.classList.remove('content-hidden');
            headLoginForm.classList.add('content-hidden');
            loadHeadData();
            showMessage(headMessage, 'Login successful!', 'success');
        } else {
            showMessage(headMessage, 'Invalid password.', 'error');
            headContent.classList.add('content-hidden');
        }
    });

    function loadHeadData() {
        loadSummaryCards();
        loadHeadLogs();
    }

    function loadSummaryCards() {
        let submittedLogs = JSON.parse(localStorage.getItem('submittedSummary')) || [];
        const summary = {};

        submittedLogs.forEach(log => {
            if (!summary[log.area]) {
                summary[log.area] = new Set();
            }
            summary[log.area].add(log.companyId); // Use Set to count unique IDs
        });

        summaryCardsContainer.innerHTML = '';
        for (const area in summary) {
            const card = document.createElement('div');
            card.classList.add('summary-card');
            card.innerHTML = `
                <h4>${area}</h4>
                <p>${summary[area].size}</p>
            `;
            summaryCardsContainer.appendChild(card);
        }

        if (Object.keys(summary).length === 0) {
            summaryCardsContainer.innerHTML = '<p>No summary data available yet. Supervisor needs to submit.</p>';
        }
    }

    function loadHeadLogs() {
        let submittedLogs = JSON.parse(localStorage.getItem('submittedSummary')) || [];
        headLogTableBody.innerHTML = ''; // Clear existing rows

        if (submittedLogs.length === 0) {
            headLogTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No submitted logs available.</td></tr>';
            return;
        }

        submittedLogs.forEach(log => {
            const row = headLogTableBody.insertRow();
            row.innerHTML = `
                <td>${log.date}</td>
                <td>${log.time}</td>
                <td>${log.companyId}</td>
                <td>${log.area}</td>
            `;
        });
    }
});
