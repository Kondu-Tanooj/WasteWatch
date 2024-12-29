const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Serve uploaded files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads with limits
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append extension
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for uploads
});

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', // Your MySQL password
    database: 'wastewatch', // Your database
});

// Connect to MySQL
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL');
});

// Route to serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'valli.html'));
});

// Signup endpoint
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, "user")'; // Default role is user
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            return res.status(500).send('Error signing up');
        }
        res.status(201).send('User signed up successfully');
    });
});

// Signin endpoint
app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ?';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            return res.status(500).send('Error signing in');
        }
        if (results.length > 0) {
            res.status(200).send('Sign in successful');
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// Admin login endpoint
app.post('/admin-login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ? AND password = ? AND role = "admin"';
    db.query(query, [email, password], (err, results) => {
        if (err) {
            return res.status(500).send('Error signing in');
        }
        if (results.length > 0) {
            res.status(200).send('Admin sign in successful');
        } else {
            res.status(401).send('Invalid admin credentials');
        }
    });
});

// Submit report endpoint
app.post('/submit-report', upload.single('photo'), (req, res) => {
    const { villageName, district, area, pincode, description, reportedBy } = req.body;
    const photoPath = req.file.path; // Get the path of the uploaded file

    const query = 'INSERT INTO reports (village_name, district, area, pincode, description, photo_path, reported_by) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(query, [villageName, district, area, pincode, description, photoPath, reportedBy], (err, result) => {
        if (err) {
            console.error('Database Error:', err); // Log error for debugging
            return res.status(500).send('Error submitting report');
        }
        res.status(201).send('Report submitted successfully');
    });
});

// Get all reports
app.get('/reports', (req, res) => {
    const query = 'SELECT * FROM reports';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).send('Error fetching reports');
        }
        res.status(200).json(results);
    });
});

// Mark a report as solved with a solution
app.post('/submit-solution', upload.single('solutionPhoto'), (req, res) => {
    const { reportId, solutionDescription } = req.body; // Expect the solution data in the body
    const solutionPhotoPath = req.file ? req.file.path : null; // Get the uploaded file path if available

    const query = 'UPDATE reports SET solved = true, solution_photo_path = ?, solution_description = ?, solved_timestamp = NOW() WHERE id = ?';
    db.query(query, [solutionPhotoPath, solutionDescription, reportId], (err, result) => {
        if (err) {
            console.error('Database Error:', err); // Log error for debugging
            return res.status(500).send('Error submitting solution');
        }
        res.status(200).send('Solution submitted successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

