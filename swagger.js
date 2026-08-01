const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Task API',
    version: '1.0.0',
    description: 'Auto-generated API documentation',
  },
  host: 'localhost:3000',
  schemes: ['http'],
};

const outputFile = './api-docs.json';
const endpointsFiles = ['./index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./index.js');
});
