import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import router from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('API Agape Delícias Caseiras está rodando!');
});

// Use routes
app.use('/', router);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
