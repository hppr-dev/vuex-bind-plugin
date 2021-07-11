import { Naming, SnakeCase, CamelCase } from '@src/naming.js'

describe("Naming", () => {
  it("should have prefixes", () => {
    let n = new Naming();
    expect(n.prefixes).toBeDefined();
  });
});

describe("SnakeCase", () => {
  it("should name things in snake_case", () => {
    let n = new SnakeCase();
    expect(n.update("hello")).toBe("update_hello");
    expect(n.load("hello")).toBe("load_hello");
    expect(n.loading("hello")).toBe("loading_hello");
    expect(n.done("hello")).toBe("done_loading_hello");
    expect(n.trigger("hello")).toBe("trigger_hello");
  });

  it("should have changable prefixes", () => {
    let n = new SnakeCase();
    n.prefixes.update = "upd"
    n.prefixes.load = "lo"
    n.prefixes.loading = "ling"
    n.prefixes.done = "do"
    n.prefixes.trigger = "tr"
    expect(n.update("hello")).toBe("upd_hello");
    expect(n.load("hello")).toBe("lo_hello");
    expect(n.loading("hello")).toBe("ling_hello");
    expect(n.done("hello")).toBe("do_ling_hello");
    expect(n.trigger("hello")).toBe("tr_hello");
  });
});

describe("CamelCase", () => {
  it("should name things in camelCase", () => {
    let n = new CamelCase();
    expect(n.update("hello")).toBe("updateHello");
    expect(n.load("hello")).toBe("loadHello");
    expect(n.loading("hello")).toBe("loadingHello");
    expect(n.done("hello")).toBe("doneLoadingHello");
    expect(n.trigger("hello")).toBe("triggerHello");
  });
});
