import { ONCE } from './constants.js'
import BoundStore from './bound_store.js'

export const reverse_map = function(str_map) {
  return Object.fromEntries(Object.keys(str_map).map( (key) => [ str_map[key], key ] ) );
}

export const map_endpoint_types = function(param_map={}, type_map={}) {
  let reversed = reverse_map(param_map);
  return Object.fromEntries(
    Object.keys(type_map).map((param) => {
      let param_type = type_map[param];
      if ( reversed[param] ) {
        return [ reversed[param], param_type ];
      } 
      if ( param_map?.[param]?.computed ) {
        return [ param, param_map[param] ];
      }
      return [ param, param_type ];
    })
  );
  
}

export const is_unset = function(value, type) {
  switch (type) {
    case Object  :
    case Array   :
    case String  :
      return value == null || Object.keys(value).length === 0;
    case Number  :
      return value === 0;
    case Boolean :
      return value !== true && value !== false;
  }
  if ( type instanceof Function && type().is_set ){
    let t = type();
    return !t.is_set(value);
  }
  return true;
}

export const is_type_match = function(value, type) {
  let t = type();
  if(t.default) {
    return Object(value).constructor.name === Object(t.default).constructor.name;
  }
  return Object(value).constructor.name === type.name;
}

export const check_types = function(params, type_defs) {
  return Object.keys(type_defs).filter((name) => !is_type_match(params[name], type_defs[name]));
}

export const check_unset = function(params, type_defs) {
  return Object.keys(params).find((name) => is_unset(params[name], type_defs[name])) 
}

export const get_default = function(type) {
  if ( type == null ){
    return Object();
  }
  let t = type();
  return t.default? t.default : t;
}

export const match = {
  PositiveNumber : () => () => ({
    name    : "match.PositiveNumber()",
    is_set  : (value) => value >= 0,
    default : -1,
  }),
  NegativeNumber : () => () => ({
    name    : "match.NegativeNumber()",
    is_set   : (value) => value <= 0,
    default : 1,
  }),
  NumberRange : (start, end) => () => ({
    name    : "match.NumberRange()",
    is_set   : (value) => value >= start && value <= end,
    default : start - 1
  }),
  ArrayLength : (len) => () => ({
    name    : "match.ArrayLength()",
    is_set   : (value) => value.length === len,
    default : [],
  }),
  ObjectKeys : (keys) => () => ({
    name    : "match.ObjectKeys()",
    is_set   : (value) => {
      let value_keys = Object.keys(value);
      return keys.every((key) => value_keys.includes(key));
    },
    default : {}
  }),
  All : (def) => () => ({
    name    : "match.All()",
    is_set   : () => true,
    default : def,
  }),
  AnythingBut : (def) => () => ({
    name    : "match.AnythingBut()",
    is_set   : (value) => def !== value,
    default : def,
  }),
}

export const lookup_mock = ({ endpoint, input_params }) => endpoint.mock_data(input_params);

export const apply_binding_defaults = (name, binding) => {
  binding.endpoint = binding.endpoint ?? `${name}`;
  binding.bind = binding.bind ?? ONCE;
  binding.param_map = binding.param_map ?? {};
  binding.create_params = binding.create_params ?? true;
}

export const create_bound_stores = (configs) => {
  return Object.fromEntries(
    Object.keys(configs)
      .map((ns) => {
        if ( configs[ns].namespace || configs[ns].bindings || configs[ns].modules ) {
          if ( ( configs[ns].namespace && configs[ns].bindings ) || configs[ns].modules ) {
            return [
              configs[ns].namespace ?? ns,
              new BoundStore(configs[ns])
            ];
          } 
          let m = ["bindings", "namespace"];
          let n = configs[ns].bindings? 0 : 1; 
          console.warn(`Module ${ns} has ${m[n]} but is missing ${m[(n+1)%2]}`);
        }
        return [ns, configs[ns]]
      }
    )
  );
}

export const get_watchable_params = (params={}) => {
  return Object.keys(params).map((key) => {
    if ( params[key].computed ) {
      return params[key].watch;
    }
    return key;
  }).filter((key) => key !== undefined);
}
