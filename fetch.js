// Copied from StackOverflow, why can't we just be like Deno?

const https = require("https");

async function fetch(url, method = "get", body = null) {
  if (!['get', 'post', 'head'].includes(method)) {
      throw new Error(`Invalid method: ${method}`);
  }

  let urlObject;

  try {
      urlObject = new URL(url);
  } catch (error) {
      throw new Error(`Invalid url ${url}`);
  }

  if (body && method !== 'post') {
      throw new Error(`Invalid use of the body parameter while using the ${method.toUpperCase()} method.`);
  }

  let options = {
      method: method.toUpperCase(),
      hostname: urlObject.hostname,
      port: urlObject.port,
      path: urlObject.pathname
  };

  if (body) {
      options.headers = {'Content-Length':Buffer.byteLength(body)};
  }

  return await new Promise((resolve, reject) => {

      const clientRequest = https.request(options, incomingMessage => {

          // Response object.
          let response = {
              statusCode: incomingMessage.statusCode,
              headers: incomingMessage.headers,
              body: []
          };

          // Collect response body data.
          incomingMessage.on('data', chunk => {
              response.body.push(chunk);
          });

          // Resolve on end.
          incomingMessage.on('end', () => {
              if (response.body.length) {

                  response.body = response.body.join();

                  try {
                      response.body = JSON.parse(response.body);
                  } catch (error) {
                      // Silently fail if response is not JSON.
                  }
              }

              resolve(response);
          });
      });
      
      // Reject on request error.
      clientRequest.on('error', error => {
          reject(error);
      });

      // Write request body if present.
      if (body) {
          clientRequest.write(body);
      }

      // Close HTTP connection.
      clientRequest.end();
  });
}

module.exports = fetch;