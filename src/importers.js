import BindPlugin from './bind_plugin.js'

export const mapBindings = (ns, vars) => {
  [ns, vars] = assume_ns_vars(ns, vars);
  return Object.fromEntries(vars.map((v) => [
    v,
    function () {
      return reduce_namespace_state(ns, this.$store.state)[v]
    },
  ]));
}

export const mapBindingsWithLoading = (ns, vars) => {
  [ns, vars] = assume_ns_vars(ns, vars);
  return Object.fromEntries(vars.map((v) => [
    v,
    function () {
      let local_state = reduce_namespace_state(ns, this.$store.state);
      let value = new Object(local_state[v]);
      value.loading = local_state[BindPlugin.config.naming.loading(v)];
      return value;
    },
  ]));
}

export const mapParams = mapBindings;

export const syncParams = (ns, vars) => {
  [ns, vars] = assume_ns_vars(ns, vars);
  return Object.fromEntries(vars.map((v) => [
    v, {
      get() {
        let local_state = reduce_namespace_state(ns, this.$store.state);
        return local_state[v];
      },
      set(value) {
        this.$store.commit(`${ns}${BindPlugin.config.naming.update(v)}`, value);
      },
    }
  ]));
}

export const mapTriggerActions = (ns, vars) => {
  [ns, vars] = assume_ns_vars(ns, vars);
  return Object.fromEntries(vars.map((v) => [
    v,
    function() { 
      return this.$store.dispatch(`${ns}${BindPlugin.config.naming.trigger(v)}`);
    }
  ]))
}

const reduce_namespace_state = (ns, state) => {
  return ns.split('/')
    .filter((s) => s !== "")
    .reduce((state, n) => state[n], state);
}

const assume_ns_vars = (ns, vars) => {
  return vars === undefined? ["", ns] : [`${ns}/`, vars];
}
