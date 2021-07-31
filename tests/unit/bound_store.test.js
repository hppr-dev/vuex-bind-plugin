import BoundStore from '@src/bound_store.js'
import BindPlugin from '@src/bind_plugin.js'
import * as utils from '@src/utils.js'
import { test_plugin_config, mock_prototype } from './test-utils.js'


jest.spyOn(utils, "apply_binding_defaults");
jest.spyOn(utils, "create_bound_stores");
beforeAll(() => BindPlugin.config = test_plugin_config);
afterAll(() => BindPlugin.config = null);

describe("constructor", () => {
  let store = null
  let init_store = (bindings, namespace, extras={}) => store = new BoundStore({
    namespace : namespace,
    bindings,
    state : {
      regular_state_var : "hello",
      dont_touch : "dont touch this state",
    },
    mutations : {
      regular_mutation : "mutate a thing",
      update_dont_touch : "dont touch me",
    },
    actions : {
      regular_action : "some action",
    },
    ...extras
  });


  let generate_modifications = mock_prototype(BoundStore, "generate_modifications");

  it('should return a module config', () => {
    store = init_store({}, "test");
    expect(store.namespaced).toBe(true);
    expect(store.state.regular_state_var).toBe("hello");
    expect(store.mutations.regular_mutation).toBe("mutate a thing");
    expect(store.actions.regular_action).toBe("some action");
    expect(store.bindings).toBeUndefined();
    expect(generate_modifications).toHaveBeenCalledTimes(1);
  });

  it('should return a root root module config when namespace is ""', () => {
    store = init_store({}, "", { strict: "Some value that shouldn't be changed"});
    expect(store.strict).toBe("Some value that shouldn't be changed");
    expect(store.namespaced).toBe(true);
    expect(store.state.regular_state_var).toBe("hello");
    expect(store.mutations.regular_mutation).toBe("mutate a thing");
    expect(store.actions.regular_action).toBe("some action");
    expect(store.bindings).toBeUndefined();
    expect(generate_modifications).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if namespace is undefined', () => {
    expect(() => init_store({})).toThrow();
  });

  it('should throw an error if plugin not configured', () => {
    BindPlugin.config = undefined;
    expect(() => init_store({}, "mystore")).toThrow();
    BindPlugin.config = test_plugin_config;
  });

  it('should apply binding defaults',  () => {
    store = init_store({ some : { }, thing: { } }, "ns");
    expect(utils.apply_binding_defaults).toHaveBeenCalledTimes(2);
    expect(utils.apply_binding_defaults).toHaveBeenCalledWith("some",  { endpoint: undefined, bind:"once", param_map: {}, create_params : true, reject_on_unset : true });
    expect(utils.apply_binding_defaults).toHaveBeenCalledWith("thing", { endpoint: undefined, bind:"once", param_map: {}, create_params : true, reject_on_unset : true });
  });

  it("should throw when initializing a bind to a named unknown endpoint and strict is on", () => {
    BindPlugin.config.strict = true;
    expect(() => init_store({ some : { endpoint : "asdf" } }, "ns")).toThrow("some");
    expect(() => init_store({ some : { endpoint : "asdf" } }, "ns")).toThrow("asdf");
    BindPlugin.config.strict = false;
  });

  it("should throw when initializing a bind with bad bind and strict is on", () => {
    BindPlugin.config.strict = true;
    expect(() => init_store({ some : { bind : "asdf", endpoint: {} } }, "ns")).toThrow("some");
    expect(() => init_store({ some : { bind : "asdf", endpoint: {} } }, "ns")).toThrow("asdf");
    BindPlugin.config.strict = false;
  });

  it("should handle empty state, mutations, etc", () => {
    store = new BoundStore({ namespace: "empty", bindings : {} });
    expect(store).toBeDefined();
  });

  it("should not overwrite already written state and mutations", () => {
    let hold = BoundStore.prototype.generate_modifications;
    BoundStore.prototype.generate_modifications = function() {
      this.generated_state = {
        dont_touch : "this is changed",
      };
      this.generated_mutations = {
        update_dont_touch : "this is also changed",
      };
    }
    store = init_store( { dont_touch : { endpoint : {}, create_params: true } }, "test" );
    expect(store.state.dont_touch).toBe("dont touch this state");
    expect(store.mutations.update_dont_touch).toBe("dont touch me");
    BoundStore.prototype.generate_modifications = hold;
  })

  it("should create nested bound stores if modules is defined", () => {
    let config = {
      namespace : "tester",
      modules : {
        some_module : {}
      },
      bindings : {}
    };
    let bound_store = new BoundStore(config);
    expect(utils.create_bound_stores).toHaveBeenCalledTimes(1);
    expect(utils.create_bound_stores).toHaveBeenCalledWith(config.modules);
  });
  
});

describe("generate_modifications", () => {

  let new_this = {
    bindings : {},
    plugin_config : {
      endpoints : {},
    },
    watch_param_defs : {},
    create_variable : jest.fn(),
    create_loading_variable : jest.fn(),
    create_load_action : jest.fn(),
    create_start_bind_action : jest.fn(),
  };

  let generate_modifications = BoundStore.prototype.generate_modifications.bind(new_this);

  beforeEach(() => {
    new_this.bindings = {};
    new_this.plugin_config.endpoints = {};
    new_this.watch_param_defs = {};
  });

  afterEach(() => {
    new_this.create_variable.mockClear();
    new_this.create_loading_variable.mockClear();
    new_this.create_load_action.mockClear();
    new_this.create_start_bind_action.mockClear();
  });

  it("should map state variables to parameters when param_map is set", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : {
        params : {
          id: Number,
          name: String,
        },
      },
      param_map : {
        user_id : "id",
        username: "name",
      },
      create_params : true,
      redirect : "somewhere",
    };
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(2);
    expect(new_this.create_variable).toHaveBeenCalledWith("user_id", Number);
    expect(new_this.create_variable).toHaveBeenCalledWith("username", String);
  });

  it("should create loading variable when loading is set", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : { params : {} },
      loading   : true,
    };
    generate_modifications();
    expect(new_this.create_loading_variable).toHaveBeenCalledTimes(1);
    expect(new_this.create_loading_variable).toHaveBeenCalledWith("out");
  });

  it("should create parameter variables when create_params is set", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : {
        params : {
          id : Number,
          user : String,
        },
        type: Array
      },
      create_params : true,
    }
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(3);
    expect(new_this.create_variable).toHaveBeenCalledWith("out", Array);
    expect(new_this.create_variable).toHaveBeenCalledWith("id", Number);
    expect(new_this.create_variable).toHaveBeenCalledWith("user", String);
  });

  it("should not create output variable when redirect is set", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : {
        params : {
          id : Number,
          user : String,
        },
      },
      create_params : true,
      redirect : "to_something_else",
    };
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(2);
    expect(new_this.create_variable).toHaveBeenCalledWith("id", Number);
    expect(new_this.create_variable).toHaveBeenCalledWith("user", String);
  });

  it("should add parameters to watch with change binding", () => {
    let params =  {
      day : Number,
      month : String,
    };
    new_this.bindings.out = {
      bind : "change",
      endpoint  : { params },
    };
    generate_modifications();
    expect(new_this.watch_param_defs).toStrictEqual({"out" : ["day", "month"]});
  });

  it("should add parameters to watch with watch binding", () => {
    let params =  {
      day : Number,
      month : String,
    };
    new_this.bindings.out = {
      bind : "watch",
      endpoint  : { params }
    };
    generate_modifications();
    expect(new_this.watch_param_defs).toStrictEqual({"out" : ["day", "month"]});
  });

  it("should not add parameters to watch with once binding", () => {
    let params =  {
      day : Number,
      month : String,
    };
    new_this.bindings.out = {
      bind : "once",
      endpoint  :  { params },
    };
    generate_modifications();
    expect(new_this.watch_param_defs).toStrictEqual({});
  });

  it("should create load action for each binding", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : { params : {} },
    };
    new_this.bindings.out2 = {
      bind : "change",
      endpoint  : { params : {} },
      redirect  : "out",
    };
    generate_modifications();
    expect(new_this.create_load_action).toHaveBeenCalledTimes(2);
    expect(new_this.create_load_action).toHaveBeenCalledWith("out", new_this.bindings.out);
    expect(new_this.create_load_action).toHaveBeenCalledWith("out2", new_this.bindings.out2);
  });

  it("should create a start_bind action", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : { params : {} },
    };
    generate_modifications();
    expect(new_this.create_start_bind_action).toHaveBeenCalledTimes(1);
  });

  it("should handle when endpoint does not have params and create_params is true", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : {},
      create_params : true
    };
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(1);
    expect(new_this.create_variable).toHaveBeenCalledWith("out", undefined);
  });

  it("should not create the output variable when the output is in parameters and create_params is false", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : {
        params : { out : String },
      },
      type : String,
    };
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(0);
  });

  it("should not create the computed params", () => {
    new_this.bindings.out = {
      bind : "once",
      endpoint  : {
        params : { param1 : String },
      },
      type : String,
      param_map : {
        param1 : { computed : () => "something" }
      },
      redirect : "no_output",
      create_params : true,
    };
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(0);
  });

});

describe("create_variable", () => {
  let new_this = {
    generated_state : {},
    generated_mutations : {},
    generated_actions   : {},
    plugin_config : {
      update_prefix : "update_",
    },
  };

  let create_variable = BoundStore.prototype.create_variable.bind(new_this);
  beforeAll(() => create_variable("some_variable", Number));

  it("should create state variable with default type", () => {
    expect(new_this.generated_state.some_variable).toBe(0);
  });

  it("should create update mutation", () => {
    expect(new_this.generated_mutations.update_some_variable).toStrictEqual(expect.any(Function));
  });

  it("should create mutation that updates state", () => {
    let state = {
      some_variable : "hello"
    };
    new_this.generated_mutations.update_some_variable(state, "from the otherside");
    expect(state.some_variable).toBe("from the otherside");
  });

  it("should assume object if type is not set", () => {
    create_variable("no_type_variable");
    expect(new_this.generated_state.no_type_variable).toStrictEqual(Object());
  });
});

describe("create_loading_variable", () => {
  let new_this = {
    generated_state : {},
    generated_mutations : {},
    generated_actions   : {},
    plugin_config : {
      loading_prefix : "loading_",
      done_prefix : "done_",
    },
  };

  let create_loading_variable = BoundStore.prototype.create_loading_variable.bind(new_this);
  beforeAll(() => create_loading_variable("some_var"));

  it("should create loading state variable", () => {
    expect(new_this.generated_state.loading_some_var).toBeDefined();
    expect(new_this.generated_state.loading_some_var).toStrictEqual(false);
  });

  it("should create loading mutation that sets state to true", () => {
    let state = { loading_some_var : false };
    expect(new_this.generated_mutations.loading_some_var).toStrictEqual(expect.any(Function));
    new_this.generated_mutations.loading_some_var(state);
    expect(state.loading_some_var).toBe(true);
  });

  it("should create done mutation that sets state to false", () => {
    let state = { loading_some_var : true };
    expect(new_this.generated_mutations.done_loading_some_var).toStrictEqual(expect.any(Function));
    new_this.generated_mutations.done_loading_some_var(state);
    expect(state.loading_some_var).toBe(false);
  });

});

describe("create_load_action", () => {
  let new_this = {
    generated_actions   : {},
    namespace : "create",
    all_load_actions : [],
    commit_on_start : [],
  };

  let create_load_action = BoundStore.prototype.create_load_action.bind(new_this);

  beforeEach(() => {
    new_this.generated_actions = {};
    new_this.all_load_actions = [];
    new_this.commit_on_start = [];
  });

  beforeAll(() => BindPlugin.config.namespace = "mybind");
  afterAll(() => BindPlugin.config.namespace = "bind");

  it("should create load action when bind is once", () => {
    create_load_action("output", {bind : "once"});
    expect(new_this.generated_actions.load_output).toBeDefined();
    expect(new_this.generated_actions.load_output).toStrictEqual(expect.any(Function));
    expect(new_this.all_load_actions).toStrictEqual(["load_output"]);
  });

  it("should create trigger action when bind is trigger", () => {
    create_load_action("output", {bind : "trigger"});
    expect(new_this.generated_actions.trigger_output).toBeDefined();
    expect(new_this.generated_actions.trigger_output).toStrictEqual(expect.any(Function));
    expect(new_this.all_load_actions).toStrictEqual([]);
  });

  it("should create load action that dispatches bind module bind action", () => {
    create_load_action("output", { name : "something", bind : "once", endpoint : { this_is : "an endpoint" }});
    let ctx = {
      dispatch : jest.fn()
    };
    new_this.generated_actions.load_output(ctx);
    expect(ctx.dispatch).toHaveBeenCalledTimes(1);
    expect(ctx.dispatch).toHaveBeenCalledWith("mybind/bind", { 
      binding   : { name : "something", bind : "once", endpoint : { this_is : "an endpoint"} },
      namespace : "create",
      output    : "output"
    }, { root : true });
  });

  it("should generate an action that returns a the promise from dispatch", () => {
    create_load_action("output", { name : "something", bind : "once", endpoint : { this_is : "an endpoint" }});
    let ctx = {
      dispatch : jest.fn()
    };
    ctx.dispatch.mockReturnValue("this is returned from dispatch");
    expect(new_this.generated_actions.load_output(ctx)).toBe("this is returned from dispatch");
  });

  it("should add variables to commit_on_start if loading is set", () => {
    create_load_action("output", { name : "something", bind : "once", loading: true, endpoint : { this_is : "an endpoint" }});
    expect(new_this.commit_on_start).toStrictEqual(["loading_output"]);
  });

  it("should create action that sets loading when loading is set to each", () => {
    create_load_action("output", { name : "something", bind : "change", loading: "each", endpoint : { this_is : "an endpoint" }});
    let ctx = {
      dispatch : jest.fn(),
      commit   : jest.fn()
    };
    new_this.generated_actions.load_output(ctx);
    expect(ctx.commit).toHaveBeenCalledWith("loading_output");
  });

});

describe("create_start_bind_action", () => {
  let new_this = {
    namespace : "dinner",
    generated_actions   : {},
    all_load_actions : [ "pizza", "pasta", "pepperoni" ],
    plugin_config : {
      load_prefix : "load_",
    },
    add_watch_params : jest.fn(),
    commit_on_start : [ "loading_pizza", "loading_pasta" ],
  };

  let ctx = {
    dispatch : jest.fn(),
    commit   : jest.fn(),
    rootState : {
      bind : {
        bound_stores : [],
      },
    },
  };

  beforeEach(() => {
    new_this.add_watch_params.mockClear();
    ctx.dispatch.mockClear();
    ctx.commit.mockClear();
  });

  let create_start_bind_action = BoundStore.prototype.create_start_bind_action.bind(new_this);

  beforeAll(()=> create_start_bind_action());

  it("should create a start_bind action", () => {
    expect(new_this.generated_actions.start_bind).toBeDefined();
    expect(new_this.generated_actions.start_bind).toStrictEqual(expect.any(Function));
  });

  it("should create action that returns a promise", () => {
    expect(new_this.generated_actions.start_bind(ctx)).toBeInstanceOf(Promise);
  });

  it("should create start_bind action that dispatches all load actions", () => {
    return new_this.generated_actions.start_bind(ctx).then(() => {
      expect(ctx.dispatch).toHaveBeenCalledTimes(3);
      expect(ctx.dispatch).toHaveBeenCalledWith("pizza");
      expect(ctx.dispatch).toHaveBeenCalledWith("pasta");
      expect(ctx.dispatch).toHaveBeenCalledWith("pepperoni");
    });
  });

  it("should create start_bind action that commits all ", () => {
    return new_this.generated_actions.start_bind(ctx).then(() => {
      expect(ctx.commit).toHaveBeenCalledTimes(3);
      expect(ctx.commit).toHaveBeenCalledWith("bind/add_bound_store", { name: "dinner"}, { root : true });
      expect(ctx.commit).toHaveBeenCalledWith("loading_pizza");
      expect(ctx.commit).toHaveBeenCalledWith("loading_pasta");
    });
  });

  it("should create start_bind action that rejects when strict is on and store is already bound", () => {
    BindPlugin.config.strict = true;
    ctx.rootState.bind.bound_stores = ["dinner"];
    return expect(new_this.generated_actions.start_bind(ctx)).rejects.toBe("Tried to dinner/start_bind twice. Dispatch bind/reset before restarting bind").then( () => {
      ctx.rootState.bind.bound_stores = [];
      BindPlugin.config.strict = false;
    });
  });

  it("should create start_bind action that adds watch params", () => {
    new_this.generated_actions.start_bind(ctx)
    expect(new_this.add_watch_params).toHaveBeenCalledTimes(1);
    expect(new_this.add_watch_params).toHaveBeenCalledWith(ctx.commit);
  });

});

describe("add_watch_params", () => {
  let new_this = {
    namespace : "testing",
    watch_param_defs : {
      output  : [ "param" ],
      output2 : [ "param", "param2" ],
    },
    plugin_config : {
      namespace : "bind",
      load_prefix : "load_",
      update_prefix: "update_",
    },
  };
  let commit = jest.fn();

  let add_watch_params = BoundStore.prototype.add_watch_params.bind(new_this);
  beforeAll(() => add_watch_params(commit));

  it("should commit all watch params", () => {
    expect(commit).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledWith("bind/watch_params", {
      mutations : ["testing/update_param"],
      action    : "testing/load_output"
    }, { root : true });
    expect(commit).toHaveBeenCalledWith("bind/watch_params", {
      mutations : expect.arrayContaining(["testing/update_param", "testing/update_param2"]),
      action    : "testing/load_output2"
    }, { root : true });
  });
});
