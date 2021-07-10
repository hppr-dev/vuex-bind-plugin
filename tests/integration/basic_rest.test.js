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
    bb.input_state("profile", {
      users: {}
    });
    bb.dispatch("profile/start_bind");
    return bb.output_state("profile", {
      users : resolve_data["/users/"].data
    });
  });

  it("should trigger login", () => {
    bb.input_state("profile", {
      username : "james",
      password : "brond",
      token    : ""
    });
    bb.dispatch("profile/trigger_login");
    return bb.output_state("profile", {
      username : "james",
      password : "",
      token    : "somesecuritytoken"
    });
  });

  it("shouldn't trigger login when username is blank", () => {
    bb.input_state("profile", {
      username : "",
      password : "brond",
      token    : {}
    });
    bb.dispatch("profile/trigger_login");
    return bb.output_state("profile", {
      username : "",
      password : "brond",
      token    : {}
    })
  });

  it("should trigger posts and then pull post_meta data", () => {
    bb.input_state("profile", {
      date : "2020-01-02" 
    });
    bb.dispatch("profile/trigger_posts");
    return bb.output_state("profile", { 
      date : "2020-01-02",
      post_meta_data : resolve_data["/post/meta"].data,
      post_ids : [1,2],
      posts: resolve_data["/post/"].data,
    });
  });

  describe("After start_bind has been called", () => {
    bb.dispatch("profile/start_bind");

    it("should call get data when selected_user_id is updated", () => {
      bb.input_state("profile", {
        user_data : {}
      }), 
      bb.commit("profile/update_selected_user_id", 10);
      return bb.output_state("profile", {
        user_data : resolve_data["/user/data/"].data
      });
    });
  });
});
