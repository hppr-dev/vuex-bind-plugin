import BindModule from '../src/bind_module.js'
import { test_plugin_config, TestDataSource } from './test-utils.js'

describe("default constructor", () => {
  let module = new BindModule(test_plugin_config);

  it("should returns an object", () => {
    expect(module).toBeInstanceOf(Object);
  });
  
  it("should return state, actions and mutations", () => {
    expect(module.state).toBeInstanceOf(Object);
    expect(module.mutations).toBeInstanceOf(Object);
    expect(module.actions).toBeInstanceOf(Object);
  });
  
  it("should have bind, once and watch actions", () => {
    expect(module.actions.bind).toBeInstanceOf(Function);
    expect(module.actions.once).toBeInstanceOf(Function);
    expect(module.actions.watch).toBeInstanceOf(Function);
  });
});

describe("constructor with custom data source", () => {
  let config_copy = Object.assign({}, test_plugin_config);
  config_copy.data_source = new TestDataSource({
    state : { some_state_var : "some state" },
    mutations : { some_mutation : "some mutation is here" }
  });
  let module = new BindModule(config_copy);

  it("should have state and mutations from datasource", () => {
    expect(module.state.some_state_var).toBe("some state");
    expect(module.mutations.some_mutation).toBe("some mutation is here");
  });
  
});

describe("pull_params_from", () => {
  let param_map = { user_id : "user", date_str : "date" };
  let params = { user: String, date: String }; 
  let state = { user_id : "", date_str : "2020-01-01" };

  it("should return falsey if params are unset", () => {
    state.user_id = "";
    let pulled_params = BindModule.prototype.pull_params_from(state,  param_map, params, "output", false);
    expect(pulled_params).toBeFalsy();
  });
  
  it("should return data when all params are set", () => {
    state.user_id = "honcho";
    let pulled_params = BindModule.prototype.pull_params_from(state,  param_map, params, "output", false);
    expect(pulled_params).toBeTruthy();
    expect(pulled_params.user).toBe("honcho");
    expect(pulled_params.date).toBe("2020-01-01");
  });

  it("should warn about bad types when strict mode is on", () => {
    state.user_id = 1000;
    console.warn = jest.fn();
    let pulled_params = BindModule.prototype.pull_params_from(state,  param_map, params, "output", true);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.any(String));
  });

  it("should not warn about good types when strict mode is on", () => {
    state.user_id = "julia";
    console.warn = jest.fn();
    let pulled_params = BindModule.prototype.pull_params_from(state,  param_map, params, "output", true);
    expect(console.warn).toHaveBeenCalledTimes(0);
  });
});

describe("mutations", () => {
  let module = new BindModule(test_plugin_config);
  let state = {
    intervals : {},
    watch_params : {}
  };

  describe("watch_params", () => {

    it("should map mutations to action", () => {
      let payload = {
        mutations : ["test/update_param1", "test/update_param2"],
        action : "test/action",
      };
      state.watch_params = {};
      module.mutations.watch_params(state, payload);
      expect(state.watch_params).toStrictEqual({
        "test/update_param1" : ["test/action"],
        "test/update_param2" : ["test/action"],
      });
    });

    it("should allow more than one action to be assigned", () => {
      let payload = {
        mutations : ["update_param1"],
        action : "test/action2",
      };
      state.watch_params = {
        "update_param1" : ["test/action1"],
        "update_param2" : ["test/action1"],
      };
      module.mutations.watch_params(state, payload);
      expect(state.watch_params).toStrictEqual({
        "update_param1" : ["test/action1", "test/action2"],
        "update_param2" : ["test/action1"],
      });
    });
  });

  describe("add_interval", () => {

    it("should add interval to intervals", () => {
      let payload = {
        name : "test/some_interval",
        interval: 1023,
      };
      state.intervals = {};
      module.mutations.add_interval(state, payload);
      expect(state.intervals).toStrictEqual({
        "test/some_interval" : 1023
      });
    });
  });

  describe("delete_interval", () => {

    it("should remove interval from intervals", () => {
      let payload = {
        name : "interval1",
      };
      state.intervals = { interval1 : 1234, interval2 : 4321 };
      module.mutations.delete_interval(state, payload);
      expect(state.intervals).toStrictEqual({ interval2 : 4321 });
    });

    it("should clear interval", () => {
      let payload = {
        name : "interval1",
      };
      clearInterval = jest.fn();
      state.intervals = { interval1 : 1234, interval2 : 4321 };
      module.mutations.delete_interval(state, payload);
      expect(clearInterval).toHaveBeenCalledTimes(1);
      expect(clearInterval).toHaveBeenCalledWith(1234);
    });
  });

  describe("clear_intervals", () => {

    it("should remove all intervals from intervals", () => {
      state.intervals = { interval1 : 1234, interval2 : 4321 };
      module.mutations.clear_intervals(state);
      expect(state.intervals).toStrictEqual({});
    });

    it("should clear all intervals", () => {
      clearInterval = jest.fn();
      state.intervals = { interval1 : 1234, interval2 : 4321 };
      module.mutations.clear_intervals(state);
      expect(clearInterval).toHaveBeenCalledTimes(2);
      expect(clearInterval).toHaveBeenCalledWith(1234);
      expect(clearInterval).toHaveBeenCalledWith(4321);
    });
  });
});

describe("actions", () => {
  let module = new BindModule(test_plugin_config);
  let ctx = {
    state : {},
    rootState: {
      non_zero_param : 4444,
      test : {
        non_zero_param : 10,
        zero_param     : 0,
      }
    },
    commit : (...args) => args
  };

  describe("once", () => {
    let payload = {
      output    : "output_var",
      binding   : {
        bind_type : "once",
      },
      endpoint  : {
        type : String,
        data : (params) => ({input : params, output: "from api"}),
      },
    };

    it("should commit data from data source when parameters are non-zero", () => {
      payload.namespace = "test/";
      payload.endpoint.params = { non_zero_param : Number };
      return expect(module.actions.once(ctx, payload)).resolves.toStrictEqual(["test/output_var", { input: {non_zero_param : 10}, output: "from api" }, {root : true }]);
    });
    
    it("should not commit data from data source when parameters are zero", () => {
      payload.namespace = "test/";
      payload.endpoint.params = { zero_param : Number };
      return expect(module.actions.once(ctx, payload)).rejects.toStrictEqual({ message : "Not Updated" });
    });

    it("should get and commit to/from rootState when no namespace", () => {
      payload.namespace = "";
      payload.endpoint.params = { non_zero_param : Number };
      return expect(module.actions.once(ctx, payload)).resolves.toStrictEqual(["output_var", { input: {non_zero_param: 4444}, output: "from api" }, {root : true }]);
    });
  });
  
  describe("bind action", () => {
    let ctx = {
      dispatch : (...args) => args
    };
    let payload = {
      binding   : {
      },
    };

    it("bind action should dispatch once action with bind_type is trigger", () => {
      payload.binding.bind_type = "trigger";
      expect(module.actions.bind(ctx, payload)).toStrictEqual(["once", payload]);
    });

    it("bind action should dispatch once action with bind_type is once", () => {
      payload.binding.bind_type = "once";
      expect(module.actions.bind(ctx, payload)).toStrictEqual(["once", payload]);
    });

    it("bind action should dispatch once action with bind_type is change", () => {
      payload.binding.bind_type = "change";
      expect(module.actions.bind(ctx, payload)).toStrictEqual(["once", payload]);
    });
    
    it("bind action should dispatch watch action when bind_type is watch", () => {
      payload.binding.bind_type = "watch";
      expect(module.actions.bind(ctx, payload)).toStrictEqual(["watch", payload]);
    });
  });
  
  describe("watch action", () => {
    let dispatches = [];
    let commits = [];
    let ctx = {
      dispatch : (...args) => {
        dispatches.push(args);
        return args;
      },
      commit : (...args) => {
        commits.push(args)
      }
    };
    let payload = {
      output    : "output_var",
      namespace : "test/",
      binding   : {
        bind_type : "watch",
        period: 1000
      },
    };

    beforeEach(() => {
      jest.useFakeTimers();
      dispatches = [];
      commits = [];
    });

    afterEach(() => jest.useRealTimers());

    it("should dispatch once action when called", () => {
      expect(module.actions.watch(ctx, payload)).toStrictEqual(["once", payload]);
      expect(dispatches).toStrictEqual([["once", payload]])
    });

    it("should commit an interval id to intervals", () => {
      setInterval = jest.fn(() => 1)
      module.actions.watch(ctx, payload);
      expect(commits).toStrictEqual([["add_interval", {name: "test/output_var", interval: 1}]]);
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(setInterval).toHaveBeenCalledTimes(1);
    });

    it("should dispatch once action on an interval", () => {
      module.actions.watch(ctx, payload);
      jest.advanceTimersByTime(1001);
      expect(dispatches).toStrictEqual([["once", payload],["once", payload]])
    });
  });
});
