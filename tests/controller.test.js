const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("core/controller/controller.js", "utf8");
const events = [];

const context = {
  console,
  window: {
    Dalimgari: {
      registry: { definition: { login: "", home: "", profile: "" } },
      auth: {
        async getSession() { return { data: { session: { user: { id: "1" } } } }; },
        async login() { return { data: { session: {} } }; }
      }
    }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const controller = context.window.Dalimgari.controller;
controller.subscribe((action, payload) => events.push({ action, payload }));

assert.equal(controller.setDefinition("missing"), false);
assert.equal(controller.getDefinition(), null);

assert.equal(controller.setDefinition("login"), true);
assert.equal(controller.getDefinition(), "login");

(async () => {
  await controller.handleAction("profile");
  assert.equal(controller.getDefinition(), "profile");

const loginResult = await controller.handleAction("login", {
  identifier: "user@example.com",
  password: "password"
});
assert.equal(loginResult.error, undefined);
assert.equal(controller.getDefinition(), "home");

assert.ok(events.some(event => event.action === "definition-change"));
console.log("controller architecture tests passed");
})();
