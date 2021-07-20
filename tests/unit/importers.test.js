import BindPlugin from '@src/bind_plugin.js'
import { test_plugin_config } from './test-utils.js'
import { mapBindings, mapBindingsWithLoading, mapParams, mapLoadActions, mapTriggerActions, syncParams } from '@src/importers.js'

beforeAll(() => {
  BindPlugin.config = test_plugin_config;
});

afterAll(() => {
  BindPlugin.config = undefined
});

describe("mapBindings", () => {
  let mapped = { ...mapBindings("weather", ["water", "rain"])};
  it("should create properties for each state variable", () => {
    expect(mapped.water).toBeDefined();
    expect(mapped.rain).toBeDefined();
  });
  it("should get state from store", () => {
    let new_this = {
      $store : {
        state : {
          weather : {
            water : "little",
            rain  : "lots",
          }
        }
      }
    };
    expect(mapped.water.bind(new_this)()).toBe("little");
    expect(mapped.rain.bind(new_this)()).toBe("lots");
  });
});

describe("mapBindingsWithLoading", () => {
  let mapped = { ...mapBindingsWithLoading("stock", ["price", "symbol"])};
  it("should create properties", () => {
    expect(mapped.price).toBeDefined();
    expect(mapped.symbol).toBeDefined();
  });
  it("should get state from store", () => {
    let new_this = {
      $store : {
        state : {
          stock : {
            price : 100,
            loading_price : false,
            symbol : "",
            loading_symbol : true,
          }
        }
      }
    };
    expect(mapped.price.bind(new_this)().value).toBe(100);
    expect(mapped.price.bind(new_this)().loading).toBe(false);
    expect(mapped.symbol.bind(new_this)().value).toBe("");
    expect(mapped.symbol.bind(new_this)().loading).toBe(true);
  });
});

describe("mapParams", () => {
  it("should be the same thing as mapBindings", () => {
    expect(mapParams).toStrictEqual(mapBindings);
  });
});

describe("mapLoadActions", () => {
  let mapped = { ...mapLoadActions("city", ["park", "road", "lamp"]) };
  it("should create load methods", () => {
    expect(mapped.park).toBeDefined();
    expect(mapped.road).toBeDefined();
    expect(mapped.lamp).toBeDefined();
  });
  it("should create methods that call store.dispatch with current naming scheme", () => {
    let new_this = {
      $store : {
        dispatch : jest.fn(),
      }
    };
    mapped.park.bind(new_this)();
    expect(new_this.$store.dispatch).toHaveBeenCalledTimes(1);
    expect(new_this.$store.dispatch).toHaveBeenCalledWith("city/load_park");
  });
});

describe("mapTriggerActions", () => {
  let mapped = { ...mapTriggerActions("zoo", ["walrus", "deer", "lamp"]) };
  it("should create load methods", () => {
    expect(mapped.walrus).toBeDefined();
    expect(mapped.deer).toBeDefined();
    expect(mapped.lamp).toBeDefined();
  });
  it("should create methods that call store.dispatch with current naming scheme", () => {
    let new_this = {
      $store : {
        dispatch : jest.fn(),
      }
    };
    mapped.deer.bind(new_this)();
    expect(new_this.$store.dispatch).toHaveBeenCalledTimes(1);
    expect(new_this.$store.dispatch).toHaveBeenCalledWith("zoo/trigger_deer");
  });
});

describe("syncParams", () => {
  let synced = { ...syncParams("trek", ["picard", "data", "tuvok"]) };
  it("should create computed properties for each state variable", () => {
    expect(synced.picard).toBeDefined();
    expect(synced.data).toBeDefined();
    expect(synced.tuvok).toBeDefined();
  });
  it("should get data from local state", () => {
    let new_this = {
      $store : {
        state : {
          trek : {
            picard : "engage"
          }
        }
      }
    };
    expect(synced.picard.get.bind(new_this)()).toBe("engage");
  });
  it("should commit data to store", () => {
    let new_this = {
      $store : {
        commit : jest.fn()
      }
    };
    synced.picard.set.bind(new_this)("warp engines offline");
    expect(new_this.$store.commit).toHaveBeenCalledTimes(1);
    expect(new_this.$store.commit).toHaveBeenCalledWith("trek/update_picard", "warp engines offline");
  });
});

describe("assume_ns_vars", () => {
  let mapped = { ...mapBindings(["potato", "beets", "carrot"]) };
  it("should allow root state variable to be passed in instead of namespace", () => {
    expect(mapped.potato).toBeDefined();
    expect(mapped.beets).toBeDefined();
    expect(mapped.carrot).toBeDefined();
  });
  it("should pull from root store state", () => {
    let new_this = {
      $store : {
        state : {
          potato: "patata"
        }
      }
    };
    expect(mapped.potato.bind(new_this)()).toBe("patata");
  });
});
