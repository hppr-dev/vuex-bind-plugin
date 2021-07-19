import {
  reverse_map,
  map_endpoint_types,
  is_unset,
  match,
  is_type_match,
  get_default,
  lookup_mock,
  apply_binding_defaults,
 } from '@src/utils.js'

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

  it("should return empty object when both parameters are undefined", () => {
    expect(map_endpoint_types()).toStrictEqual({});
  });

  it("should return empty object when parameters are undefined", () => {
    expect(map_endpoint_types({something : 1})).toStrictEqual({});
  });
});

describe("is_unset", () => {

  it("should be true if value is {} and Object", () => {
    expect(is_unset({}, Object)).toBe(true);
  });

  it("should be false if value is something and Object", () => {
    expect(is_unset({something : 1 }, Object)).toBe(false);
  });

  it("should be true if value is 0 and Number", () => {
    expect(is_unset(0, Number)).toBe(true);
  });

  it("should be false if value is not 0 and Number", () => {
    expect(is_unset(1, Number)).toBe(false);
    expect(is_unset(10, Number)).toBe(false);
    expect(is_unset(-1, Number)).toBe(false);
  });

  it("should be true if value is [] and Array", () => {
    expect(is_unset([], Array)).toBe(true);
  });

  it("should be false if value is something and Array", () => {
    expect(is_unset(["something"], Array)).toBe(false);
  });

  it("should be false if value is All", () => {
    expect(is_unset(null, match.All())).toBe(false);
    expect(is_unset(0, match.All())).toBe(false);
    expect(is_unset([], match.All())).toBe(false);
    expect(is_unset({}, match.All())).toBe(false);

    expect(is_unset({ something : 1}, match.All())).toBe(false);
    expect(is_unset([1,2,3,4], match.All())).toBe(false);
    expect(is_unset(10, match.All())).toBe(false);
  });

  it("should match PositiveNumber",() => {
    expect(is_unset(1, match.PositiveNumber())).toBe(false);
    expect(is_unset(100, match.PositiveNumber())).toBe(false);
    expect(is_unset(1.2, match.PositiveNumber())).toBe(false);
    expect(is_unset(-1, match.PositiveNumber())).toBe(true);
    expect(is_unset(-500.4, match.PositiveNumber())).toBe(true);
  });

  it("should match NegativeNumber",() => {
    expect(is_unset(-10, match.NegativeNumber())).toBe(false);
    expect(is_unset(-100, match.NegativeNumber())).toBe(false);
    expect(is_unset(-1.05, match.NegativeNumber())).toBe(false);
    expect(is_unset(1, match.NegativeNumber())).toBe(true);
    expect(is_unset(6.13, match.NegativeNumber())).toBe(true);
  });

  it("should match NumberRange",() => {
    expect(is_unset(2, match.NumberRange(1,10))).toBe(false);
    expect(is_unset(4, match.NumberRange(1,10))).toBe(false);
    expect(is_unset(6, match.NumberRange(1,10))).toBe(false);
    expect(is_unset(-1, match.NumberRange(1,10))).toBe(true);
    expect(is_unset(-100, match.NumberRange(1,10))).toBe(true);
  });

  it("should match ArrayLength",() => {
    expect(is_unset([], match.ArrayLength(3))).toBe(true);
    expect(is_unset([1, 2, 3], match.ArrayLength(3))).toBe(false);
    expect(is_unset([1, 2, 3, 4], match.ArrayLength(3))).toBe(true);
  });

  it("should match ObjectKeys",() => {
    expect(is_unset({}, match.ObjectKeys(["hello", "world", "foo"]))).toBe(true);
    expect(is_unset({hello: 1}, match.ObjectKeys(["hello", "world", "foo"]))).toBe(true);
    expect(is_unset({hello: 1, world: "heng", foo: null }, match.ObjectKeys(["hello", "world", "foo"]))).toBe(false);
  });

  it("should match AnythingBut", () => {
    expect(is_unset({}, match.AnythingBut("hello"))).toBe(false);
    expect(is_unset("hello", match.AnythingBut("hello"))).toBe(true);
    expect(is_unset({}, match.AnythingBut(0))).toBe(false);
    expect(is_unset(10, match.AnythingBut(0))).toBe(false);
  });

  it("should default to true", () => {
    expect(is_unset({}, undefined)).toBe(true);
  });

  it("should support booleans", () => {
    expect(is_unset(true, Boolean)).toBe(false);
    expect(is_unset(false, Boolean)).toBe(false);
    expect(is_unset(null, Boolean)).toBe(true);
  });

});

describe("is_type_match", () => {

  it("should match Array, Object, Number and String types", () => {
    expect(is_type_match([], Array)).toBe(true);
    expect(is_type_match([1,2,3,4], Array)).toBe(true);

    expect(is_type_match({}, Object)).toBe(true);
    expect(is_type_match({hello:1}, Object)).toBe(true);

    expect(is_type_match(1, Number)).toBe(true);

    expect(is_type_match("", String)).toBe(true);
    expect(is_type_match("foobar", String)).toBe(true);
  });

  it("should match match.(types)", () => {
    expect(is_type_match([], match.ArrayLength(3))).toBe(true);
    expect(is_type_match([1,2,3,4], match.ArrayLength(3))).toBe(true);

    expect(is_type_match({}, match.ObjectKeys(["hello"]))).toBe(true);
    expect(is_type_match({world:10}, match.ObjectKeys(["hello"]))).toBe(true);

    expect(is_type_match(11, match.NumberRange(0,10))).toBe(true);
    expect(is_type_match(5, match.NumberRange(0,10))).toBe(true);
  });

  it("should not match Array, Object, Number and String types", () => {
    expect(is_type_match({}, Array)).toBe(false);
    expect(is_type_match(1, Array)).toBe(false);

    expect(is_type_match("hello", Number)).toBe(false);
    expect(is_type_match({}, Number)).toBe(false);

    expect(is_type_match([], String)).toBe(false);
    expect(is_type_match({}, String)).toBe(false);
  });

  it("should not match match.(types)", () => {
    expect(is_type_match({}, match.ArrayLength(3))).toBe(false);
    expect(is_type_match({hello:0}, match.ArrayLength(3))).toBe(false);

    expect(is_type_match([1,2,3,4], match.ObjectKeys(["hello"]))).toBe(false);
    expect(is_type_match("dingdong", match.ObjectKeys(["hello"]))).toBe(false);

    expect(is_type_match([1,2,3,4,5,6], match.NumberRange(0,10))).toBe(false);
    expect(is_type_match({hello: "yoyo"}, match.NumberRange(0,10))).toBe(false);
  });
});

describe("get_default", () => {

  it("should get default for Array, Object, Number and String types", () => {
    expect(get_default(Array)).toStrictEqual(Array());
    expect(get_default(Object)).toStrictEqual(Object());
    expect(get_default(String)).toStrictEqual(String());
    expect(get_default(Number)).toStrictEqual(Number());
  });

  it("should get defaults for match.(types)", () => {
    expect(get_default(match.PositiveNumber())).toBe(-1);
    expect(get_default(match.NegativeNumber())).toBe(1);
    expect(get_default(match.NumberRange(50,56))).toBe(49);
    expect(get_default(match.ArrayLength(2))).toStrictEqual(Array());
    expect(get_default(match.ObjectKeys())).toStrictEqual(Object());
    expect(get_default(match.All("hello"))).toBe("hello");
    expect(get_default(match.AnythingBut("world"))).toBe("world");
  });
});

describe("lookup_mock", () => {

  it("should pull data from endpoint mock data", () => {
    let endpoint = { mock_data : ({x, y}) => x * y }
    let input_params = {x : 10, y: 12 };
    expect(lookup_mock({ endpoint, input_params })).toBe(120);
    input_params.x = 11;
    input_params.y = 66;
    expect(lookup_mock({ endpoint, input_params })).toBe(726);
  });

});

describe("apply_binding_defaults", () => {

  it("should apply binding_defaults", () => {
    let binding = {};
    apply_binding_defaults("ENDPOINT_NAME", binding);
    expect(binding.endpoint).toBe("ENDPOINT_NAME");
    expect(binding.bind).toBe("once");
    expect(binding.param_map).toStrictEqual({});
    expect(binding.create_params).toBe(true);
  })

  it("should keep binding_values", () => {
    let binding = {
      bind : "watch",
      endpoint  : "somethingelse",
      redirect  : "update_something",
      period    : 10000,
      param_map : { one : "two" },
      create_params : false,
    };
    apply_binding_defaults("ENDPOINT_NAME", binding);
    expect(binding.endpoint).toBe("somethingelse");
    expect(binding.bind).toBe("watch");
    expect(binding.param_map).toStrictEqual({ one : "two" });
    expect(binding.period).toBe(10000);
    expect(binding.redirect).toBe("update_something");
    expect(binding.create_params).toBe(false);
  })
})
