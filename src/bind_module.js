import { map_endpoint_types } from './utils.js'

export default class BindModule {
  constructor(plugin_config) {
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
        watch_param : ( state,{ action, mutations } ) => {
          mutations.forEach((mutation) => {
            if ( state.watch_params[mutation] ) {
              state.watch_params[mutation].push(action);
            } else {
              state.watch_param[mutation] = [action];
            }
          });
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
        watch   : ({ dispatch, commit }, payload) => {
          let interval_func = () => {
            dispatch('once', payload );
          };
          commit('update_interval', { 
            name: `${payload.namespace}${payload.output}`,
            interval: setInterval( interval_func, payload.binding.period ) 
          });
          return dispatch('once', payload);
        },
        once    : ({state, rootState, commit}, { output , binding, endpoint, namespace }) => {
          let local_state = namespace? rootState[namespace.slice(0,-1)] : rootState;
          let computed_params = this.pull_params_from(local_state, binding.param_map, endpoint.params, output, this.plugin_config.strict);
          return computed_params? this.source.module(
            ...this.source.args(state, computed_params, endpoint)
          ).then(
            (data) => commit(`${namespace}${output}`, this.source.assign(data), { root : true }) 
          ) : new Promise((_, reject) => reject({ message : "Not Updated" })) ;
        },
      }
    }
  }
  pull_params_from(local_state, param_map, params, output, strict) {
    let computed_params = {};
    let param_defs = map_endpoint_types(param_map, params);
    for ( let state_name of Object.keys(param_defs) ) {
      let param_name = param_map? param_map[state_name] : param_defs[state_name];
      computed_params[param_name] = local_state[state_name];
      if (JSON.stringify(computed_params[param_name]) === JSON.stringify(param_defs[state_name]())){
        return false;
      }
    }

    if ( strict ) {
      let bad_param = Object.keys(params).find((p) => ! computed_params[p] instanceof param_defs[p] );
      if ( bad_param ) {
        console.warn(`Bind ${output}: Received bad parameter type for ${bad_param}. Got ${computed_params[bad_param]}, expected ${param_defs[p]}`);
      }
    }

    return computed_params;
  }
}
