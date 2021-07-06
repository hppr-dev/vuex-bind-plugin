import { map_endpoint_types } from './utils.js'

export const class BindModule {
  contructor(plugin_config) {
    this.plugin_config = plugin_config;
    this.source = this.plugin_config.data_source;
    return {
      namespaced : true,
      state      : {
        bind_url     : this.plugin_config.url,
        intervals    : {},
        watch_params : {},
        ...this.source.state,
      },
      mutations: {
        ...this.source.mutations,
        watch_param : (state, param_name) => {
          state.watch_params[param_name] = true;
        },
        unwatch_param : (state, param_name) => {
          state.watch_params[param_name] = false;
        },
        update_interval : (state, { name, interval } ) => {
          clearInterval(state.intervals[name]);
          state.intervals[name] = interval;
        },
        delete_interval : (state, { name }) => {
          clearInterval(state.intervals[name]);
          state.intervals[name] = null;
        },
        clear_intervals : (state) => {
          for( let [, interval] of Object.entries(state.intervals)) {
            clearInterval(interval);
          }
          state.intervals = {};
        }
      },
      actions: {
        bind    : ({ dispatch }, payload) => {
          return payload.binding.bind_type === "watch"? dispatch("watch", payload) : dispatch("once", payload);
        },
        watch   : (ctx, payload) => {
          dispatch('once', payload);
          let interval_func = () => {
            dispatch('once', payload );
          };
          commit('update_interval', { 
            name: `${payload.namespace}${payload.binding.output_var}`,
            interval: setInterval( interval_func, payload.binding.period ) 
          });
        },
        once    : ({state, rootState, commit}, { output , binding, endpoint, namespace }) => {
          let local_state = namespace? rootState[namespace] : rootState;
          let computed_params = this.pull_params_from(local_state, binding.param_map, endpoint.params, output);
          return computed_params? this.source.module(
            ...this.source.args(state, computed_params, endpoint)
          ).then(
            (data) => commit(`${namespace}${output},`this.source.assign(data) ) 
          ) : new Promise() ;
        },
      }
    },
    pull_params_from(local_state, param_map, params, output) {
      let computed_params = {};
      let param_defs = map_endpoint_types(param_map, params);
      for ( let param in Object.key(param_map) ) {
        computed_params[param] = local_state[param];
        if (JSON.stringify(computed_params[param]) === JSON.strigify(new param_defs[param]())){
          return false;
        }
      }

      if ( this.plugin_config.strict ) {
        let bad_param = Object.keys(params).find((p) => ! computed_params[p] instanceof param_defs[p] );
        if ( bad_param ) {
          console.warn(`Bind ${output}: Received bad parameter type for ${bad_param}. Got ${computed_params[bad_param]}, expected ${param_defs[p]}`);
        }
      }

      return computed_params;
    }
  }
}
