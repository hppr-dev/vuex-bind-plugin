import BindModule from "./bind_module.js"
import { MockRestDataSource, RestDataSource } from "./data_sources.js"
import { SnakeCase } from './naming.js'

export default class BindPlugin {
  static config = null;
  constructor({
    initial_state     = { url: "", headers: "application/json" },
    endpoints         = {},
    namespace         = "bind",
    naming            = new SnakeCase(),
    strict            = false,
    log_blocked_binds = false,
  }) {
    BindPlugin.config = {};
    BindPlugin.config.data_source       = initial_state.mock? new MockRestDataSource(initial_state) : new RestDataSource(initial_state);
    BindPlugin.config.endpoints         = endpoints;
    BindPlugin.config.namespace         = namespace;
    BindPlugin.config.strict            = strict;
    BindPlugin.config.naming            = naming;
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
