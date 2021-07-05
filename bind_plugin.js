import _BoundStore from "./bound_store.js"
import BindModule from "./bind_module.js"
import { _MockDataSource, RestDataSource } from "./data_sources.js"

const to_camel_case = function(str) {
  let words = str.split('_');
  return words.slice(0,1) + words.slice(1).map((s) => s.slice(0,1).toUpperCase() + s.slice(1));
}

export default class BindPlugin {
  constructor({
    url            = "",
    headers        = { "Content-Type" : "application/json" },
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
    this.config.url            = url;
    this.config.headers        = headers;
    this.config.data_module    = data_module;
    this.config.endpoints      = endpoints;
    this.config.camelCase      = camelCase;
    this.config.namespace      = namespace;
    this.config.loading_prefix = loading_prefix;
    this.config.done_prefix    = done_prefix;
    this.config.load_prefix    = load_prefix;
    this.config.trigger_prefix = trigger_prefix;
    this.config.transform_case();
    return (store) => {
      this.config_store(store);
      store.subscribe((mutation, state) =>  {
        if ( state[this.config.namespace].watch_params[mutation.type] ) {
          store.dispatch(state[this.config.namespace].watch_params[mutation.type]);
        }
      });
    }
  }
  config_store(store){
    for( let module_name of Object.keys(store.modules) ) {
      store.modules[module_name] = store.modules[module_name].bindings? new BoundStore(store.modules[module_name], module_name, this.config) : store.modules[module_name];
    }
    store.modules[this.config.namespace] = new BindModule(this.config));
  }
  transform_case() {
    if (this.camelCase) {
      for( let key of Object.key(this) ) {
        this[to_camel_case(key)] = this[key];
      }
    }
  }
}

export const BoundStore = _BoundStore;

export const MockDataSource = _MockDataSource; 
