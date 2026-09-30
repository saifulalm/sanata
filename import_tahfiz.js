"use strict";
const http = require("http");
const fs = require("fs");

// 1. Login
function httpPost(path, body, token) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost", port: 5000, path, method: "POST",
      headers: { "Content-Type": "application/json" }
    };
    if (token) opts.headers["Authorization"] = "Bearer " + token;
    const req = http.request(opts, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch(e) { resolve({raw: d}); }});
    });
    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  // Login
  const login = await httpPost("/api/auth/login", {email:"admin@sanata.id", password:"Admin123!"});
  const token = login.data && login.data.accessToken;
  if (!token) { console.log("Auth fail:", JSON.stringify(login)); return; }
  console.log("Token OK:", token.slice(0,20)+"...");

  // Load payload
  const payload = JSON.parse(fs.readFileSync("tahfiz_import_payload.json","utf8"));

  // Import
  console.log("\nImporting TAHFIZ payload...");
  const result = await httpPost("/api/rab/import-timeline", payload, token);
  console.log("Result:", JSON.stringify(result).slice(0,300));
}

main().catch(console.error);
