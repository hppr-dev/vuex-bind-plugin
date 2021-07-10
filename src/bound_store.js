import BindPlugin from './bind_plugin.js'
import { map_endpoint_types, get_default, apply_binding_defaults, check_bindings } from './utils.js'
import * as c from  './constants.js'

export default class _BoundStore {
  constructor(store_config){
    this.plugin_config = BindPlugin.config;

    if ( store_config.namespace === undefined ) {
      throw `BoundStore initialized without namespace: ${JSON.stringify(store_config)}`; 
    }
    if ( this.plugin_config === undefined ) {
      throw `BoundStore created before plugin was configured: ${JSON.stringify(store_config)}`;
    }

    this.namespace = store_config.namespace;
    this.bindings = store_config.bindings;

    for ( let [ output_var, binding ] of Object.entries(this.bindings) ) {
      apply_binding_defaults(output_var, binding);
      if ( typeof binding.endpoint === "string") {
        let endpoint_name = binding.endpoint;
        binding.endpoint = this.plugin_config.endpoints?.[endpoint_name] ?? store_config.endpoints?.[endpoint_name];

        if ( this.plugin_config.strict && binding.endpoint == null ) {
          throw `Tried to bind to unknown endpoint ${output_var}<->${binding.endpoint} bind_type ${binding.bind_type}`;
        }

      }

      if  ( this.plugin_config.strict && ! c.BINDING_TYPES.includes(binding.bind_type) ) {
        throw `Unknown binding type for ${output_var}<->${binding.endpoint} bind_type ${binding.bind_type}`;
      }
    }

    this.generated_state = {};
    this.generated_mutations = {};
    this.generated_actions = {};
    this.all_load_actions = [];
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

      if ( binding.bind_type == c.WATCH || binding.bind_type == c.CHANGE ) {
        this.watch_param_defs[output_var] = params;
      }

      if ( ! binding.redirect ) {
        this.create_variable(output_var, binding.type);
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
    this.generated_mutations[`${this.plugin_config.update_prefix}${name}`] = (state, payload) => state[name] = payload;
  }

  create_loading_variable(name) {
    let loading_name = `${this.plugin_config.loading_prefix}${name}`;
    let done_name = `${this.plugin_config.done_prefix}${loading_name}`;
    this.generated_state[loading_name] = false;
    this.generated_mutations[loading_name] = (state) => state[loading_name] = true;
    this.generated_mutations[done_name] = (state) => state[loading_name] = false;
  }

  create_load_action(name, binding) {
    let action_name = `${this.plugin_config.trigger_prefix}${name}`;
    if(binding.bind_type !== c.TRIGGER ){
      action_name = `${this.plugin_config.load_prefix}${name}`;
      this.all_load_actions.push(action_name);
    }
    this.generated_actions[action_name] = ({ dispatch }) => {
      dispatch(`${this.plugin_config.namespace}/${c.BIND}`, 
      { 
        binding  : binding,
        namespace: this.namespace,
        output   : name,
      }, { root : true });
    };
  }

  create_start_bind_action(name) {
    this.generated_actions[c.START_BIND] = ({ dispatch, commit }) => {
      this.add_watch_params(commit);
      this.all_load_actions.map((action) => dispatch(action));
    };
  }

  add_watch_params(commit) {
    for( let output_var of Object.keys(this.watch_param_defs) ) {
      commit(`${this.plugin_config.namespace}/${c.WATCH_PARAMS}`, {
        action    : `${this.namespace}/${this.plugin_config.load_prefix}${output_var}`,
        mutations : Object.keys(this.watch_param_defs[output_var]).map((state_var) => `${this.namespace}/${this.plugin_config.update_prefix}${state_var}`),
      }, { root : true });
    }
  }
}
