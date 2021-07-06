
export const reverse_map = function(str_map) {
  return Object.fromEntries(Object.keys(str_map).map( (key) => [ str_map[key], key ] ) );
}

export const map_endpoint_types = function(param_map, type_map) {
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

export const add_camel_case = function(obj) {
  for( let key of Object.key(obj) ) {
    obj[to_camel_case(key)] = obj[key];
  }
}

export const to_camel_case = function(str) {
  let words = str.split('_');
  return words.slice(0,1) + words.slice(1).map((s) => s.slice(0,1).toUpperCase() + s.slice(1));
}
