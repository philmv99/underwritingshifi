const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;  // Changed to 3001 to avoid conflict with React dev server

// Set up middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set up file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Initialize database
const db = new sqlite3.Database(path.join(__dirname, 'underwriting.db'), (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    db.run(`CREATE TABLE IF NOT EXISTS score_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      core_score INTEGER,
      bayesian_score INTEGER,
      total_score INTEGER,
      simple_monthly_income REAL,
      name TEXT,
      emails TEXT,
      phones TEXT,
      details TEXT,
      request_data TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating table', err.message);
      } else {
        console.log('Score history table created or already exists');
      }
    });
  }
});

// Make db available to routes
app.locals.db = db;

// Import routes
const scoreRoutes = require('./routes/score');

// Use routes
app.use('/api', scoreRoutes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
