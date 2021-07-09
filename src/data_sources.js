import axios from 'axios'
import { wasm_adapter, storage_adapter } from './adapters.js'

export class DataSource {
  state     = {};
  mutations = {};
  assign = (data) => data;

  constructor(state) {
    this.state = state;
  }

  apply_defaults(name, endpoint) {
    endpoint.params = endpoint.params? endpoint.params : {};
    endpoint.type = endpoint.type? endpoint.type : Object;
  }
}

export class RestDataSource extends DataSource {
  module = axios;

  args   =  (bind_state, computed_params, endpoint) => [
    {
      method  : endpoint.method,
      baseURL : bind_state.url,
      url     : endpoint.url,
      params  : endpoint.method === "get"? computed_params : {},
      data    : endpoint.method === "get"? {} : computed_params,
      headers : bind_state.headers,
    }
  ];

  assign = (response) => response.data? response.data : null ;

  mutations = {
    update_header : (state, {key, value}) =>  state.headers[key] = value,
    update_url    : (state, url)  => state.url = url
  }

  constructor({ 
      url     = "",
      headers = { "Content-Type" : "application/json" },
  }) {
    super({url, headers});
  }

  apply_defaults(name, endpoint) {
    super.apply_defaults(name, endpoint);
    endpoint.url    = endpoint.url? endpoint.url : `/${name}/`;
    endpoint.method = endpoint.method? endpoint.method : "get";
  }
}

export class MockRestDataSource extends DataSource { 
  args = ( bind_state, input_params, endpoint ) => [
    { 
      endpoint,
      input_params,
    }
  ];

  mutations = {
    update_header : (state, {key, value}) =>  state.headers[key] = value,
    update_url    : (state, url)  => state.url = url
  }

  constructor({ 
    url       = "",
    headers   = {},
    transform = ({ endpoint }) => endpoint.mock_data 
  }) {
    super({url, headers});
    this.module = transform;
  }
}

export class StorageDataSource extends DataSource {
  module = storage_adapter;

  args = ( bind_state, input_params, endpoint ) => [
    endpoint.key,
    input_params[endpoint.key],
    endpoint.type,
    endpoint.scope
  ];

  constructor() {
    super({})
  }

  apply_defaults(name, endpoint ) {
    endpoint.type = endpoint.type? endpoint.type : String;
    super.apply_defaults(name, endpoint);
    endpoint.key = endpoint.key? endpoint.key : name;
    endpoint.params[endpoint.key] = endpoint.params[endpoint.key]? endpoint.params[endpoint.key] : endpoint.type;
    endpoint.scope = endpoint.scope? endpoint.scope : "local";
  }
}

export class WebAssemblyDataSource extends DataSource {
  module = wasm_adapter;

  args  = ( bind_state, input_params, endpoint ) => endpoint.order.map((p) => input_params[p]);

  constructor({
    wasm = "application.wasm",
  }) {
    super({ wasm_file : wasm });
  }

  apply_defaults(name, endpoint) {
    super.apply_defaults(name, endpoint);
    endpoint.func_name = endpoint.func_name? endpoint.func_name : name;
    endpoint.order = endpoint.order? endpoint.order : [] ;
  }
}
