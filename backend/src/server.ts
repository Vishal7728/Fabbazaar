import app from './app';
import { initializeApplication } from './bootstrap';

const port = Number(process.env.PORT || 4000);

async function startServer() {
  await initializeApplication();
  app.listen(port, '0.0.0.0', () => {
    console.log(`FabBazaar API running on http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
