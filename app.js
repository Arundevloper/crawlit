const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
