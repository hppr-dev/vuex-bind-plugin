import BoundStore from "./bound_store.js"
import BindModule from "./bind_module.js"
import { _MockRestDataSource, RestDataSource } from "./data_sources.js"


export default class BindPlugin {
  static config = {};
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
    BindPlugin.config.data_source    = new data_source(initial_state);
    BindPlugin.config.endpoints      = endpoints;
    BindPlugin.config.camelCase      = camelCase;
    BindPlugin.config.namespace      = namespace;
    BindPlugin.config.loading_prefix = loading_prefix;
    BindPlugin.config.done_prefix    = done_prefix;
    BindPlugin.config.load_prefix    = load_prefix;
    BindPlugin.config.trigger_prefix = trigger_prefix;
    return (store) => {
      store.registerModule(BindPlugin.config.namespace, new BindModule());
      store.subscribe((mutation, state) => {
        let actions = state[BindPlugin.config.namespace].watch_params[mutation.type];
        if ( actions ) {
          actions.forEach((action) => store.dispatch(action));
        }
      });
    };
  }
}

export { BoundStore }

