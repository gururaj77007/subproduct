const express = require('express');
const bodyParser = require('body-parser');
const orderRoutes = require('./routes/Order');
const connectDB = require('./Mongodb/connection'); // Import the connectDB function

const app = express();

// Middleware
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/orders', orderRoutes);
app.get('/health', (req, res) => {
  res.status(200).json({ message: 'Server is up and running!' });
});

// Start server
const PORT = process.env.PORT || 3033;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
