import BindModule from '@src/bind_module.js'
import BindPlugin from '@src/bind_plugin.js'
import { match } from '@src/utils.js'
import { test_plugin_config, TestDataSource } from './test-utils.js'

beforeAll(() => BindPlugin.config = test_plugin_config);
afterAll(() => BindPlugin.config = {});

var module = null;

beforeEach(() => module = new BindModule());


describe("default constructor", () => {

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
  beforeAll(() => {
    BindPlugin.config.data_source = new TestDataSource({
      state : { some_state_var : "some state" },
      mutations : { some_mutation : "some mutation is here" }
    });
  });
  afterAll(() => {
    BindPlugin.config = test_plugin_config;
  });

  it("should have state and mutations from datasource", () => {
    expect(module.state.some_state_var).toBe("some state");
    expect(module.mutations.some_mutation).toBe("some mutation is here");
  });
  
});

describe("pull_params_from", () => {
  let param_map = null;
  let params = null;
  let state = null;

  let new_this = {
    plugin_config : {}
  };

  let pull_params_from = BindModule.prototype.pull_params_from.bind(new_this);

  beforeEach(() => {
    param_map = { user_id : "user", date_str : "date" };
    params = { user: String, date: String }; 
    state = { user_id : "something", date_str : "2020-01-01" };
    new_this.plugin_config = {};
  });

  it("should pull from state when computed is defined", () => {
    param_map = { user_id : "user"};
    param_map.date = { computed : (s) => s.date.join(',') };
    params.date = String
    state.date = [1,2,3,4,5];
    let pulled_params = pull_params_from(state, param_map, params, "output");
    expect(pulled_params.date).toBe('1,2,3,4,5');
  });

  it("should return falsey if params are unset", () => {
    state.user_id = "";
    let pulled_params = pull_params_from(state,  param_map, params, "output");
    expect(pulled_params).toBeFalsy();
  });
  
  it("should return data when all params are set", () => {
    state.user_id = "honcho";
    let pulled_params = pull_params_from(state,  param_map, params, "output");
    expect(pulled_params).toBeTruthy();
    expect(pulled_params.user).toBe("honcho");
    expect(pulled_params.date).toBe("2020-01-01");
  });

  it("should warn about bad types when strict mode is on", () => {
    new_this.plugin_config.strict = true;
    state.user_id = 1000;
    console.warn = jest.fn();
    let pulled_params = pull_params_from(state, param_map, params, "output");
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(expect.any(String));
  });

  it("should not warn about good types when strict mode is on", () => {
    new_this.plugin_config.strict = true;
    state.user_id = "julia";
    console.warn = jest.fn();
    let pulled_params = pull_params_from(state,  param_map, params, "output");
    expect(console.warn).toHaveBeenCalledTimes(0);
  });

  it("should return ok if param is match.All()", () => {
    params.user = match.All();
    state.user_id = "";
    let pulled_params = pull_params_from(state, param_map, params, "out");
    expect(pulled_params.user).toBe("");
    expect(pulled_params.date).toBe("2020-01-01");
  });

  it("should return flasey if param is specified as unset", () => {
    params.user = match.AnythingBut("unset");
    state.user_id = "unset";
    let pulled_params = pull_params_from(state, param_map, params, "out");
    expect(pulled_params).toBeFalsy();
  });

  it("should info log when log_unset is set in config and a state variable is unset", () => {
    state.user_id = "";
    console.info = jest.fn();
    new_this.plugin_config.log_blocked_binds = true;
    pull_params_from(state, param_map, params, "out");
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(expect.any(String));
  });
});

describe("mutations", () => {
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

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should add interval to intervals", () => {
      let payload = {
        name   : "test/some_interval",
        func   : () => "some fun",
        period : 10000,
      };
      setInterval = jest.fn(() => 1023)
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
      window.clearInterval = jest.fn();
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
      window.clearInterval = jest.fn();
      state.intervals = { interval1 : 1234, interval2 : 4321 };
      module.mutations.clear_intervals(state);
      expect(clearInterval).toHaveBeenCalledTimes(2);
      expect(clearInterval).toHaveBeenCalledWith(1234);
      expect(clearInterval).toHaveBeenCalledWith(4321);
    });
  });

  describe("add_bound_store", () => {
    it("should store to bound list", () => {
      state.bound_stores = [];
      module.mutations.add_bound_store(state, { name: "some_store" } );
      expect(state.bound_stores).toStrictEqual(["some_store"]);
    });
  });

  describe("clear_bound_stores", () => {
    it("should clear to bound store list", () => {
      state.bound_stores = ["some","thing","here"];
      module.mutations.clear_bound_stores(state);
      expect(state.bound_stores).toStrictEqual([]);
    });
    it("should not clear root store if it is bound", () => {
      state.bound_stores = ["", "some", "thing" ];
      module.mutations.clear_bound_stores(state);
      expect(state.bound_stores).toStrictEqual([""]);
    });
  });

  describe("clear_watch_params", () => {
    it("shoud clear watch_params", () => {
      state.watch_params = { "some_mut" : "some_action" };
      module.mutations.clear_watch_params(state);
      expect(state.watch_params).toStrictEqual({});
    });
  });
});

describe("actions", () => {
  let ctx = {
    state : {},
    rootState: {
      non_zero_param : 4444,
      test : {
        non_zero_param : 10,
        zero_param     : 0,
      }
    },
    commit : jest.fn(),
    dispatch : jest.fn(),
  };

  describe("once", () => {
    let payload = { };

    let once = null;

    beforeAll(() => once = module.actions.once);

    beforeEach(() => {
      ctx.dispatch.mockClear();
      ctx.commit.mockClear();
      payload = {
        output    : "output_var",
        binding   : {
          bind : "once",
          endpoint  : {
            type : String,
            data : (params) => ({input : params, output: "from api"}),
          },
        },
        local_state : ctx.rootState.test,
        ns_prefix : "test/",
      };
    });

    it("should commit data from data source when parameters are non-zero", () => {
      payload.namespace = "test";
      payload.binding.endpoint.params = { non_zero_param : Number };
      return once(ctx, payload).then( () => {
        expect(ctx.commit).toHaveBeenCalledWith("test/update_output_var", { input: {non_zero_param : 10}, output: "from api" }, {root : true });
      });
    });
    
    it("should not commit data from data source when parameters are zero", () => {
      payload.namespace = "test";
      payload.binding.endpoint.params = { zero_param : Number };
      return once(ctx, payload).then( () => {
        expect(ctx.commit).toHaveBeenCalledTimes(0);
      });
    });

    it("should get and commit to/from rootState when no namespace", () => {
      payload.ns_prefix = "";
      payload.local_state = ctx.rootState;
      payload.binding.endpoint.params = { non_zero_param : Number };
      return once(ctx, payload).then( () => {
        expect(ctx.commit).toHaveBeenCalledWith("update_output_var", { input: {non_zero_param: 4444}, output: "from api" }, {root : true });
      });
    });

    it("should apply data source endpoint defaults", () => {
      payload.namespace = "";
      payload.binding.endpoint.params = { something : Number };
      test_plugin_config.data_source.apply_defaults.mockClear();
      return once(ctx, payload).then(() => {
        expect(test_plugin_config.data_source.apply_defaults).toHaveBeenCalledTimes(1);
        expect(test_plugin_config.data_source.apply_defaults).toHaveBeenCalledWith("output_var", payload.binding.endpoint);
      });
    });

    it("should warn on bad type from api when strict mode is on", () => {
      console.warn = jest.fn();
      payload.binding.endpoint.params = { non_zero_param : Number };
      test_plugin_config.strict = true;
      return once(ctx, payload).then( () => {
        expect(console.warn).toHaveBeenCalledTimes(1);
        test_plugin_config.strict = false;
      });
    });

    it("should dispatch binding side effect when given", () => {
      payload.namespace = "test";
      payload.binding.side_effect = "do_something_else";
      payload.binding.endpoint.params = { non_zero_param : Number };
      ctx.dispatch.mockClear();
      return once(ctx, payload).then( () => {
        expect(ctx.dispatch).toHaveBeenCalledTimes(1);
        expect(ctx.dispatch).toHaveBeenCalledWith("test/do_something_else", expect.any(Object), {root : true});
      });
    });

    it("should use binding transform when given", () => {
      payload.namespace = "test";
      payload.binding.transform = (data) => data["input"];
      payload.binding.endpoint.params = { non_zero_param : Number };
      return once(ctx, payload).then( () => {
        expect(ctx.commit).toHaveBeenCalledWith("test/update_output_var",{non_zero_param : 10}, {root : true });
      });
    });

    it("should commit to redirect in namespace when given", () => {
      payload.namespace = "test";
      payload.binding.redirect = "update_something_else";
      payload.binding.endpoint.params = { non_zero_param : Number };
      return once(ctx, payload).then( () => {
        expect(ctx.commit).toHaveBeenCalledWith("test/update_something_else", expect.any(Object), { root : true });
      });
    });

    it("should set done loading variables", () => {
      payload.namespace = "test";
      payload.binding.loading = true;
      payload.binding.endpoint.params = { non_zero_param : Number };
      return once(ctx, payload).then( () => {
        expect(ctx.commit).toHaveBeenCalledTimes(2);
        expect(ctx.commit).toHaveBeenCalledWith("test/done_loading_output_var", null, { root : true });
      });
    });
  });
  
  describe("bind", () => {
    let payload = null;

    beforeEach( () => {
      ctx.dispatch.mockClear();
      ctx.commit.mockClear();
      payload = {
        namespace : "test",
        binding   : {
          endpoint : {},
        },
      };
    });

    it("should set ns_prefix and local_state to '' and rootState when namespace is ''", () => {
      payload.namespace = "";
      module.actions.bind(ctx, payload);
      expect(ctx.dispatch).toHaveBeenCalledWith("once", { 
        ...payload,
        ns_prefix   : "",
        local_state : ctx.rootState,
      });
    })

    it("should dispatch once action with bind is trigger", () => {
      payload.binding.bind = "trigger";
      module.actions.bind(ctx, payload)
      expect(ctx.dispatch).toHaveBeenCalledWith("once", { 
        ...payload,
        ns_prefix   : "test/",
        local_state : ctx.rootState.test,
      });
    });

    it("should dispatch once action with bind is once", () => {
      payload.binding.bind = "once";
      module.actions.bind(ctx, payload)
      expect(ctx.dispatch).toHaveBeenCalledWith("once", { 
        ...payload,
        ns_prefix   : "test/",
        local_state : ctx.rootState.test,
      });
    });

    it("should dispatch once action with bind is change", () => {
      payload.binding.bind = "change";
      module.actions.bind(ctx, payload)
      expect(ctx.dispatch).toHaveBeenCalledWith("once", { 
        ...payload,
        ns_prefix   : "test/",
        local_state : ctx.rootState.test,
      });
    });
    
    it("should dispatch watch action when bind is watch", () => {
      payload.binding.bind = "watch";
      module.actions.bind(ctx, payload);
      expect(ctx.dispatch).toHaveBeenCalledWith("watch", { 
        ...payload,
        ns_prefix   : "test/",
        local_state : ctx.rootState.test,
      });
    });
  });
  
  describe("watch", () => {
    let payload = {
      output    : "output_var",
      namespace : "test",
      ns_prefix : "test/",
      local_state : ctx.rootState.test,
      binding   : {
        endpoint  : {},
        bind : "watch",
        period: 1000
      },
    };

    beforeEach(() => {
      jest.useFakeTimers();
      ctx.dispatch.mockClear();
      ctx.commit.mockClear();
    });

    afterEach(() => jest.useRealTimers());

    it("should dispatch once action when called", () => {
      module.actions.watch(ctx, payload);
      expect(ctx.dispatch).toHaveBeenCalledWith("once", payload);
    });

    it("should commit an interval id to intervals", () => {
      module.actions.watch(ctx, payload);
      expect(ctx.commit).toHaveBeenCalledWith("add_interval", {name: "test/output_var", func : expect.any(Function), period : 1000 });
    });

    it("should dispatch once action on an interval", () => {
      module.actions.watch(ctx, payload);
      expect(ctx.commit).toHaveBeenCalledTimes(1);
      ctx.dispatch.mockClear();
      // call the function passed to add_interval
      ctx.commit.mock.calls[0][1].func();
      expect(ctx.dispatch).toHaveBeenCalledWith("once", payload);
    });
  });

  describe("reset", () => {

    beforeEach(() => ctx.commit.mockClear());

    it("should return a promise", () => {
      expect(module.actions.reset(ctx)).toBeInstanceOf(Promise);
    });

    it("should clear watch_params, bound_stores and intevals", () =>  {
      return expect(module.actions.reset(ctx)).resolves.toBeUndefined().then( () => {
        expect(ctx.commit).toHaveBeenCalledTimes(3);
        expect(ctx.commit).toHaveBeenCalledWith("clear_watch_params");
        expect(ctx.commit).toHaveBeenCalledWith("clear_intervals");
        expect(ctx.commit).toHaveBeenCalledWith("clear_bound_stores");
      });
    })
  });

});
