const express = require('express');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { createProxyServer } = require('http-proxy');

const app = express();

// Create a proxy server for WebSocket connections
const wsProxy = createProxyServer({
  target: 'http://localhost:5173',
  ws: true,
  changeOrigin: true,
});

// Proxy WebSocket connections
const server = http.createServer(app);
server.on('upgrade', (req, socket, head) => {
  console.log('Upgrading to WebSocket...');
  wsProxy.ws(req, socket, head);
});

// Middleware to proxy all HTTP requests starting with /react
app.use(
  '/react',
  createProxyMiddleware({
    target: 'http://localhost:5173',
    changeOrigin: true,
    ws: true,
    pathRewrite: {
      '^/react': '', // Remove the /react prefix when forwarding to Vite server
    },
  })
);

// Proxy any request that starts with /react and forward it to the Vite server
app.get('/react/*', async (req, res) => {
  try {
    // Construct the URL for the Vite server using the original request path
    const viteUrl = `http://localhost:5173${req.originalUrl.replace('/react', '')}`;
    console.log(`Fetching: ${viteUrl}`);
    
    // Fetch the content from the Vite server
    const response = await fetch(viteUrl);

    // Set the headers received from Vite before sending to the client
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Determine content type and send the response
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text')) {
        res.status(response.status).send(await response.text());
      } else {
        res.status(response.status).send(await response.buffer());
      }
    } else {
      res.status(response.status).send(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error while fetching from Vite:', error);
    res.status(500).send('An error occurred while proxying to Vite');
  }
});

// Proxy any other request not matched by /react, which should be directed to Vite
app.get('*', async (req, res) => {
  try {
    // Construct the URL for the Vite server using the original request path
    const viteUrl = `http://localhost:5173${req.originalUrl}`;
    console.log(`Fetching: ${viteUrl}`);
    
    // Fetch the content from the Vite server
    const response = await fetch(viteUrl);

    // Set the headers received from Vite before sending to the client
    response.headers.forEach((value, name) => {
      res.setHeader(name, value);
    });

    // Determine content type and send the response
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text')) {
        res.status(response.status).send(await response.text());
      } else {
        res.status(response.status).send(await response.buffer());
      }
    } else {
      res.status(response.status).send(`Error: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error while fetching from Vite:', error);
    res.status(500).send('An error occurred while proxying to Vite');
  }
});

// Start the Express server
app.listen(3000, () => {
  console.log('Express server running on http://localhost:3000');
});
