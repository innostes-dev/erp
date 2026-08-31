import express from 'express';
import * as path from 'path';
import { createDatabaseService, IDatabaseService,  userSecurityRouter,createAuthRouter, rolesRouter, tenantRouter,ipReputationRouter, loginAttemptsRouter, auditlogRouter} from '@core';

const app = express();
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));

const dbService: IDatabaseService = createDatabaseService();

app.get('/api', async (req, res) => {
  const isHealthy = await dbService.healthCheck();
  res.send({ databaseHealthy: isHealthy });
});

app.use('/auth', createAuthRouter());
app.use('/role', rolesRouter());
app.use('/tenant', tenantRouter());
app.use('/ip-reputation', ipReputationRouter());
app.use('/login-attempts', loginAttemptsRouter());
app.use('/user-security', userSecurityRouter());
app.use('/audit-log',auditlogRouter());

// Database connectivity check & server startup
dbService.healthCheck().then((connected) => {
  if (connected) {
    console.log('Database Connected Successfully!');
  } else {
    console.warn('Database Connection Failed!');
  }
});



const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
