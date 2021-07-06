import BindPlugin from '../bind_plugin.js'
import { RestDataSource } from '../data_sources.js'

test("BindPlugin returns function", () => {
  let plugin = new BindPlugin({});
  expect(plugin).toBeInstanceOf(Function);
});
