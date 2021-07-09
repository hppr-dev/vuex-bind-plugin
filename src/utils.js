import { ONCE } from './constants.js'

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
      return [ param, param_type ];
    })
  );
  
}

export const is_unset = function(value, type) {
  switch (type) {
    case Object :
    case Array  :
    case String :
      return value == null || Object.keys(value).length === 0;
    case Number:
      return value === 0;
  }
  if ( type instanceof Function){
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
    is_set   : (value) => value >= 0,
    default : -1,
  }),
  NegativeNumber : () => () => ({
    is_set   : (value) => value <= 0,
    default : 1,
  }),
  NumberRange : (start, end) => () => ({
    is_set   : (value) => value >= start && value <= end,
    default : start - 1
  }),
  ArrayLength : (len) => () => ({
    is_set   : (value) => value.length === len,
    default : [],
  }),
  ObjectKeys : (keys) => () => ({
    is_set   : (value) => {
      let value_keys = Object.keys(value);
      return keys.every((key) => value_keys.includes(key));
    },
    default : {}
  }),
  All : (def) => () => ({
    is_set   : () => true,
    default : def,
  }),
  AnythingBut : (def) => () => ({
    is_set   : (value) => def !== value,
    default : def,
  }),
}

export const query_mock_data = ({ endpoint, input_params }) => endpoint.mock_data(input_params);

export const apply_binding_defaults = (name, binding) => {
  binding.endpoint = binding.endpoint? binding.endpoint : `/${name}/`;
  binding.bind_type = binding.bind_type? binding.bind_type : ONCE;
  binding.param_map = binding.param_map? binding.param_map : {};
}
