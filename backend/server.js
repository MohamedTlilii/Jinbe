// server.js
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const http      = require('http');
const WebSocket = require('ws');

const { connectDB } = require('./db/connection');
const authRoutes    = require('./routes/auth');
const authMiddleware= require('./middleware/auth');
const engineRoutes  = require('./routes/engine');
const leadsRoutes   = require('./routes/leads');
const statsRoutes   = require('./routes/stats');
const runsRoutes    = require('./routes/runs');
const testsRoutes   = require('./routes/tests');
const versionRoutes = require('./routes/version');

const app    = express();
const server = http.createServer(app);

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/, credentials: true }));
app.use(express.json());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// WebSocket — même port que l'API, fermeture propre garantie
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
  console.log('WebSocket connecté');
  ws.send(JSON.stringify({ type: 'connected', message: 'Connecté au moteur' }));
  ws.on('close', () => console.log('WebSocket déconnecté'));
});
app.set('wsServer', wss);

// Routes publiques (pas de token requis)
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);

// Routes protégées — token JWT obligatoire
app.use(authMiddleware);
app.use('/api/engine', engineRoutes);
app.use('/api/leads',  leadsRoutes);
app.use('/api/stats',  statsRoutes);
app.use('/api/runs',   runsRoutes);
app.use('/api/tests',   testsRoutes);
app.use('/api/version', versionRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route introuvable : ' + req.path }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Erreur serveur' }); });

const PORT = parseInt(process.env.PORT || 3001);

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log('\n Serveur : http://localhost:' + PORT);
    console.log(' WebSocket : ws://localhost:' + PORT);
    console.log(' MongoDB : ' + process.env.MONGODB_URL + '\n');
  });
  process.on('SIGINT', async () => {
    const { stopEngine } = require('./engine/scheduler');
    stopEngine();
    server.close();
    const { closeDB } = require('./db/connection');
    await closeDB();
    process.exit(0);
  });
};

start().catch(err => { console.error(err); process.exit(1); });
