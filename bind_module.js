
export const class BindModule {
  contructor(plugin_config) {
    this.plugin_config = plugin_config;
    //TODO add in data source specific state with mutations.
    return {
      namespaced : true,
      state      : {
        bind_url     : this.plugin_config.url,
        intervals    : {},
        watch_params : {},
      },
      mutations: {
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
          switch payload.binding.bind_type {
            case "change":
            case "once":
            case "trigger":
              dispatch("once", payload);
              break;
            case "watch":
              dispatch("watch", payload);
          }
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
        once    : ({state, rootState, commit}, { binding, endpoint, namespace }) => {
          let computed_params = {};
          let local_state = rootState[namespace];
        //TODO write once. Should use this.plugin.data_source to query the endpoint.
        },
      }
    }
  }
}
/*
  actions   : {
    once : ( { state, rootState, commit } , { endpoint, params, out, namespace }) => {
      let computed_params = {};
      let local_state = rootState[namespace];
      for (let state_var of Object.keys(params)) {
        let is_str = typeof params[state_var] === "string";
        let state_value = local_state[state_var];
        if (( is_str && state_value === null )||( state_value === params[state_var].zero )) {
          return;
        }
        let endpoint_param = is_str? params[state_var] : params[state_var].param;
        computed_params[endpoint_param] = state_value;
      }

      let spec = endpoints[endpoint];
      if ( spec == null ) {
        // eslint-disable-next-line
        console.error(`Could not find api spec for ${name}`);
        return
      }

      if ( process.env.NODE_ENV !== 'production' ) {
        let bad_param = spec.params? Object.keys(params).find((p) => typeof spec.params[p]() !== typeof params[p]) : null;
        if ( bad_param != null ) {
          // eslint-disable-next-line
          console.warn(`Spec ${name} expected ${bad_param} to be ${typeof spec.params[bad_param]()} but got ${typeof params[bad_param]}`);
        }
      }

      return axios({
        method  : spec.method,
        baseURL : state.bind_url,
        url     : spec.get_url? spec.get_url(computed_params): spec.url,
        params  : spec.method === "get"? computed_params: {},
        data    : spec.method === "get"? {} : computed_params,
        headers : state.headers,
      }).then(
        (response) => {
          if ( response.data.length > 0 ) {
            let outname = typeof out === "string"? out : Object.keys(out)[0];
            let mut_name = namespace === ""? `update_${outname}` : `${namespace}/update_${outname}`;
            commit(mut_name, response.data, { root : true });
          }
        }
      );
    },
  }
});
*/
