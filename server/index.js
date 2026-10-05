require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes    = require('./src/modules/auth/authRoutes');
const bookingRoutes = require('./src/modules/booking/bookingRoutes');
const sessionRoutes = require('./src/modules/session/sessionRoutes');
const discoveryRoutes = require('./src/modules/discovery/discoveryRoutes');
const tutorRoutes = require('./src/modules/tutor/tutorRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Tutora API is running' });
});

app.use('/api/auth',     authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/session',  sessionRoutes);
app.use('/api/discovery', discoveryRoutes);
app.use('/api/tutor', tutorRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
