import _BoundStore from "./bound_store.js"
import BindModule from "./bind_module.js"
import { _MockRestDataSource, RestDataSource } from "./data_sources.js"


export default class BindPlugin {
  constructor({
    initial_state  = { url: "", headers: "application/json" },
    data_source    = RestDataSource,
    endpoints      = {},
    camelCase      = false,
    namespace      = "bind",
    loading_prefix = "loading_",
    done_prefix    = "done_",
    load_prefix    = "load_",
    trigger_prefix = "trigger_",
    strict         = true,
  }) {
    this.config = {};
    this.config.data_source    = new data_source(initial_state);
    this.config.endpoints      = endpoints;
    this.config.camelCase      = camelCase;
    this.config.namespace      = namespace;
    this.config.loading_prefix = loading_prefix;
    this.config.done_prefix    = done_prefix;
    this.config.load_prefix    = load_prefix;
    this.config.trigger_prefix = trigger_prefix;
    return (store) => {
      this.config_store(store);
      store.subscribe((mutation, state) => {
        let actions = state[this.config.namespace].watch_params[mutation.type];
        if ( actions ) {
          actions.forEach((action) => store.dispatch(action));
        }
      });
    }
  }
  config_store(store){
    for( let module_name of Object.keys(store.modules) ) {
      store.modules[module_name] = store.modules[module_name].bindings? new BoundStore(store.modules[module_name], module_name, this.config) : store.modules[module_name];
    }
    store.modules[this.config.namespace] = new BindModule(this.config);
  }
}

export const BoundStore = _BoundStore;

export const MockRestDataSource = _MockRestDataSource; 
