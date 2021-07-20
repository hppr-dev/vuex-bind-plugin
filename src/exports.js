import BindPlugin from "./bind_plugin.js"
import BoundStore from "./bound_store.js"
import { DataSource, RestDataSource } from './data_sources.js'
import { SnakeCase, CamelCase } from './naming.js'
import { match, lookup_mock } from './utils.js'
import { mapBindings, mapBindingsWithLoading, mapLoads, mapTriggers, mapParams, syncParams } from './importers.js'


export { DataSource, RestDataSource, match, lookup_mock }

export { mapBindings, mapBindingsWithLoading, mapLoads, mapTriggers, mapParams, syncParams }

export default {
  Plugin  : BindPlugin,
  Store   : BoundStore,
  Modules : (configs) => {
    return Object.fromEntries(
      Object.keys(configs)
        .map((ns) => {
          if ( configs[ns].namespace || configs[ns].bindings) {
            if ( configs[ns].namespace && configs[ns].bindings ) {
              return [configs[ns].namespace, new BoundStore(configs[ns])];
            }
            let m = ["bindings", "namespace"];
            let n = configs[ns].bindings? 0 : 1; 
            console.warn(`Module ${ns} has ${m[n]} but is missing ${m[(n+1)%2]}`);
          }
          return [ns, configs[ns]]
        }
      )
    );
  },
  SnakeCase : () => new SnakeCase(),
  CamelCase : () => new CamelCase(),
}
