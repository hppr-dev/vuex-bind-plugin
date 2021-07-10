import { map_endpoint_types, is_unset, check_types, check_unset, is_type_match } from './utils.js'
import BindPlugin from './bind_plugin.js'
import * as c from  './constants.js'

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
        [c.WATCH_PARAMS] : ( state,{ action, mutations } ) => {
          mutations.forEach((mutation) => {
            if ( state.watch_params[mutation] ) {
              state.watch_params[mutation].push(action);
            } else {
              state.watch_params[mutation] = [action];
            }
          });
        },
        [c.ADD_INTERVAL] : (state, { name, interval } ) => {
          clearInterval(state.intervals[name]);
          state.intervals[name] = interval;
        },
        [c.DELETE_INTERVAL] : (state, { name }) => {
          clearInterval(state.intervals[name]);
          delete state.intervals[name];
        },
        [c.CLEAR_INTERVALS] : (state) => {
          for( let [, interval] of Object.entries(state.intervals)) {
            clearInterval(interval);
          }
          state.intervals = {};
        }
      },
      actions: {
        [c.BIND]    : ({ dispatch }, payload) => {
          return payload.binding.bind_type === c.WATCH? dispatch(c.WATCH, payload) : dispatch(c.ONCE, payload);
        },
        [c.WATCH]   : ({ dispatch, commit }, payload) => {
          let interval_func = () => {
            dispatch(c.ONCE, payload );
          };
          commit(c.ADD_INTERVAL, { 
            name: `${payload.namespace}/${payload.output}`,
            interval: setInterval( interval_func, payload.binding.period ) 
          });
          return dispatch(c.ONCE, payload);
        },
        [c.ONCE]    : ({ state, rootState, commit, dispatch },{ output , binding, namespace }) => {
          let local_state = namespace? rootState[namespace] : rootState;
          let ns_prefix = namespace? `${namespace}/` : "";
          this.source.apply_defaults(output, binding.endpoint);
          let computed_params = this.pull_params_from(local_state, binding.param_map, binding.endpoint.params, output);
          let bind_out = binding.redirect? binding.redirect : `${this.plugin_config.update_prefix}${output}`;

          if ( computed_params ) {
            return this.source.module(
              ...this.source.args(state, computed_params, binding.endpoint)
            ).then(
              (data) => {
                data = this.source.assign(data);
                data = binding.transform? binding.transform(data) : data;

                if ( this.plugin_config.strict && ! is_type_match(data, binding.endpoint.type)) {
                  console.warn(`Received bad type for ${ns_prefix}${output}. Expected ${binding.endpoint.type.name} but got ${JSON.stringify(data)}.`);
                }

                let com =  commit(`${ns_prefix}${bind_out}`, data , { root : true }); 

                if ( binding.side_effect ) {
                  dispatch(`${ns_prefix}${binding.side_effect}`, data, { root : true });
                }

                return com;
              }
            );
          }
          return new Promise((resolve) => resolve({ message : "Not Updated" })) ;
        },
      }
    }
  }
  pull_params_from(local_state, param_map={}, params, output) {
    let computed_params = {};
    let param_defs = map_endpoint_types(param_map, params);
    for ( let state_name of Object.keys(param_defs) ) {
      let param_name = param_map[state_name]? param_map[state_name] : state_name;
      computed_params[param_name] = local_state[state_name];
    }

    if ( this.plugin_config.strict ) {
      let bad_param = check_types(computed_params, params);
      if ( bad_param.length > 0 ) {
        console.warn(`Binding ${output}: Received bad parameter type for ${bad_param}, expected: ${bad_param.map((k) => params[k].name)}, but got: ${bad_param.map((k) => computed_params[k])}`);
      }
    }

    let unset = null;
    if ( ( unset = check_unset(computed_params, params) ) && ! params[output] ) {
      if ( this.plugin_config.log_blocked_binds ) {
        console.info(`Binding ${output}: Received parameter ${unset} unset as ${computed_params[unset]}`);
      }
      return false;
    }


    return computed_params;
  }
}
