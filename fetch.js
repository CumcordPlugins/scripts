// Copied from StackOverflow, why can't we just be like Deno?

const http = require("https");

async function fetch(url, options = { method: "GET" }) {
  return await new Promise((resolve, reject) => {
    let parsedURL = new URL(url);
    let opts = {
      hostname: parsedURL.hostname,
      path: parsedURL.pathname,
      ...options,
    };

    const req = http.request(opts, (res) => {
      const chunks = [];

      let final = {
        status: res.statusCode,
        headers: res.headers,
      }

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        final.body = Buffer.concat(chunks).toString();
        resolve(final);
      })

      res.on("error", (err) => {
        reject(err);
      });
    });

    req.end();
  });
}

module.exports = fetch;
