import BindModule from "./bind_module.js"
import { MultDataSource } from "./data_sources.js"
import { SnakeCase } from './naming.js'

export default class BindPlugin {
  static config = null;
  constructor({
    sources           = {},
    endpoints         = {},
    namespace         = "bind",
    naming            = new SnakeCase(),
    strict            = false,
    default_source    = "rest",
    log_blocked_binds = false,
  }) {
    BindPlugin.config = {};
    BindPlugin.config.naming            = naming;
    BindPlugin.config.data_source       = new MultDataSource(sources);
    BindPlugin.config.endpoints         = endpoints;
    BindPlugin.config.namespace         = namespace;
    BindPlugin.config.strict            = strict;
    BindPlugin.config.log_blocked_binds = log_blocked_binds;
    BindPlugin.config.default_source    = default_source;
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
