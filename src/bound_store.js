import BindPlugin from './bind_plugin.js'
import { map_endpoint_types, get_default, apply_binding_defaults, check_bindings } from './utils.js'
import * as c from  './constants.js'

export default class _BoundStore {
  constructor(store_config){
    this.plugin_config = BindPlugin.config;

    if ( store_config.namespace === undefined ) {
      throw `BoundStore initialized without namespace: ${JSON.stringify(store_config)}`; 
    }
    if ( this.plugin_config.endpoints === undefined ) {
      throw `BoundStore created before plugin was configured: ${JSON.stringify(store_config)}`;
    }

    this.namespace = store_config.namespace;
    this.bindings = store_config.bindings;
    this.generated_state = {};
    this.generated_mutations = {};
    this.generated_actions = {};
    this.all_load_actions = [];
    this.watch_param_defs = [];
    this.generate_modifications();

    delete store_config.bindings;
    delete store_config.namespace;

    Object.assign(store_config.state, this.generated_state);
    Object.assign(store_config.mutations, this.generated_mutations);
    Object.assign(store_config.actions, this.generated_actions);

    store_config.namespaced = true;

    return this.namespace === ""? store_config : { [this.namespace] : store_config }
  }

  generate_modifications() {
    for ( let output_var of Object.keys(this.bindings) ) {
      let binding_spec  = this.bindings[output_var];
      let endpoint_spec = this.plugin_config.endpoints[binding_spec.endpoint];

      if ( this.plugin_config.strict && endpoint_spec === undefined ) {
        throw `Tried to bind to unknown endpoint ${output_var}<->${binding_spec.endpoint} bind_type ${binding_spec.bind_type}`;
      }

      if  ( this.plugin_config.strict && ! c.BINDING_TYPES.includes(binding_spec.bind_type) ) {
        throw `Unknown binding type for ${output_var}<->${binding_spec.endpoint} bind_type ${binding_spec.bind_type}`;
      }

      apply_binding_defaults(output_var, binding_spec);
      let params = map_endpoint_types(binding_spec.param_map, endpoint_spec.params);

      if ( binding_spec.bind_type == c.WATCH || binding_spec.bind_type == c.CHANGE ) {
        this.watch_param_defs[output_var] = params;
      }

      if ( ! binding_spec.redirect ) {
        this.create_variable(output_var, endpoint_spec.type);
      }

      if ( params && binding_spec.create_params ) {
        for ( let [state_var, type] of Object.entries(params) ) {
          this.create_variable(state_var, type);
        }
      }

      if ( binding_spec.loading ) {
        this.create_loading_variable(output_var);
      }

      this.create_load_action(output_var, binding_spec, endpoint_spec);
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

  create_load_action(name, binding_spec, endpoint_spec) {
    let action_name = `${this.plugin_config.trigger_prefix}${name}`;
    if(binding_spec.bind_type !== c.TRIGGER ){
      action_name = `${this.plugin_config.load_prefix}${name}`;
      this.all_load_actions.push(action_name);
    }
    this.generated_actions[action_name] = ({ dispatch }) => {
      dispatch(`${this.plugin_config.namespace}/${c.BIND}`, 
      { 
        binding  : binding_spec,
        endpoint : endpoint_spec,
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
