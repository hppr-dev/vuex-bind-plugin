import BindPlugin from "./bind_plugin.js"
import BoundStore from "./bound_store.js"
import { match, lookup_mock } from './utils.js'


export { match, lookup_mock }

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
  }
}
