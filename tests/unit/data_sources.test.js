import { DataSource, RestDataSource, MockRestDataSource, StorageDataSource, WebAssemblyDataSource} from '@src/data_sources.js'
import { storage_adapter, wasm_adapter } from '@src/adapters.js'
import axios from 'axios'

jest.mock('@src/adapters.js')

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
    expect(default_endpoint.url).toBe("/endpoint_name/");
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

describe("StorageDataSource", () => {

  let data_source = new StorageDataSource();

  it("should use storage_adapter", () => {
    expect(data_source.module).toBe(storage_adapter);
  });

  it("should not have state variables or mutations", () => {
    expect(data_source.state).toStrictEqual({});
    expect(data_source.mutations).toStrictEqual({});
  });

  it("should have args that returns key, value, type, scope", () => {
    let input_params = { "out" : 123 };
    let endpoint = { 
      key: "out",
      type: String,
      scope: "scope"
    };
    expect(data_source.args({}, input_params, endpoint)).toStrictEqual(["out", 123, String, "scope"]);
  });

  it("should have an assign that returns the same data", () => {
    expect(data_source.assign(1234)).toBe(1234);
  });

  it("should apply defaults", () => {
    let def = {};
    data_source.apply_defaults("mystorage", def);
    expect(def.key).toBe("mystorage");
    expect(def.params).toStrictEqual({ mystorage : String });
    expect(def.type).toBe(String);
    expect(def.scope).toBe("local");
  });

  it("should leave non-defaults", () => {
    let def = {
      key   : "something",
      type  : Array,
      scope : "session",
    };
    data_source.apply_defaults("mystorage", def);
    expect(def.key).toBe("something");
    expect(def.params).toStrictEqual({ something : Array });
    expect(def.type).toBe(Array);
    expect(def.scope).toBe("session");
  });

  it("should leave non-defaults with params", () => {
    let def = {
      key   : "something",
      type  : Array,
      scope : "session",
      params : {
        something : Array
      },
    };
    data_source.apply_defaults("mystorage", def);
    expect(def.key).toBe("something");
    expect(def.params).toStrictEqual({ something : Array });
    expect(def.type).toBe(Array);
    expect(def.scope).toBe("session");
  });
});

describe("WebAssemblyDataSource", () => {
  let data_source = new WebAssemblyDataSource({wasm: "some.wasm"});

  it("should default to application.wasm", () => {
    let data_source = new WebAssemblyDataSource({});
    expect(data_source.state.wasm_file).toBe("application.wasm");
  });

  it("should use wasm_adapter", () => {
    expect(data_source.module).toBe(wasm_adapter);
  });

  it("should order arguments according to order field", () => {
    let endpoint = {
      order : [ "hello", "world", "foo", "bar"]
    }
    let input_params = {
      bar   : 100,
      hello : "world",
      foo   : false,
      world : 42
    };
    expect(data_source.args({}, input_params, endpoint)).toStrictEqual(["world", 42, false, 100]);
  });

  it("should give no arguments when order field is empty", () => {
    let endpoint = {
      order : []
    }
    let input_params = {
      bar   : 100,
      hello : "world",
    };
    expect(data_source.args({}, input_params, endpoint)).toStrictEqual([]);
  });

  it("should apply defaults", () => {
    let def = {};
    data_source.apply_defaults("myfunc", def);
    expect(def.func_name).toBe("myfunc");
    expect(def.order).toStrictEqual([]);
  });

  it("should leave non-defaults", () => {
    let def = {
      func_name : "expensive",
      order : ["one", "two"]
    };
    data_source.apply_defaults("myfunc", def);
    expect(def.func_name).toBe("expensive");
    expect(def.order).toStrictEqual(["one", "two"]);
  });
});