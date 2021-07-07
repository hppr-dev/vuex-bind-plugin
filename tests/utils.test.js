import { reverse_map, map_endpoint_types } from '../src/utils.js'

describe("reverse_map", () => {
  it("should create a map that values are keys and keys are values", () => {
    let results = reverse_map({
      hello: "world",
      foo: "bar",
    });
    expect(results.bar).toBe("foo");
    expect(results.world).toBe("hello");
  });
});

describe("map_endpoint_types", () => {
  it("should return parameter definitions when param map is empty", () => {
    let results = map_endpoint_types({}, {id: Number, user: String});
    expect(results).toStrictEqual({id: Number, user: String});
  });
  
  it("should return partial parameter definitions when param map does not have a mapping", () => {
    let results = map_endpoint_types({ user_id : "id" }, {id: Number, user: String});
    expect(results).toStrictEqual({user_id: Number, user: String});
  });
  
  it("should return parameters mapped using param_map", () => {
    let results = map_endpoint_types({ user_id : "id", username: "user" }, {id: Number, user: String});
    expect(results).toStrictEqual({user_id: Number, username: String});
  });
});
