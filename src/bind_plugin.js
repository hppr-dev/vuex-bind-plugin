import BindModule from "./bind_module.js"
import { MockRestDataSource, RestDataSource } from "./data_sources.js"

export default class BindPlugin {
  static config = {};
  constructor({
    initial_state     = { url: "", headers: "application/json" },
    endpoints         = {},
    camelCase         = false,
    namespace         = "bind",
    loading_prefix    = "loading_",
    update_prefix     = "update_",
    done_prefix       = "done_",
    load_prefix       = "load_",
    trigger_prefix    = "trigger_",
    strict            = false,
    log_blocked_binds = false,
  }) {
    BindPlugin.config.data_source       = initial_state.mock? new MockRestDataSource(initial_state) : new RestDataSource(initial_state);
    BindPlugin.config.endpoints         = endpoints;
    BindPlugin.config.camelCase         = camelCase;
    BindPlugin.config.namespace         = namespace;
    BindPlugin.config.loading_prefix    = loading_prefix;
    BindPlugin.config.update_prefix     = update_prefix;
    BindPlugin.config.done_prefix       = done_prefix;
    BindPlugin.config.load_prefix       = load_prefix;
    BindPlugin.config.trigger_prefix    = trigger_prefix;
    BindPlugin.config.strict            = strict;
    BindPlugin.config.log_blocked_binds = log_blocked_binds
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
