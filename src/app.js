const express = require('express');
const path = require('path');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes);

app.get('/', (req, res) => {
  res.redirect('/discounts.html');
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
