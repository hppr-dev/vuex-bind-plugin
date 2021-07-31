import BlackBox from "./blackbox.js"
import { plugin_config, store_config } from './mock_rest_config.js'
import Bind from "@src/exports.js"

describe("mocked rest scenario", () => {

  let bb = new BlackBox({
    plugin_config, 
    store_config
  });

  bb.spy_module();

  beforeEach(() => {
    bb.dispatch("bind/reset");
  });

  it("should start bindings when start bind is called", () => {
    bb.input_state("profile", {
      users: ["something","here"]
    });
    return bb.dispatch("profile/start_bind").then( () => {
      return bb.output_state("profile", {
        users : []
      });
    });
  });

  it("should trigger login", () => {
    bb.input_state("profile", {
      username : "james",
      password : "brond",
      token    : ""
    });
    bb.dispatch("profile/trigger_login").then( () => {
      return bb.output_state("profile", {
        username : "james",
        password : "",
        token    : "12345fdsa"
      });
    });
  });

  it("should reject and not trigger login when username is blank", () => {
    bb.input_state("profile", {
      username : "",
      password : "brond",
      token    : {}
    });
    return bb.dispatch("profile/trigger_login").catch( () => {
      return bb.output_state("profile", {
        username : "",
        password : "brond",
        token    : {}
      });
    });
  });

  it("should trigger posts and then pull post_meta data", () => {
    bb.input_state("profile", {
      date : "2020-01-02" 
    });
    return bb.dispatch("profile/trigger_posts").then( () => {
      return bb.output_state("profile", { 
        date : "2020-01-02",
        post_meta_data : { post_meta_data : "mocked" },
        post_ids : [1,2,3,4],
        posts : [
          {id: 1, text: "hello"},
          {id: 2, text: "world"},
          {id: 3, text: "foo"},
          {id: 4, text: "bar"}
        ],
      });
    });
  });

  describe("After start_bind has been called", () => {

    it("should call get data when selected_user_id is updated", () => {
      bb.dispatch("profile/start_bind");
      bb.input_state("profile", {
        user_data : { some : "data" }
      }), 
      bb.commit("profile/update_selected_user_id", 10);
      return bb.output_state("profile", {
        user_data : { some_user_data : "mock" },
      });
    });
  });
});
