import Bind from '@src/exports.js'
import BindPlugin from '@src/bind_plugin.js'
import BoundStore from '@src/bound_store.js'
import { SnakeCase, CamelCase } from '@src/naming.js'

jest.mock('@src/bound_store.js');

describe("Bind.Plugin", () => {
  it("should be BindPlugin", () => {
    expect(Bind.Plugin).toBe(BindPlugin);
  });
});

describe("Bind.Store", () => {
  it("should be BoundStore", () => {
    expect(Bind.Store).toBe(BoundStore);
  });
});


describe("Bind.Modules", () => {
  console.warn = jest.fn();
  let result = null;

  beforeEach(() => {
    console.warn.mockClear()
    result = null;
  });

  it("should create BoundStore configs for each config with bindings and namespace", () => {
    let configs = {
      one : {
        bindings  : { some_more_config : 10 },
        namespace : "one",
      },
      two : {
        bindings  : { some_more_config : 11 },
        namespace : "twons",
      },
      three : {
        bindings  : { some_more_config : 16 },
        namespace : "three",
      },
    };
    result = Bind.Modules(configs);
    expect(console.warn).toHaveBeenCalledTimes(0);
    expect(result).toStrictEqual({
      one   : expect.any(BoundStore),
      twons : expect.any(BoundStore),
      three : expect.any(BoundStore)
    });
  });

  it("should leave configs without namespace or bindings", () => {
    let configs = {
      one : {
        leave_me : "alone"
      },
      two : {
        me_too : "dont change",
      },
      three : {
        bindings  : { some_more_config : 16 },
        namespace : "three",
      },
    };
    result = Bind.Modules(configs);
    expect(console.warn).toHaveBeenCalledTimes(0);
    expect(result).toStrictEqual({
      one   : { leave_me : "alone" },
      two   : { me_too   : "dont change"},
      three : expect.any(BoundStore)
    });
  });

  it("should warn about configs with bindings but no namespace", () => {
    let configs = {
      one : {
        bindings : { whoops : "sie daisy"},
      },
      two : {
        bindings : { not_good : "bad" },
      },
      three : {
        bindings  : { some_more_config : 16 },
        namespace : "three",
      },
    };
    result = Bind.Modules(configs);
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith("Module one has bindings but is missing namespace");
    expect(console.warn).toHaveBeenCalledWith("Module two has bindings but is missing namespace");
    expect(result).toStrictEqual({
      one   : { bindings : { whoops : "sie daisy" } },
      two   : { bindings : { not_good : "bad"} },
      three : expect.any(BoundStore)
    });
  });

  it("should warn about configs with namespace but no bindings", () => {
    let configs = {
      one : {
        namespace : "one",
      },
      two : {
        namespace : "twons",
      },
      three : {
        bindings  : { some_more_config : 16 },
        namespace : "three",
      },
    };
    result = Bind.Modules(configs);
    expect(console.warn).toHaveBeenCalledTimes(2);
    expect(console.warn).toHaveBeenCalledWith("Module one has namespace but is missing bindings");
    expect(console.warn).toHaveBeenCalledWith("Module two has namespace but is missing bindings");
    expect(result).toStrictEqual({
      one   : { namespace : "one" },
      two   : { namespace : "twons" },
      three : expect.any(BoundStore)
    });
  });
});

describe("Bind.SnakeCase", () => {
  it("should be an instance of SnakeCase", () => {
    expect(Bind.SnakeCase()).toBeInstanceOf(SnakeCase);
  });
});

describe("Bind.CamelCase", () => {
  it("should be an instance of CamelCase", () => {
    expect(Bind.CamelCase()).toBeInstanceOf(CamelCase);
  });
});
