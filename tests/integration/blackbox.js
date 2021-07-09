import Bind from '@src/exports.js'

export default class BlackBox { 
  constructor({ plugin_config , store_config }) {

    let plugin = new Bind.Plugin(plugin_config);

    this.axios = jest.fn((args) => new Promise((resolve, reject) =>  resolve("data")));
    Bind.Plugin.config.data_source.module = this.axios;

    let modules = Bind.Modules(store_config);

    jest.useFakeTimers();

    this.current_ns = "";
    this.state = {};
    this.mutations = {};
    this.actions = {};
    this.getters = {};
    for ( let ns of Object.keys(modules) ) {
      this.registerModule(ns, modules[ns]);
    }
    plugin(this);
  }
  subscribe(func) {
    this.mutation_watch = func;
  }
  registerModule(ns, module) {
    if ( ns === "root" ) {
      Object.assign(this.state, module.state);
      Object.assign(this.mutations, module.mutations);
      Object.assign(this.actions, module.actions);
      Object.assign(this.getters, module.getters);
    } else { 
      this.state[ns] = module.state;
      this.mutations[ns] = module.mutations;
      this.actions[ns] = module.actions;
      this.getters[ns] = module.getters;
    }
  }
  dispatch(action, payload, extra={} ) {
    let spl = action.split('/');
    let ns  = "";
    if ( spl.length === 2 ) {
      ns = spl[0];
      action = spl[1];
    }
    return this.dispatch_from(action, payload, extra, ns);
  }
  commit(mutation, payload, extra={} ) {
    let spl = mutation.split('/');
    let ns  = "";
    if ( spl.length === 2 ) {
      ns = spl[0];
      mutation = spl[1];
    }
    return this.commit_from(mutation, payload, extra, ns);
  }
  dispatch_from(action, payload, extra, ns) {
    if ( action.includes('/') && extra.root ) {
      return this.dispatch(action, payload, extra)
    }
    let local_actions = ns === ""? this.actions : this.actions[ns];
    let local_state = ns === ""? this.state : this.state[ns];
    if ( ! local_actions || ! local_actions[action] ) {
      console.log("NS:",ns,"ACT:", action,"PAY:", payload);
      throw `No action ${action} in namespace "${ns}"`
    }
    local_actions[action]({ 
      state : local_state,
      rootState : this.state,
      dispatch  : (a,p,e={}) => this.dispatch_from(a, p, e, ns),
      commit    : (m,p,e={}) => this.commit_from(m, p, e, ns)
    }, payload);
  }
  commit_from(mutation, payload, extra, ns) {
    if ( mutation.includes('/') && extra.root ) {
      return this.commit(mutation, payload, extra)
    }
    let local_mutations = ns === ""? this.mutations : this.mutations[ns];
    let local_state = ns === ""? this.state : this.state[ns];
    if ( ! local_mutations || ! local_mutations[mutation] ) {
      console.log("NS:",ns,"MUT:", mutation,"PAY:", payload);
      throw `No mutation ${mutation} in namespace ${ns}`
    }
    local_mutations[mutation](local_state, payload);
    this.mutation_watch({type : `${ns}/${mutation}`}, this.state);
  }
}
