const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("core/controller/controller.js", "utf8");
const events = [];

const context = {
  console,
  document: {},
  window: {
    history: {
      state: null,
      replaceState(state) { this.state = state; },
      pushState(state) { this.state = state; }
    },
    addEventListener() {},
    Dalimgari: {
      registry: { definition: { login: "", home: "", profile: "" } },
      auth: {
        async getSession() {
          return { data: { session: { user: { id: "1" } } } };
        },
        async getUser() {
          return { data: { user: { id: "1", email: "user@example.com" } } };
        },
        async login() {
          return { data: { session: { user: { id: "1" } } } };
        }
      },
      supabase: {
        from(table) {
          assert.equal(table, "profiles");
          return {
            select() {
              return {
                eq() {
                  return {
                    async single() {
                      return {
                        data: {
                          id: "1",
                          email: "user@example.com",
                          display_name: "User",
                          is_admin: false,
                          is_active: true,
                          avatar_url: null,
                          created_at: null,
                          updated_at: null
                        },
                        error: null
                      };
                    }
                  };
                }
              };
            }
          };
        }
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
  const profileResult = await controller.handleAction("profile");
  assert.equal(profileResult.error, undefined);
  assert.equal(controller.getDefinition(), "profile");

  const loginResult = await controller.handleAction("login", {
    identifier: "user@example.com",
    password: "password"
  });
  assert.equal(loginResult.error, undefined);
  assert.equal(controller.getDefinition(), "profile");

  assert.equal(controller.isBusy(), false);
  assert.ok(events.some(event => event.action === "definition-change"));
  console.log("controller architecture tests passed");
})();
