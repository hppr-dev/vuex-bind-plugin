import BindPlugin from './bind_plugin.js'
import { map_endpoint_types, get_default, apply_binding_defaults, check_bindings } from './utils.js'
import * as c from  './constants.js'

export default class _BoundStore {
  constructor(store_config){

    if ( store_config.namespace === undefined ) {
      throw `BoundStore initialized without namespace: ${JSON.stringify(store_config)}`; 
    }

    if ( BindPlugin.config === undefined ) {
      throw `BoundStore created before plugin was configured: ${JSON.stringify(store_config)}`;
    }

    this.namespace = store_config.namespace;
    this.bindings = store_config.bindings;

    for ( let [ output_var, binding ] of Object.entries(this.bindings) ) {
      apply_binding_defaults(output_var, binding);

      if ( typeof binding.endpoint === "string") {
        let endpoint_name = binding.endpoint;
        binding.endpoint = BindPlugin.config.endpoints?.[endpoint_name] ?? store_config.endpoints?.[endpoint_name];

        if ( BindPlugin.config.strict && binding.endpoint == null ) {
          throw `Tried to bind to unknown endpoint ${output_var}<-${binding.bind}->${endpoint_name}`;
        }

      }

      if  ( BindPlugin.config.strict && ! c.BINDING_TYPES.includes(binding.bind) ) {
        throw `Unknown binding type for ${output_var}<-${binding.bind}->${binding.endpoint}`;
      }
    }

    this.generated_state = {};
    this.generated_mutations = {};
    this.generated_actions = {};
    this.all_load_actions = [];
    this.commit_on_start = [];
    this.watch_param_defs = [];
    this.generate_modifications();

    delete store_config.bindings;
    delete store_config.namespace;

    store_config.state = store_config.state ?? {};
    store_config.mutations = store_config.mutations ?? {};
    store_config.actions = store_config.actions ?? {};

    Object.assign(store_config.state, this.generated_state);
    Object.assign(store_config.mutations, this.generated_mutations);
    Object.assign(store_config.actions, this.generated_actions);

    store_config.namespaced = true;

    return store_config;
  }

  generate_modifications() {
    for ( let output_var of Object.keys(this.bindings) ) {
      let binding  = this.bindings[output_var];
      let params = map_endpoint_types(binding.param_map, binding.endpoint.params);

      if ( binding.bind == c.WATCH || binding.bind == c.CHANGE ) {
        this.watch_param_defs[output_var] = params;
      }
      if ( ! binding.redirect && ! params[output_var] ) {
        this.create_variable(output_var, binding.endpoint.type);
      }
      if ( params && binding.create_params ) {
        for ( let [state_var, type] of Object.entries(params) ) {
          this.create_variable(state_var, type);
        }
      }
      if ( binding.loading ) {
        this.create_loading_variable(output_var);
      }
      this.create_load_action(output_var, binding);
    }
    this.create_start_bind_action();
  }

  create_variable(name, type) {
    this.generated_state[name] = get_default(type);
    this.generated_mutations[BindPlugin.config.naming.update(name)] = (state, payload) => state[name] = payload;
  }

  create_loading_variable(name) {
    let loading_name = BindPlugin.config.naming.loading(name);
    let done_name = BindPlugin.config.naming.done(name);
    this.generated_state[loading_name] = false;
    this.generated_mutations[loading_name] = (state) => state[loading_name] = true;
    this.generated_mutations[done_name] = (state) => state[loading_name] = false;
  }

  create_load_action(name, binding) {
    let action_name = BindPlugin.config.naming.trigger(name);

    if(binding.bind !== c.TRIGGER ){
      action_name = BindPlugin.config.naming.load(name);
      this.all_load_actions.push(action_name);
    }

    if ( binding.loading ) {
      this.commit_on_start.push(BindPlugin.config.naming.loading(name));
    }

    this.generated_actions[action_name] = ({ dispatch, commit }) => {

      if ( binding.loading === "each" ) {
        commit(BindPlugin.config.naming.loading(name));
      }

      return dispatch(`${BindPlugin.config.namespace}/${c.BIND}`, 
      { 
        binding  : binding,
        namespace: this.namespace,
        output   : name,
      }, { root : true });
    };
  }

  create_start_bind_action(name) {
    this.generated_actions[BindPlugin.config.naming.start] = ({ dispatch, commit }) => {
      let prom = Promise.resolve();
      this.add_watch_params(commit);
      this.commit_on_start.forEach((mut) => commit(mut));
      this.all_load_actions.forEach((action) => {
        prom = prom.then(() => Promise.resolve(dispatch(action)));
      });
      return prom;
    };
  }

  add_watch_params(commit) {
    for( let output_var of Object.keys(this.watch_param_defs) ) {
      commit(`${BindPlugin.config.namespace}/${c.WATCH_PARAMS}`, {
        action    : `${this.namespace}/${BindPlugin.config.naming.load(output_var)}`,
        mutations : Object.keys(this.watch_param_defs[output_var]).map((state_var) => `${this.namespace}/${BindPlugin.config.naming.update(state_var)}`),
      }, { root : true });
    }
  }
}
