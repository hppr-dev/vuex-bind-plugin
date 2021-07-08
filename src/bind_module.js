import { map_endpoint_types, is_unset, check_types, check_unset } from './utils.js'
import BindPlugin from './bind_plugin.js'

export default class BindModule {
  constructor() {
    this.plugin_config = BindPlugin.config;
    this.source = this.plugin_config.data_source;
    return {
      namespaced : true,
      state      : {
        intervals    : {},
        watch_params : {},
        ...this.source.state,
      },
      mutations: {
        ...this.source.mutations,
        watch_params : ( state,{ action, mutations } ) => {
          mutations.forEach((mutation) => {
            if ( state.watch_params[mutation] ) {
              state.watch_params[mutation].push(action);
            } else {
              state.watch_params[mutation] = [action];
            }
          });
        },
        add_interval : (state, { name, interval } ) => {
          clearInterval(state.intervals[name]);
          state.intervals[name] = interval;
        },
        delete_interval : (state, { name }) => {
          clearInterval(state.intervals[name]);
          delete state.intervals[name];
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
          commit('add_interval', { 
            name: `${payload.namespace}${payload.output}`,
            interval: setInterval( interval_func, payload.binding.period ) 
          });
          return dispatch('once', payload);
        },
        once    : ({state, rootState, commit}, { output , binding, endpoint, namespace }) => {
          let local_state = namespace? rootState[namespace.slice(0,-1)] : rootState;
          this.source.apply_defaults(output, endpoint);
          let computed_params = this.pull_params_from(local_state, binding.param_map, endpoint.params, output);
          return computed_params? this.source.module(
            ...this.source.args(state, computed_params, endpoint)
          ).then(
            (data) => commit(`${namespace}${output}`, this.source.assign(data), { root : true }) 
          ) : new Promise((_, reject) => reject({ message : "Not Updated" })) ;
        },
      }
    }
  }
  pull_params_from(local_state, param_map, params, output) {
    let computed_params = {};
    let param_defs = map_endpoint_types(param_map, params);
    for ( let state_name of Object.keys(param_defs) ) {
      let param_name = param_map? param_map[state_name] : state_name;
      computed_params[param_name] = local_state[state_name];
    }

    if ( this.plugin_config.strict ) {
      let bad_param = check_types(computed_params, params);
      if ( bad_param.length > 0 ) {
        console.warn(`Bind ${output}: Received bad parameter type for ${bad_param}. Got bad types for ${JSON.stringify(bad_param)}`);
      }
    }

    let unset = null;
    if ( ( unset = check_unset(computed_params, params) ) && ! params[output] ) {
      if ( this.plugin_config.log_blocked_binds ) {
        console.info(`Tried update for ${output} but ${unset} was unset as ${computed_params[unset]}`);
      }
      return false;
    }


    return computed_params;
  }
}
