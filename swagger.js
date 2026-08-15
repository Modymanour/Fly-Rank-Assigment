const swaggerAutogen = require('swagger-autogen')();

const doc = {
  swagger: '2.0',
  info: {
    title: 'Task API',
    version: '1.0.0',
    description: 'Auto-generated API documentation for the task application and Supabase JWT-protected routes.',
  },
  host: 'localhost:3000',
  basePath: '/',
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
    },
  },
};

const outputFile = './api-docs.json';
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc)
  .then(() => {
    require('./index.js');
  })
  .catch((err) => {
    console.error('Swagger generation failed:', err);
    process.exit(1);
  });
