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

    store.subscribe = jest.fn();
    store.dispatch = jest.fn();

    store.registerModule = jest.fn();

    beforeEach(() => {
      store.subscribe.mockClear();
      store.dispatch.mockClear();
      BindModule.mockClear();
      store.registerModule.mockClear();
    });

    it("should register store", () => {
      plugin(store);
      expect(store.registerModule).toHaveBeenCalledTimes(1);
      expect(store.registerModule).toHaveBeenCalledWith("bind", expect.any(Object));
      expect(BindModule).toHaveBeenCalledTimes(1);
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

