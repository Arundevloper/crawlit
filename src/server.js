const app = require('./app');
const { port } = require('./config/config');

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
