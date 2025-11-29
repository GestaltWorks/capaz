import { Router } from 'express';

export const apiRouter = Router();

// API info endpoint
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'Skills Matrix API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      organizations: '/api/v1/organizations',
      users: '/api/v1/users',
      skills: '/api/v1/skills',
      assessments: '/api/v1/assessments',
    },
  });
});

// API health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
  });
});

// TODO: Add route modules as they're built
// apiRouter.use('/organizations', organizationsRouter);
// apiRouter.use('/users', usersRouter);
// apiRouter.use('/skills', skillsRouter);
// apiRouter.use('/assessments', assessmentsRouter);

