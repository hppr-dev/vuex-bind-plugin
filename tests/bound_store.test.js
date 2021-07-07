import BoundStore from '../src/bound_store.js'
import { test_plugin_config, mock_prototype } from './test-utils.js'

describe("constructor", () => {
  let store = null
  let init_store = (bindings, namespace, extras={}) => store = new BoundStore({
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
  }, namespace, test_plugin_config);

  let plugin_config_from_store_config = mock_prototype(BoundStore, "plugin_config_from_store_config");
  let generate_modifications = mock_prototype(BoundStore, "generate_modifications");

  it('should return a namespaced vuex store config', () => {
    store = init_store({}, "my_namespace");
    expect(store.namespaced).toBe(true);
    expect(store.state.regular_state_var).toBe("hello");
    expect(store.mutations.regular_mutation).toBe("mutate a thing");
    expect(store.actions.regular_action).toBe("some action");
    expect(store.bindings).toBeUndefined();
    expect(generate_modifications).toHaveBeenCalledTimes(1);
  });

  it('should return a root vuex store config when no namespace is given', () => {
    store = init_store({}, "", { strict: "Some value that shouldn't be changed" });
    expect(store.strict).toBe("Some value that shouldn't be changed");
  });
  
  it('should get plugin config from root data store when no namespace is given', () => {
    store = init_store({}, "", { });
    expect(plugin_config_from_store_config).toHaveBeenCalledTimes(1);
  });
  
});

describe("plugin_config_from_store_config", () => {
  it("should find the BindPlugin in plugins", () => {
  });
});

describe("generate_modifications", () => {

  it("should create loading variables when loading is set", () => {
  });

  it("should create parameter variables when create_params is set", () => {
  });

  it("should create output variable when redirect is unset", () => {
  });

  it("should not create output variable when redirect is set", () => {
  });

  it("should add parameters to watch with change binding", () => {
  });

  it("should add parameters to watch with watch binding", () => {
  });

  it("should not add parameters to watch with once binding", () => {
  });

  it("should create load action for each binding", () => {
  });

  it("should create a start_bind action", () => {
  });
  
});

describe("create_variable", () => {
});

describe("create_loading_variable", () => {
});

describe("create_load_action", () => {
});

describe("create_bind_action", () => {
});

describe("add_watch_params", () => {
});
