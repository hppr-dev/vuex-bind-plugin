import { DataSource, RestDataSource, MockRestDataSource } from '../src/data_sources.js'
import axios from 'axios'

describe("DataSource", () => {

  it("should apply defaults", () => {
    let data_source = new DataSource();
    let default_endpoint = {};
    data_source.apply_defaults("some_endpoint", default_endpoint);
    expect(default_endpoint.type).toBe(Object);
    expect(default_endpoint.params).toStrictEqual({});
  });

  it("should leave set values", () => {
    let data_source = new DataSource();
    let default_endpoint = {
      type : String,
      params : {
        foo : "bar"
      }
    };
    data_source.apply_defaults("some_endpoint", default_endpoint);
    expect(default_endpoint.type).toBe(String);
    expect(default_endpoint.params).toStrictEqual({foo: "bar"});
  });

});

describe("RestDataSource", () => {

  it("constructor should return RestDataSource", () => {
    let data_source = new RestDataSource({});
    expect(data_source).toBeInstanceOf(RestDataSource);
  });
  
  it("constructor should have defaults", () => {
    let data_source = new RestDataSource({});
    expect(data_source.module).toBe(axios);
    expect(data_source.assign).toStrictEqual(expect.any(Function));
    expect(data_source.args).toStrictEqual(expect.any(Function));
    expect(data_source.state).toStrictEqual({ url: "", headers: {"Content-Type": "application/json"} });
    expect(data_source.mutations).toStrictEqual({ update_url : expect.any(Function), update_header : expect.any(Function) });
  });
  
  it("args should return params for get requests", () => {
    let data_source = new RestDataSource({});
    let bind_state = {
      url : "my_api",
      headers : "my_headers"
    };
    let computed_params = {
      id       : 1000,
      username : "chungus"
    };
    let endpoint = {
      method : "get",
      url : "get_user_things"
    };
    expect(data_source.args(bind_state, computed_params, endpoint)).toStrictEqual([{
      method : "get",
      baseURL : "my_api",
      url : "get_user_things",
      params : computed_params,
      data   : {},
      headers : "my_headers"
    }]);
  });

  it("args should return data for post requests", () => {
    let data_source = new RestDataSource({});
    let bind_state = {
      url : "my_api",
      headers : "my_headers"
    };
    let computed_params = {
      id       : 1000,
      username : "chungus"
    };
    let endpoint = {
      method : "post",
      url : "post_user_things"
    };
    expect(data_source.args(bind_state, computed_params, endpoint)).toStrictEqual([{
      method : "post",
      baseURL : "my_api",
      url : "post_user_things",
      data : computed_params,
      params  : {},
      headers : "my_headers"
    }]);
  });
  
  it("assign should extract data from response", () => {
    let data_source = new RestDataSource({});
    let response = {
      data : "I'm some data"
    };
    expect(data_source.assign(response)).toBe("I'm some data");
  });

  it("assign should return null when no data", () => {
    let data_source = new RestDataSource({});
    let response = {};
    expect(data_source.assign(response)).toBeNull();
  });
  
  it("state should include url and headers", () => {
    let data_source = new RestDataSource({});
    expect(data_source.state.url).toBeDefined();
    expect(data_source.state.headers).toBeDefined();
  });
  
  it("constructor should set url and headers", () => {
    let data_source = new RestDataSource({url: "hello", headers: "world"});
    expect(data_source.state.url).toBe("hello");
    expect(data_source.state.headers).toBe("world");
  });
  
  it("mutations should have url and headers updates", () => {
    let data_source = new RestDataSource({});
    let state = {
      url : "something",
      headers : { header1 : "value" },
    }
    data_source.mutations.update_url(state, "new url");
    data_source.mutations.update_header(state, { key: "header1", value: "new thing" });
    data_source.mutations.update_header(state, { key: "header2", value: "something new" });
    expect(state.url).toBe("new url");
    expect(state.headers.header1).toBe("new thing");
    expect(state.headers.header2).toBe("something new");
  });

  it("should apply endpoint defaults", () => {
    let data_source = new RestDataSource({});
    let default_endpoint = {};
    data_source.apply_defaults("endpoint_name", default_endpoint);
    expect(default_endpoint.url).toBe("/endpoint_name");
    expect(default_endpoint.method).toBe("get");
    expect(default_endpoint.type).toBe(Object);
    expect(default_endpoint.params).toStrictEqual({});
  });

  it("should leave endpoint set values", () => {
    let data_source = new RestDataSource({});
    let default_endpoint = {
      url    : "/my_url",
      method : "post",
    };
    data_source.apply_defaults("endpoint_name", default_endpoint);
    expect(default_endpoint.url).toBe("/my_url");
    expect(default_endpoint.method).toBe("post");
    expect(default_endpoint.type).toBe(Object);
    expect(default_endpoint.params).toStrictEqual({});
  });

});

describe("MockRestDataSource", () => {

  it("constructor should return RestDataSource", () => {
    let data_source = new MockRestDataSource({});
    expect(data_source).toBeInstanceOf(MockRestDataSource);
  });
  
  it("constructor should have defaults", () => {
    let data_source = new MockRestDataSource({});
    expect(data_source.module).toStrictEqual(expect.any(Function));
    expect(data_source.assign).toStrictEqual(expect.any(Function));
    expect(data_source.args).toStrictEqual(expect.any(Function));
    expect(data_source.state).toStrictEqual({ url: "", headers: {} });
    expect(data_source.mutations).toStrictEqual({ update_url : expect.any(Function), update_header : expect.any(Function) });
  });

  it("module should extract mock_data by default", () => {
    let data_source = new MockRestDataSource({});
    let endpoint = {
      mock_data : "some mock data"
    }
    expect(data_source.module({endpoint})).toBe("some mock data");
  });
  
  it("args should have endpoint and input_params in argument", () => {
    let data_source = new MockRestDataSource({});
    expect(data_source.args({}, "computed_params", "endpoint")).toStrictEqual([{ input_params: "computed_params", endpoint: "endpoint" }]);
  });
  
  it("assign shouldn't do anything", () => {
    let data_source = new MockRestDataSource({});
    expect(data_source.assign("dont change")).toBe("dont change");
  });
  
  it("state should include url and headers", () => {
    let data_source = new MockRestDataSource({});
    expect(data_source.state.url).toBeDefined();
    expect(data_source.state.headers).toBeDefined();
  });
  
  it("constructor should set url, headers and module(transform)", () => {
    let transform_fun = (obj) => obj;
    let data_source = new MockRestDataSource({url : "my_url", headers : "my headers", transform : transform_fun });
    expect(data_source.state.url).toBe("my_url");
    expect(data_source.state.headers).toBe("my headers");
    expect(data_source.module).toBe(transform_fun);
  });
  
  it("mutations should have url and headers updates", () => {
    let data_source = new MockRestDataSource({});
    let state = {
      url : "something",
      headers : { header1 : "value" },
    }
    data_source.mutations.update_url(state, "new url");
    data_source.mutations.update_header(state, { key: "header1", value: "new thing" });
    data_source.mutations.update_header(state, { key: "header2", value: "something new" });
    expect(state.url).toBe("new url");
    expect(state.headers.header1).toBe("new thing");
    expect(state.headers.header2).toBe("something new");
  });
});
