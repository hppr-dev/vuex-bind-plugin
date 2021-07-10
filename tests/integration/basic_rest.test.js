import BlackBox from "./blackbox.js"
import { plugin_config, store_config, resolve_data } from './basic_rest_config.js'
import Bind from "@src/exports.js"

describe("basic scenario", () => {

  let bb = new BlackBox({
    plugin_config, 
    store_config,
    resolve_data
  });

  beforeEach(() => {
    bb.axios.mockClear();
  });

  it("should start bindings when start bind is called", () => {
    bb.dispatch("profile/start_bind");
    expect(bb.axios).toHaveBeenCalledTimes(1);
    expect(bb.axios).toHaveBeenCalledWith({
      method  : "get",
      baseURL : "http://myapi.hppr.dev/api",
      url     : "/users/",
      data    : {},
      params  : {},
      headers : { "Content-Type" : "application/json" }
    });
    return bb.axios.mock.results[0].value.then(() => {
      expect(bb.state.profile.users).toStrictEqual(resolve_data["/users/"].data);
    });
  });

  it("should trigger login", () => {
    bb.state.profile.username = "james";
    bb.state.profile.password = "brond";
    bb.dispatch("profile/trigger_login");
    expect(bb.axios).toHaveBeenCalledTimes(1);
    expect(bb.axios).toHaveBeenCalledWith({
      method  : "post",
      baseURL : "http://myapi.hppr.dev/api",
      url     : "/login",
      data    : { username : "james", password : "brond" },
      params  : {},
      headers : { "Content-Type" : "application/json" }
    });
    return bb.axios.mock.results[0].value.then(() => {
      expect(bb.state.profile.login).toStrictEqual(resolve_data["/login"].data);
    });
  });

  describe("After start_bind has been called", () => {
    bb.dispatch("profile/start_bind");

    it("should call get data when selected_user_id is updated", () => {
      bb.commit("profile/update_selected_user_id", 10);
      expect(bb.axios).toHaveBeenCalledTimes(2);
      expect(bb.axios).toHaveBeenLastCalledWith({
        method  : "get",
        baseURL : "http://myapi.hppr.dev/api",
        url     : "/user/data/",
        data    : {},
        params  : { user_id : 10 },
        headers : { "Content-Type" : "application/json" },
      });
      jest.advanceTimersByTime(10001);
      expect(bb.axios).toHaveBeenCalledTimes(3);
      expect(bb.axios).toHaveBeenLastCalledWith({
        method  : "get",
        baseURL : "http://myapi.hppr.dev/api",
        url     : "/user/data/",
        data    : {},
        params  : { user_id : 10 },
        headers : { "Content-Type" : "application/json" },
      });
      return bb.axios.mock.results[0].value.then(() => {
        expect(bb.state.profile.user_data).toStrictEqual(resolve_data["/user/data/"].data);
      });
    });
  });
});
