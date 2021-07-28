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
        bound_stores : [],
        ...this.source.state,
      },
      mutations: {
        ...this.source.mutations,
        [c.WATCH_PARAMS] : ( state, { action, mutations } ) => {
          mutations.forEach((mutation) => {
            if ( state.watch_params[mutation] ) {
              state.watch_params[mutation].push(action);
            } else {
              state.watch_params[mutation] = [action];
            }
          });
        },
        [c.ADD_BOUND_STORE] : (state, { name } ) => {
          state.bound_stores.push(name);
        }, 
        [c.ADD_INTERVAL] : (state, { name, func, period } ) => {
          clearInterval(state.intervals[name]);
          state.intervals[name] = setInterval(func, period);
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
        },
        [c.CLEAR_BOUND_STORES] : (state) => state.bound_stores = state.bound_stores.filter((name) => name === ""),
        [c.CLEAR_WATCH_PARAMS] : (state) => state.watch_params = {},
      },
      actions: {
        [c.RESET]  : ({ commit } ) => {
          return new Promise( (resolve) => {
            commit(c.CLEAR_INTERVALS);
            commit(c.CLEAR_BOUND_STORES);
            commit(c.CLEAR_WATCH_PARAMS);
            resolve();
          });
        },
        [c.BIND]    : ({ dispatch, rootState, rootGetters }, payload) => {

          if ( payload.namespace === "" ) {
            payload.local_state = rootState;
            payload.local_getters = rootGetters;
            payload.ns_prefix   = ""
          } else {
            payload.local_state = rootState?.[payload.namespace];
            payload.local_getters = rootGetters?.[payload.namespace];
            payload.ns_prefix = `${payload.namespace}/`;
          }

          return payload.binding.bind === c.WATCH? dispatch(c.WATCH, payload) : dispatch(c.ONCE, payload);
        },
        [c.WATCH]   : ({ dispatch, commit }, payload) => {
          let interval_func = () => {
            dispatch(c.ONCE, payload);
          };

          commit(c.ADD_INTERVAL, { 
            name   : `${payload.ns_prefix}${payload.output}`,
            func   : interval_func,
            period : payload.binding.period,
          });

          return dispatch(c.ONCE, payload);
        },
        [c.ONCE]    : ({ state, commit, dispatch },{ output , binding, namespace, local_state, local_getters, ns_prefix }) => {
          this.source.apply_defaults(output, binding.endpoint);
          let computed_params = this.pull_params_from(local_state, local_getters, binding.param_map, binding.endpoint.params, output);
          let bind_out = binding.redirect? binding.redirect : `${BindPlugin.config.naming.update(output)}`;

          if ( computed_params ) {
            return this.source.module(
              ...this.source.args(state, computed_params, binding.endpoint)
            ).then(
              (response) => {
                let data = this.source.assign(response, binding.endpoint.source);
                data = binding.endpoint.transform? binding.endpoint.transform(data) : data;
                data = binding.transform? binding.transform(data) : data;

                if ( this.plugin_config.strict && ! is_type_match(data, binding.endpoint.type)) {
                  console.warn(`Received bad type for ${ns_prefix}${output}. Expected ${binding.endpoint.type.name} but got ${JSON.stringify(data)}.`);
                }

                commit(`${ns_prefix}${bind_out}`, data , { root : true }); 

                if ( binding.loading ) {
                  commit(`${ns_prefix}${BindPlugin.config.naming.done(output)}`, null, { root : true });
                }

                if ( binding.side_effect ) {
                  dispatch(`${ns_prefix}${binding.side_effect}`, data, { root : true });
                }
              }
            );
          }
          return new Promise((resolve) => resolve({ message : "Not Updated" })) ;
        },
      }
    }
  }
  pull_params_from(local_state, local_getters, param_map={}, params, output) {
    let computed_params = {};
    let param_defs = map_endpoint_types(param_map, params);
    for ( let state_name of Object.keys(param_defs) ) {
      let param = param_map[state_name]? param_map[state_name] : state_name;
      if ( param_map[state_name] && param_map[state_name].computed ) {
        computed_params[state_name] = param_map[state_name].computed(local_state, local_getters);
      } else {
        computed_params[param] = local_state[state_name];
      }
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
