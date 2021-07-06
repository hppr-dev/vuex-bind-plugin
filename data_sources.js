import axios from 'axios'

export class RestDataSource {
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
  assign = (data) => response.data;
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
    this.state.url = url;
    this.state.headers = headers;
  }
}

export class _MockRestDataSource { 
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
    transform = (endpoint) => endpoint.mock_data 
  }) {
    this.state.url = url;
    this.state.headers = headers;
    this.module = transform;
  }
}
