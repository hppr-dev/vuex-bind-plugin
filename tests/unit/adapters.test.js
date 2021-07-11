import { storage_adapter, wasm_adapter } from "@src/adapters.js"

describe("storage_adapter", () => {
  let storage_get = jest.spyOn(Storage.prototype, "getItem");
  let storage_set = jest.spyOn(Storage.prototype, "setItem");

  beforeEach(() => {
    storage_get.mockClear();
    storage_set.mockClear();
  });

  it("should set cookies", () => {
    return expect(storage_adapter("mycookie", "myvalue", String, "cookie", { expires : 10000, path : "/"})).resolves.toBe("myvalue").then(() => {
      expect(document.cookie).toBe("mycookie=myvalue");
    });
  });

  it("should remove cookies when value is null", () => {
    document.cookie = "mycookie=in_cookies;expires=100000000;path='/'";
    return expect(storage_adapter("mycookie", null, String, "cookie", { expires : 10000, path : "/"})).resolves.toBe("").then(() => {
      expect(document.cookie).toBe("");
    });
  })

  it("should get cookies", () => {
    document.cookie = "mycookie=in_cookies;expires=100000000;path='/'";
    return expect(storage_adapter("mycookie", "", String, "cookie")).resolves.toBe("in_cookies").then(() => {
    });
  });

  it("should set to local storage", () => {
    return expect(storage_adapter("local_key", "local_value", String, "local")).resolves.toBe("local_value").then(() => {
      expect(storage_set).toHaveBeenCalledTimes(1);
      expect(storage_set).toHaveBeenCalledWith("local_key","local_value");
    });
  });

  it("should get from local storage", () => {
    localStorage.setItem("local_get_key", "in_local");
    return expect(storage_adapter("local_get_key", "", String, "local")).resolves.toBe("in_local").then(() => {
      expect(storage_get).toHaveBeenCalledTimes(1);
      expect(storage_get).toHaveBeenCalledWith("local_get_key");
    });
  });

  it("should set to session storage", () => {
    return expect(storage_adapter("session_key", "session_value", String, "session")).resolves.toBe("session_value").then(() => {
      expect(storage_set).toHaveBeenCalledTimes(1);
      expect(storage_set).toHaveBeenCalledWith("session_key","session_value");
    });
  });

  it("should get from session storage", () => {
    console.log("sessom");
    sessionStorage.setItem("session_get_key", "in_session");
    return expect(storage_adapter("session_get_key", "", String, "session")).resolves.toBe("in_session").then(() => {
      expect(storage_get).toHaveBeenCalledTimes(1);
      expect(storage_get).toHaveBeenCalledWith("session_get_key");
    });
  });
});

describe("wasm_adapter", () => {
  it("should throw an error", () => {
    expect(() => wasm_adapter()).toThrow("not supported");
  });
});
