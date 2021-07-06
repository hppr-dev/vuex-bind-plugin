import BindModule from '../src/bind_module.js'
import { MockRestDataSource }  from '../src/bind_plugin.js'

const test_plugin_config = {
  data_source : new MockRestDataSource({})
};

test("constructor should returns an object", () => {
  let module = new BindModule(test_plugin_config);
  expect(module).toBeInstanceOf(Object);
});

test("constructor should return state, actions and mutations", () => {
});

test("constructor should have state and mutations from datasource", () => {
});

test("contructor should have bind, once and watch actions", () => {
});

test("pull_params_from should return falsey if params are unset", () => {
});

test("pull_params_from should return data when all params are set", () => {
});

test("once action should commit data from data source when parameters are non-zero", () => {
});

test("once action should not commit data from data source when parameters are zero", () => {
});

test("bind action should dispatch once action when bind_type is trigger, once, or change", () => {
});

test("bind action should dispatch watch action when bind_type is watch", () => {
});

test("watch action should dispatch once action when called and then after a period of time", () => {
});
