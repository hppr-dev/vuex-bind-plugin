import axios from 'axios'
import BindPlugin from './bind_plugin.js'
import { get_default } from './utils.js'
import { wasm_adapter, storage_adapter } from './adapters.js'
import { REST, STORAGE, WASM } from './constants.js'

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
      url     : typeof(endpoint.url) === "string"? endpoint.url : endpoint.url(computed_params),
      params  : endpoint.method === "get"? computed_params : {},
      data    : endpoint.method === "get"? {} : computed_params,
      headers : {...bind_state.headers, ...endpoint.headers},
    }
  ];

  assign = (response) => response.data? response.data : null ;

  constructor({ 
      url     = "",
      headers = { "Content-Type" : "application/json" },
  }) {
    super({url, headers});
    this.mutations[BindPlugin.config.naming.update("header")] = (state, { key, value }) => state.headers[key] = value;
    this.mutations[BindPlugin.config.naming.update("url")] = (state, value ) => state.url = value;
  }

  apply_defaults(name, endpoint) {
    super.apply_defaults(name, endpoint);
    endpoint.url    = endpoint.url? endpoint.url : `/${name}/`;
    endpoint.method = endpoint.method? endpoint.method : "get";
  }
}

export class StorageDataSource extends DataSource {
  module = storage_adapter;

  args = ( bind_state, input_params, endpoint ) => [
    endpoint.key,
    input_params[endpoint.key],
    endpoint.type,
    endpoint.scope,
    {
      expires : endpoint.expires ?? bind_state.cookies.expires,
      path    : endpoint.path ?? bind_state.cookies.path,
    }
  ];

  constructor({ 
    cookies = {
      expires : 720000,
      path    : "/"
    }
  }) {
    super({ cookies });
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

export class MultDataSource extends DataSource {
  module(source, params) {
    return this.sources[source].module(...params);
  }

  args(bind_state, input_params, endpoint) {
    return [
      endpoint.source,
      this.sources[endpoint.source].args(bind_state, input_params, endpoint)
    ];
  }

  constructor({
    url       = undefined,
    headers   = undefined,
    storage   = false,
    cookies   = undefined,
    wasm      = undefined,
    mock      = {},
    transform = undefined,
  }) {
    super();
    this.sources = {};
    let conf = {
      url,
      headers,
      cookies,
      wasm
    };
    if ( url != null ) {
      this.sources[REST] = mock === true || mock[REST] ? new MockRestDataSource(conf, transform) : new RestDataSource(conf);
    }
    if ( storage ) {
      this.sources[STORAGE] = mock === true || mock[STORAGE] ? new MockStorageDataSource(conf, transform) : new StorageDataSource(conf);
    }
    if ( wasm != null ) {
      this.sources[WASM] = mock === true || mock[WASM] ? new MockWebAssemblyDataSource(conf, transform) : new WebAssemblyDataSource({ wasm });
    }
    if ( Object.keys(this.sources).length === 1 ){
      return this.sources[Object.keys(this.sources)[0]];
    }
  }

  apply_defaults(name, endpoint) {
    endpoint.source = this.infer_source(endpoint);
    this.sources[endpoint.source].apply_defaults(endpoint);
  }

  infer_source(endpoint) {
    if ( endpoint.source ) {
     return endpoint.source;
    } else if ( endpoint.url || endpoint.method ) {
      return  REST;
    } else if ( endpoint.key || endpoint.scope ) {
      return  STORAGE;
    } else if ( endpoint.func ) {
      return WASM
    }
    return BindPlugin.config.default_source;
  }
}

export class MockDataSource extends DataSource {
  args = ( bind_state, input_params, endpoint ) => [
    { 
      input_params,
      endpoint,
    }
  ];

  constructor(
    config,
    transform 
  ) {
    super(config);
    this.module = ({ input_params, endpoint }) => {
      let result = transform({ input_params, endpoint });
      return Promise.resolve(result != null? result : get_default(endpoint.type));
    };
  }
}

export class MockRestDataSource extends MockDataSource { 
  constructor({
      url     = "",
      headers = {},
    }, 
    transform = ({ endpoint }) => endpoint.mock,
  ) {
    super({url, headers}, transform);
    this.mutations[BindPlugin.config.naming.update("header")] = (state, { key, value }) => state.headers[key] = value;
    this.mutations[BindPlugin.config.naming.update("url")] = (state, value ) => state.url = value;
  }
}

export class MockStorageDataSource extends MockDataSource {
  constructor({
      cookies = {
        expires : 720000,
        path    : "/"
      }
    },
    transform = ({ endpoint }) => endpoint.mock,
  ) {
    super({ cookies }, transform);
  }
}

export class MockWebAssemblyDataSource extends MockDataSource {
  constructor({
    wasm
  }, transform ) {
    super( { wasm_file : wasm }, transform );
  }
}
