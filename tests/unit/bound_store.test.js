import BoundStore from '@src/bound_store.js'
import BindPlugin from '@src/bind_plugin.js'
import { test_plugin_config, mock_prototype } from './test-utils.js'


beforeAll(() => BindPlugin.config = test_plugin_config);
afterAll(() => BindPlugin.config = {});

describe("constructor", () => {
  let store = null
  let init_store = (bindings, namespace, extras={}) => store = new BoundStore({
    namespace : namespace,
    bindings,
    state : {
      regular_state_var : "hello",
    },
    mutations : {
      regular_mutation : "mutate a thing",
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
      bind_type : "once",
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
      bind_type : "once",
      endpoint  : { params : {} },
      loading   : true,
    };
    generate_modifications();
    expect(new_this.create_loading_variable).toHaveBeenCalledTimes(1);
    expect(new_this.create_loading_variable).toHaveBeenCalledWith("out");
  });

  it("should create parameter variables when create_params is set", () => {
    new_this.bindings.out = {
      bind_type : "once",
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
      bind_type : "once",
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
      bind_type : "change",
      endpoint  : { params },
    };
    generate_modifications();
    expect(new_this.watch_param_defs).toStrictEqual({"out" : params});
  });

  it("should add parameters to watch with watch binding", () => {
    let params =  {
      day : Number,
      month : String,
    };
    new_this.bindings.out = {
      bind_type : "watch",
      endpoint  : { params }
    };
    generate_modifications();
    expect(new_this.watch_param_defs).toStrictEqual({"out" : params});
  });

  it("should not add parameters to watch with once binding", () => {
    let params =  {
      day : Number,
      month : String,
    };
    new_this.bindings.out = {
      bind_type : "once",
      endpoint  :  { params },
    };
    generate_modifications();
    expect(new_this.watch_param_defs).toStrictEqual({});
  });

  it("should create load action for each binding", () => {
    new_this.bindings.out = {
      bind_type : "once",
      endpoint  : { params : {} },
    };
    new_this.bindings.out2 = {
      bind_type : "change",
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
      bind_type : "once",
      endpoint  : { params : {} },
    };
    generate_modifications();
    expect(new_this.create_start_bind_action).toHaveBeenCalledTimes(1);
  });

  it("should handle when endpoint does not have params and create_params is true", () => {
    new_this.bindings.out = {
      bind_type : "once",
      endpoint  : {},
      create_params : true
    };
    generate_modifications();
    expect(new_this.create_variable).toHaveBeenCalledTimes(1);
    expect(new_this.create_variable).toHaveBeenCalledWith("out", undefined);
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
  create_variable("some_variable", Number);

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
  create_loading_variable("some_var");

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
    plugin_config : {
      namespace : "mybind",
      load_prefix : "load_",
      trigger_prefix : "trigger_",
    },
  };

  let create_load_action = BoundStore.prototype.create_load_action.bind(new_this);

  beforeEach(() => {
    new_this.generated_actions = {};
    new_this.all_load_actions = [];
  });

  it("should create load action when bind_type is once", () => {
    create_load_action("output", {bind_type : "once"}, { endpoint_spec : "is this" });
    expect(new_this.generated_actions.load_output).toBeDefined();
    expect(new_this.generated_actions.load_output).toStrictEqual(expect.any(Function));
    expect(new_this.all_load_actions).toStrictEqual(["load_output"]);
  });

  it("should create trigger action when bind_type is trigger", () => {
    create_load_action("output", {bind_type : "trigger"}, { endpoint_spec : "is this" });
    expect(new_this.generated_actions.trigger_output).toBeDefined();
    expect(new_this.generated_actions.trigger_output).toStrictEqual(expect.any(Function));
    expect(new_this.all_load_actions).toStrictEqual([]);
  });

  it("should create load action that dispatches bind module bind action", () => {
    create_load_action("output", { name : "something", bind_type : "once", endpoint : { this_is : "an endpoint" }});
    let ctx = {
      dispatch : jest.fn()
    };
    new_this.generated_actions.load_output(ctx);
    expect(ctx.dispatch).toHaveBeenCalledTimes(1);
    expect(ctx.dispatch).toHaveBeenCalledWith("mybind/bind", { 
      binding   : { name : "something", bind_type : "once", endpoint : { this_is : "an endpoint"} },
      namespace : "create",
      output    : "output"
    }, { root : true });
  });

});

describe("create_start_bind_action", () => {
  let new_this = {
    generated_actions   : {},
    all_load_actions : [ "pizza", "pasta", "pepperoni" ],
    plugin_config : {
      load_prefix : "load_",
    },
    add_watch_params : jest.fn()
  };

  beforeEach(() => {
    new_this.add_watch_params.mockClear();
  });
  let create_start_bind_action = BoundStore.prototype.create_start_bind_action.bind(new_this);
  create_start_bind_action();

  it("should create a start_bind action", () => {
    expect(new_this.generated_actions.start_bind).toBeDefined();
    expect(new_this.generated_actions.start_bind).toStrictEqual(expect.any(Function));
  });

  it("should create start_bind action that dispatches all load actions", () => {
    let ctx = {
      dispatch : jest.fn(),
      commit   : "some function"
    };
    new_this.generated_actions.start_bind(ctx)
    expect(ctx.dispatch).toHaveBeenCalledTimes(3);
    expect(ctx.dispatch).toHaveBeenCalledWith("pizza");
    expect(ctx.dispatch).toHaveBeenCalledWith("pasta");
    expect(ctx.dispatch).toHaveBeenCalledWith("pepperoni");
  });

  it("should create start_bind action that adds watch params", () => {
    let ctx = {
      dispatch : jest.fn(),
      commit   : "some function"
    };
    new_this.generated_actions.start_bind(ctx)
    expect(new_this.add_watch_params).toHaveBeenCalledTimes(1);
    expect(new_this.add_watch_params).toHaveBeenCalledWith("some function");
  });
});

describe("add_watch_params", () => {
  let new_this = {
    namespace : "testing",
    watch_param_defs : {
      output  : {  param : Number },
      output2 : {  param : Number, param2: Number }
    },
    plugin_config : {
      namespace : "bind",
      load_prefix : "load_",
      update_prefix: "update_",
    },
  };
  let commit = jest.fn();

  let add_watch_params = BoundStore.prototype.add_watch_params.bind(new_this);
  add_watch_params(commit);

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
