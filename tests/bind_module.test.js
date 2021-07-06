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

  ("pull_params_from should return falsey if params are unset", () => {
    let state = { user_id : "", date_str : "2020-01-01" };
    let pulled_params = BindModule.prototype.pull_params_from(state,  param_map, params, "output", false);
    expect(pulled_params).toBeFalsy();
  });
  
  ("pull_params_from should return data when all params are set", () => {
    let state = { user_id : "honcho", date_str : "2020-01-01" };
    let pulled_params = BindModule.prototype.pull_params_from(state,  param_map, params, "output", false);
    expect(pulled_params).toBeTruthy();
    expect(pulled_params.user).toBe("honcho");
    expect(pulled_params.date).toBe("2020-01-01");
  });
});

describe("actions", () => {
  let module = new BindModule(test_plugin_config);
  let ctx = {
    state : {},
    rootState: {
      test : {
        non_zero_param : 10,
        zero_param     : 0,
      }
    },
    commit : (...args) => args
  };
  describe("once action", () => {
    let payload = {
      output    : "output_var",
      namespace : "test/",
      binding   : {
        bind_type : "once",
      },
      endpoint  : {
        type : String,
        data : "returned by api",
      },
    };

    it("should commit data from data source when parameters are non-zero", () => {
      payload.endpoint.params = { non_zero_param : Number };
      return expect(module.actions.once(ctx, payload)).resolves.toStrictEqual(["test/output_var", "returned by api", {root : true }]);
    });
    
    it("should not commit data from data source when parameters are zero", () => {
      payload.endpoint.params = { zero_param : Number };
      return expect(module.actions.once(ctx, payload)).rejects.toStrictEqual({ message : "Not Updated" });
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
      expect(commits).toStrictEqual([["update_interval", {name: "test/output_var", interval: 1}]]);
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
