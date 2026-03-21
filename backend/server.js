const express = require('express');
const cors = require('cors');
const connectDB = require('./src/db');
const categoryRoutes = require('./src/routes/categoryRoutes');
const subCategoryRoutes = require('./src/routes/subCategoryRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const activityLogRoutes = require('./src/routes/activityLogRoutes');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://homeledger.netlify.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/api/subcategories', subCategoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/activity-logs', activityLogRoutes);

connectDB();
app.use('/api/categories', categoryRoutes); // add after connectDB()

app.get('/', (req, res) => {
  res.json({ message: 'HomeLedger API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
