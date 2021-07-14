import Bind from '@src/exports.js'

export default class BlackBox { 
  constructor({ plugin_config , store_config, resolve_data}) {

    let plugin = new Bind.Plugin(plugin_config);
    let modules = Bind.Modules(store_config);
    this.resolve_data = resolve_data;

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
  mock_axios() {
    this.module = jest.fn().mockImplementation((args) => {
      return Promise.resolve(this.resolve_data[args.url]);
    });
    Bind.Plugin.config.data_source.module = this.module;
  }
  spy_module() {
    let module = Bind.Plugin.config.data_source.module;
    this.module = jest.fn().mockImplementation((...args) => module(...args));
  }
  input_state(ns, state) {
    for ( let state_var of Object.keys(state) ){
      if ( this.state[ns][state_var]  == null ){
        throw `${ns}/${state_var} is undefined`;
      }
      this.state[ns][state_var] = state[state_var];
    }
  }
  output_state(ns, state) {
    return this.resolve_module().then(() => {
      return new Promise((resolve) => {
        for ( let state_var of Object.keys(state) ){
          try {
            expect(this.state[ns][state_var]).toBeDefined();
            expect(this.state[ns][state_var]).toStrictEqual(state[state_var]);
          } catch(e) {
            throw `Output state ${ns}/${state_var} was not what was expected in ${JSON.stringify(state,null,4)}\n${e}`;
          }
        }
        resolve();
      });
    });
  }
  resolve_module() {
    let results = this.module.mock.results;
    if (results.length === 0 ) {
      return Promise.resolve();
    }
    let recurse = () => Promise.resolve(this.resolve_module());
    let chain = results[0].value.then(recurse);
    for ( let i = 1 ; i < results.length ; i++){
      chain.then(() => results[i].value.then(recurse));
    }
    this.module.mockClear();
    return chain;
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
      throw `No action ${action} in namespace "${ns}", called with ${payload}`
    }
    return local_actions[action]({ 
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
      throw `No mutation ${mutation} in namespace ${ns}, called with ${payload}`
    }
    local_mutations[mutation](local_state, payload);
    this.mutation_watch({type : `${ns}/${mutation}`}, this.state);
  }
}
