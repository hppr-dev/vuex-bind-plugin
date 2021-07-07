import BindPlugin from '../src/bind_plugin.js'
import { RestDataSource } from '../src/data_sources.js'
import BoundStore from '../src/bound_store.js'
import BindModule from '../src/bind_module.js'
import { mock_prototype } from './test-utils.js'

jest.mock('../src/bound_store.js')
jest.mock('../src/bind_module.js')

describe("constructor", () => {
  let config = {};
  let plugin = null;
  let store = {
    modules : {},
  };

  beforeEach(() => plugin = new BindPlugin(config));

  it("return a function", () => {
    expect(plugin).toBeInstanceOf(Function);
  });
  
  it("should return a function that subscribes to mutations", () => {
    store.subscribe = jest.fn();
    plugin(store);
    expect(store.subscribe).toHaveBeenCalledTimes(1);
    expect(store.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  describe("returned function", () => {
    let state = {
      bind : {
        watch_params : {}
      }
    };

    let config_store = mock_prototype(BindPlugin, "config_store")

    store.subscribe = jest.fn();
    store.dispatch = jest.fn();

    beforeEach(() => {
      store.subscribe.mockClear();
      store.dispatch.mockClear();
    });

    it("should configure store", () => {
      plugin(store);
      expect(config_store).toHaveBeenCalledTimes(1);
      expect(config_store).toHaveBeenCalledWith(store);
    });

    it("should react to watched parameters", () => {
      plugin(store);
      state.bind.watch_params = { 
        param1 : ["action1", "action2"]
      };
      let mutation = { type : "param1" };
      let sub_fun = store.subscribe.mock.calls[0][0];
      sub_fun(mutation, state);
      expect(store.dispatch).toHaveBeenCalledTimes(2);
      expect(store.dispatch).toHaveBeenCalledWith("action1");
      expect(store.dispatch).toHaveBeenCalledWith("action2");
    });

    it("should ignore to unwatched parameters", () => {
      plugin(store);
      state.bind.watch_params = { 
        param1 : ["action1", "action2"]
      };
      let mutation = { type : "param2" };
      let sub_fun = store.subscribe.mock.calls[0][0];
      sub_fun(mutation, state);
      expect(store.dispatch).toHaveBeenCalledTimes(0);
    });
  });
  
});

describe("config_store", () => {
  let plugin = null;
  let config = {};
  let store = {};

  beforeEach(() => {
    plugin = new BindPlugin(config)
    config = {};
    BoundStore.mockClear();
    BindModule.mockClear();
    store = {
      subscribe : jest.fn(),
      modules   : {
        module1 : { bindings: true },
        module2 : { actions: "some actions" }
      },
    };
  });

  it("should configure default bind module", () => {
    plugin(store);
    expect(BindModule).toHaveBeenCalledTimes(1);
    expect(store.modules.bind).toBeDefined();
  });

  it("should custom namespaced module", () => {
    config.namespace = "my_bind_module";
    plugin = new BindPlugin(config);
    plugin(store);
    expect(BindModule).toHaveBeenCalledTimes(1);
    expect(store.modules.my_bind_module).toBeDefined();
  });

  it("should add bound stores for each module with bindings", () => {
    plugin(store);
    expect(BoundStore).toHaveBeenCalledTimes(1);
    expect(BoundStore).toHaveBeenCalledWith({ bindings : true }, "module1", expect.any(Object));
  });

  it("should leave modules without bindings as is", () => {
    plugin(store);
    expect(store.modules.module2).toStrictEqual( {actions: "some actions" });
  });

});
