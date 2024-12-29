// Global variables for state management
let currentUser = null;
let isAdmin = false;
let currentReportId = null;

// Function to show tabs dynamically
function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    // If the solved problems tab is shown, call the function to fetch and display them
    if (tabId === 'solvedProblems') {
        displaySolvedProblems(); // Fetch and display solved problems
    }
}

// Sign Up functionality with fetch
document.getElementById('signup').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = this.querySelector('input[type="text"]').value;
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        showTab('signin');
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Sign In functionality with fetch
document.getElementById('signin').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    const password = this.querySelector('input[type="password"]').value;

    fetch('http://localhost:3000/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.text())
    .then(data => {
        if (data === 'Sign in successful') {
            currentUser = { email };
            document.getElementById('userActions').style.display = 'flex';
            showTab('report');
        } else {
            alert(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Admin login functionality
document.getElementById('admin').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;  // Assuming you have an email field for admin login
    const password = this.querySelector('input[type="password"]').value;

    fetch('http://localhost:3000/admin-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    })
    .then(response => response.text())
    .then(data => {
        if (data === 'Admin sign in successful') {
            isAdmin = true;
            document.getElementById('userActions').style.display = 'flex';
            showTab('adminDashboard');
            displayReports();  // Load the reports for admin to manage
        } else {
            alert(data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Submit a waste report
document.getElementById('report').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentUser) {
        alert('Please sign in to submit a report');
        return;
    }

    const formData = new FormData(this);  // Use FormData to handle file and text input
    formData.append('reportedBy', currentUser.email);  // Add the current user to the form data

    fetch('http://localhost:3000/submit-report', {
        method: 'POST',
        body: formData  // Send formData which includes the file
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        e.target.reset();
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// Function to display unsolved reports
function displayReports() {
    fetch('http://localhost:3000/reports')
    .then(response => response.json())
    .then(reports => {
        const reportsContainer = document.getElementById('reportsList');
        reportsContainer.innerHTML = '';
        reports.forEach(report => {
            if (!report.solved) {
                const reportElement = document.createElement('div');
                reportElement.className = 'report';
                reportElement.innerHTML = `
                    <img src="${report.photo_path}" alt="Waste Report" style="max-width: 100%; height: auto;">
                    <h3>${report.village_name}</h3>
                    <p><strong>District:</strong> ${report.district}</p>
                    <p><strong>Area:</strong> ${report.area}</p>
                    <p><strong>Pincode:</strong> ${report.pincode}</p>
                    <p><strong>Description:</strong> ${report.description}</p>
                    <p><strong>Reported by:</strong> ${report.reported_by}</p>
                    <p><strong>Reported on:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
                    <button onclick="openSolutionModal(${report.id})">Mark as Solved</button>
                `;
                reportsContainer.appendChild(reportElement);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching reports:', error);
    });
}

// Function to add the displaySolvedProblems function
function displaySolvedProblems() {
    fetch('http://localhost:3000/reports')
    .then(response => response.json())
    .then(reports => {
        const solvedContainer = document.getElementById('solvedList');
        solvedContainer.innerHTML = '';
        reports.forEach(report => {
            if (report.solved) {
                const solvedElement = document.createElement('div');
                solvedElement.className = 'solved-problem';
                solvedElement.innerHTML = `
                    <h3>${report.village_name}</h3>
                    <p><strong>District:</strong> ${report.district}</p>
                    <p><strong>Area:</strong> ${report.area}</p>
                    <p><strong>Pincode:</strong> ${report.pincode}</p>
                    <p><strong>Original Problem:</strong> ${report.description}</p>
                    <p><strong>Reported on:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
                    <img src="${report.solution_photo_path}" alt="Solution Photo" style="max-width: 100%; height: auto;">
                    <p><strong>Solution:</strong> ${report.solution_description}</p>
                    <p><strong>Solved on:</strong> ${new Date(report.solved_timestamp).toLocaleString()}</p>
                `;
                solvedContainer.appendChild(solvedElement);
            }
        });
    })
    .catch(error => {
        console.error('Error fetching solved problems:', error);
    });
}

// Function to open modal for admin to post solution
function openSolutionModal(reportId) {
    currentReportId = reportId;
    document.getElementById('solutionModal').style.display = 'block';
}

// Function to submit a solution to a report
function submitSolution() {
    const solutionPhoto = document.getElementById('solutionPhoto').files[0];
    const solutionDescription = document.getElementById('solutionDescription').value;

    if (!solutionPhoto || !solutionDescription) {
        alert('Please provide both a photo and description for the solution.');
        return;
    }

    const formData = new FormData();
    formData.append('reportId', currentReportId);
    formData.append('solutionPhoto', solutionPhoto); // Store as file
    formData.append('solutionDescription', solutionDescription);

    fetch('http://localhost:3000/submit-solution', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.text())
    .then(data => {
        document.getElementById('solutionModal').style.display = 'none';
        displayReports();
        alert('Solution submitted successfully!');
    })
    .catch(error => {
        console.error('Error submitting solution:', error);
    });
}

// Logout function
function logout() {
    currentUser = null;
    isAdmin = false;
    document.getElementById('userActions').style.display = 'none';
    showTab('home');
}

// Close solution modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('solutionModal').style.display = 'none';
});

// Close modal when clicking outside of it
window.onclick = function(event) {
    if (event.target == document.getElementById('solutionModal')) {
        document.getElementById('solutionModal').style.display = 'none';
    }
};

