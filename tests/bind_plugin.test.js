import BindPlugin from '../src/bind_plugin.js'
import { RestDataSource } from '../src/data_sources.js'

test("BindPlugin returns function", () => {
  let plugin = new BindPlugin({});
  expect(plugin).toBeInstanceOf(Function);
});

test("BindPlugin should subscribe to commit mutations", () => {
});

test("BindPlugin should create bind module", () => {
});

test("BindPlugin should create custom namespaced module", () => {
});

test("BindPlugin should create bound stores for each module with bindings", () => {
});

test("BindPlugin should leave modules without bindings as is", () => {
});
