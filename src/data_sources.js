import axios from 'axios'

export class DataSource {
  constructor() {}
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
  state  = {
    url     : "",
    headers : {},
  };
  mutations = {
    update_header : (state, {key, value}) =>  state.headers[key] = value,
    update_url    : (state, url)  => state.url = url
  }
  constructor({ 
      url     = "",
      headers = { "Content-Type" : "application/json" },
  }) {
    super();
    this.state.url = url;
    this.state.headers = headers;
  }
  apply_defaults(name, endpoint) {
    super.apply_defaults(name, endpoint);
    endpoint.url    = endpoint.url? endpoint.url : `/${name}`;
    endpoint.method = endpoint.method? endpoint.method : "get";
  }
}

export class MockRestDataSource extends DataSource{ 
  args = ( bind_state, input_params, endpoint ) => [
    { 
      endpoint,
      input_params,
    }
  ];
  state  = {
    url     : "",
    headers : {},
  };
  assign = (data) => data;
  mutations = {
    update_header : (state, {key, value}) =>  state.headers[key] = value,
    update_url    : (state, url)  => state.url = url
  }
  constructor({ 
    url       = "",
    headers   = {},
    transform = ({ endpoint }) => endpoint.mock_data 
  }) {
    super();
    this.state.url = url;
    this.state.headers = headers;
    this.module = transform;
  }
}
