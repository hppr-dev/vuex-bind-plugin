import { 
  DataSource,
  MockDataSource,
  RestDataSource,
  MockRestDataSource,
  StorageDataSource,
  MockStorageDataSource,
  WebAssemblyDataSource,
  MockWebAssemblyDataSource,
  MultDataSource
} from '@src/data_sources.js'
import BindPlugin from '@src/bind_plugin.js'
import { test_plugin_config } from './test-utils.js'
import { storage_adapter, wasm_adapter } from '@src/adapters.js'
import axios from 'axios'

beforeAll(() => BindPlugin.config = test_plugin_config);
afterAll(() => BindPlugin.config = null);

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
      headers : { state_headers : "my_headers" },
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
      headers : { state_headers : "my_headers" },
    }]);
  });

  it("args should return data for post requests", () => {
    let data_source = new RestDataSource({});
    let bind_state = {
      url : "my_api",
      headers : { state_headers : "my_headers" },
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
      headers : { state_headers : "my_headers" },
    }]);
  });

  it("args should translate url if it is a function", () => {
    let data_source = new RestDataSource({});
    let bind_state = {
      url : "my_api",
      headers : { state_headers : "my_headers" },
    };
    let computed_params = {
      id       : 1234,
      username : "chungus"
    };
    let endpoint = {
      method : "post",
      url : (params) => `id is ${params.id}`,
    };
    expect(data_source.args(bind_state, computed_params, endpoint)).toStrictEqual([{
      method : "post",
      baseURL : "my_api",
      url : "id is 1234",
      data : computed_params,
      params  : {},
      headers : { state_headers : "my_headers" },
    }]);
  });

  it("args should add headers endpoint headers", () => {
    let data_source = new RestDataSource({});
    let bind_state = {
      url : "my_api",
      headers : { state_headers : "my_headers" },
    };
    let computed_params = {
      id       : 4444,
      username : "chungus"
    };
    let endpoint = {
      method : "post",
      url : "/endpoint",
      headers : { endpoint_headers : "per_point" },
    };
    expect(data_source.args(bind_state, computed_params, endpoint)).toStrictEqual([{
      method : "post",
      baseURL : "my_api",
      url : "/endpoint",
      data : computed_params,
      params  : {},
      headers : { endpoint_headers : "per_point", state_headers : "my_headers" },
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
      mock : "some mock data"
    }
    return expect(data_source.module({endpoint})).resolves.toBe("some mock data");
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
    let transform_fun = ({endpoint}) => endpoint+"world";
    let data_source = new MockRestDataSource({url : "my_url", headers : "my headers",}, transform_fun);
    expect(data_source.state.url).toBe("my_url");
    expect(data_source.state.headers).toBe("my headers");
    expect(data_source.module).toStrictEqual(expect.any(Function));
    return expect(data_source.module({endpoint: "hello"})).resolves.toBe("helloworld");
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

  let data_source = new StorageDataSource({});

  it("should use storage_adapter", () => {
    expect(data_source.module).toBe(storage_adapter);
  });

  it("should have cookies state variables and no mutations", () => {
    expect(data_source.state).toStrictEqual({ cookies: { expires : 720000, path: "/" } });
    expect(data_source.mutations).toStrictEqual({});
  });

  it("should have args that returns key, value, type, scope, cookie_config", () => {
    let bind_state = {
      cookies : {
        expires : 1111,
        path    : "somepath",
      }
    }
    let input_params = { "out" : 123 };
    let endpoint = { 
      key: "out",
      type: String,
      scope: "scope"
    };
    expect(data_source.args(bind_state, input_params, endpoint)).toStrictEqual(["out", 123, String, "scope", { expires : 1111, path :"somepath" }]);
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

describe("MultDataSource", () => {
 
  it("should configure all datsources", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    expect(source.sources).toStrictEqual({
      "rest"    : expect.any(RestDataSource),
      "storage" : expect.any(StorageDataSource),
      "wasm"    : expect.any(WebAssemblyDataSource),
    });
  });

  it("should configure rest, storage datsources", () => {
    let source = new MultDataSource({ url: "myurl", storage : true });
    expect(source.sources).toStrictEqual({
      "rest"    : expect.any(RestDataSource),
      "storage" : expect.any(StorageDataSource),
    });
  });

  it("should return a single rest datasource when it is only present", () => {
    let source = new MultDataSource({ url: "myurl" });
    expect(source).toBeInstanceOf(RestDataSource);
  });

  it("should return a single storage datasource when it is only present", () => {
    let source = new MultDataSource({ storage: true });
    expect(source).toBeInstanceOf(StorageDataSource);
  });

  it("should forward args to rest on rest source on datasource", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let bind_state = { };
    let params = { some_param : 10 };
    let endpoint = { source : "rest"};
    source.sources.rest.args = jest.fn(() => "args called");
    expect(source.args(bind_state, params, endpoint)).toStrictEqual(["rest", "args called"]);
    expect(source.sources.rest.args).toHaveBeenCalledTimes(1);
    expect(source.sources.rest.args).toHaveBeenCalledWith(bind_state, params, endpoint);
  });

  it("should forward module call to rest on rest source on datasource", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let bind_state = { };
    let params = { some_param : 10 };
    let endpoint = { source : "rest"};
    source.sources.rest.module = jest.fn(() => "module called");
    expect(source.module("rest", ["rest", "parameters", "here"])).toStrictEqual("module called");
    expect(source.sources.rest.module).toHaveBeenCalledTimes(1);
    expect(source.sources.rest.module).toHaveBeenCalledWith("rest", "parameters", "here");
  });

  it("should apply defaults depending on source", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let endpoint = {};
    source.sources.rest.apply_defaults = jest.fn();
    source.infer_source = jest.fn(() => "rest");
    source.apply_defaults("myend", endpoint);
    expect(endpoint.source).toBe("rest");
    expect(source.infer_source).toHaveBeenCalledTimes(1);
    expect(source.infer_source).toHaveBeenCalledWith(endpoint);
    expect(source.sources.rest.apply_defaults).toHaveBeenCalledTimes(1);
    expect(source.sources.rest.apply_defaults).toHaveBeenCalledWith("myend", endpoint);
  });

  it("should infer source is rest when url or method is set", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let endpoint = { url : "someurl" };
    expect(source.infer_source(endpoint)).toBe("rest");
    endpoint = { method : "post" };
    expect(source.infer_source(endpoint)).toBe("rest");
  });

  it("should keep source when set", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let endpoint = { source : "somesource" };
    expect(source.infer_source(endpoint)).toBe("somesource");
  });

  it("should infer source is storage when scope or key is set", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let endpoint = { scope : "session" };
    expect(source.infer_source(endpoint)).toBe("storage");
    endpoint = { key : "something" };
    expect(source.infer_source(endpoint)).toBe("storage");
  });

  it("should infer source is wasm when func is set", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let endpoint = { func : "madelbro" };
    expect(source.infer_source(endpoint)).toBe("wasm");
  });

  it("should default to plugin default when unable to infer", () => {
    BindPlugin.config.default_source = "rest";
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm" });
    let endpoint = { };
    expect(source.infer_source(endpoint)).toBe("rest");
  });

  it("should use mock datasources when mock is set to true", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm", mock : true });
    expect(source.sources.rest).toBeInstanceOf(MockRestDataSource);
    expect(source.sources.storage).toBeInstanceOf(MockStorageDataSource);
    expect(source.sources.wasm).toBeInstanceOf(MockWebAssemblyDataSource);
  });

  it("should use selected mock datasources when mock is set to object", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm", mock : { rest: true, wasm: true } });
    expect(source.sources.rest).toBeInstanceOf(MockRestDataSource);
    expect(source.sources.storage).toBeInstanceOf(StorageDataSource);
    expect(source.sources.wasm).toBeInstanceOf(MockWebAssemblyDataSource);
  });

  it("should merge state and mutations from all datasources", () => {
    let source = new MultDataSource({ url: "myurl", storage : true, wasm : "app.wasm", });
    expect(source.state).toBeDefined();
    expect(source.state.cookies).toBeDefined();
    expect(source.state.url).toBeDefined();
    expect(source.state.headers).toBeDefined();
    expect(source.mutations).toBeDefined();
    expect(source.mutations.update_header).toBeDefined();
    expect(source.mutations.update_url).toBeDefined();
  });

});

describe("MockDataSource", () => {

  it("should set module", () => {
    let source = new MockDataSource({});
    expect(source.module).toBeDefined();
  });

  it("should have module that returns mock data in promise by default", () => {
    let source = new MockDataSource({});
    return expect(source.module({ endpoint : { mock :"hello" } })).resolves.toBe("hello");
  });

  it("should have module that is defined by transform", () => {
    let source = new MockDataSource({}, ({endpoint}) => endpoint.mock+"world");
    return expect(source.module({ endpoint : { mock :"hello" } })).resolves.toBe("helloworld");
  });

  it("should have module that returns mock data if defined", () => {
    let source = new MockDataSource({});
    return expect(source.module({ endpoint : { type : Array } })).resolves.toStrictEqual([]);
  });
})

describe("MockStorageDataSource", () => {
  it("should set the default transform", () => {
    let source = new MockStorageDataSource({});
    expect(source.module).toBeDefined();
    return expect(source.module({ endpoint : { mock : "mocked" } })).resolves.toBe("mocked");
  });
  it("should set cookie options", () => {
    let source = new MockStorageDataSource({});
    expect(source.state.cookies).toBeDefined();
    expect(source.state.cookies.expires).toBe(720000);
    expect(source.state.cookies.path).toBe("/");
  });
});

describe("MockWebAssemblyDataSource", () => {
  it("should set the default tranform", () => {
    let source = new MockWebAssemblyDataSource({});
    expect(source.module).toBeDefined();
    return expect(source.module({ endpoint : { mock : "mocked" } })).resolves.toBe("mocked");
  });
  it("should set wasm_file", () => {
    let source = new MockWebAssemblyDataSource({});
    expect(source.state.wasm_file).toBeDefined();
    expect(source.state.wasm_file).toBe("app.wasm");
  });
});
