process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT_EXCEPTION:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED_REJECTION:', reason);
  process.exit(1);
});

async function bootstrap() {
  try {
    console.log('BOOTSTRAP_START');

    const { app } = await import('./app');

    const PORT = Number(process.env.PORT) || 3001;
    const HOST = '0.0.0.0';

    app.get('/api/health', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'ADFORT API is running',
      });
    });

    app.get('/', (_req, res) => {
      res.status(200).json({
        status: 'ok',
        message: 'ADFORT backend is live',
      });
    });

    app.listen(PORT, HOST, () => {
      console.log(`ADFORT server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('BOOTSTRAP_FAILED:', error);
    process.exit(1);
  }
}

bootstrap();
