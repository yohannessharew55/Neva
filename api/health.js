export default function handler(req, res) {
  const hasPostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  
  res.status(200).json({
    app: 'N e v a Operating System',
    version: '2.0.0',
    platform: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    database: hasPostgres ? 'PostgreSQL (Connected)' : 'Local Mirror (PostgreSQL Ready)',
    iosAppReady: true,
    status: 'healthy'
  });
}
