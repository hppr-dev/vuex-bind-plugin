
export const reverse_map = function(str_map) {
  return Object.fromEntries(Object.keys(str_map).map( (key) => [ str_map[key], key ] ) );
}

export const map_endpoint_types = function(param_map, type_map) {
  if ( param_map ) {
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
  } else {
    return type_map;
  }
}

export const Nullable = () => "nullable"

export const Zero = (x) => () => x
