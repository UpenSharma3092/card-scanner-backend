const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');


// Load env vars
dotenv.config();
const connectDB = require('./config/db');

// Connect to database
connectDB();

// Route files
const auth = require('./routes/auth');
const contacts = require('./routes/contacts');
const notifications = require('./routes/notifications');
const team = require('./routes/team');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Swagger API Documentation setup
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/contacts', contacts);
app.use('/api/notifications', notifications);
app.use('/api/team', team);

console.log('[CardScan] Backend Routes mounted successfully: /api/auth, /api/contacts, /api/notifications, /api/team');

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
