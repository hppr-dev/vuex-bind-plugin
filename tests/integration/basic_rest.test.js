import BlackBox from "./blackbox.js"
import { scenarios, resolve_data } from './basic_rest_config.js'
import Bind from "@src/exports.js"

for ( let [ name, plugin_config, store_config ] of scenarios ) {

  describe(`basic scenario with ${name}`, () => {
  
    let bb = new BlackBox({
      plugin_config, 
      store_config,
      resolve_data
    });
  
    bb.mock_axios();
  
    beforeEach(() => {
      bb.module.mockClear();
    });
  
    it("should start bindings when start bind is called", () => {
      bb.input_state("profile", {
        users: [],
      });
      return bb.dispatch("profile/start_bind").then( () => {
        return bb.output_state("profile", {
          users : resolve_data["/users/"].data
        });
      });
    });
  
    it("should trigger login", () => {
      bb.input_state("profile", {
        username : "james",
        password : "brond",
        token    : ""
      });
      return bb.dispatch("profile/trigger_login").then( () => {
        return bb.output_state("profile", {
          username : "james",
          password : "",
          token    : "somesecuritytoken"
        });
      });
    });
  
    it("shouldn't trigger login when username is blank", () => {
      bb.input_state("profile", {
        username : "",
        password : "brond",
        token    : {}
      });
      return bb.dispatch("profile/trigger_login").then( () => {
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
      bb.dispatch("profile/trigger_posts").then( () => {
        return bb.output_state("profile", { 
          date : "2020-01-02",
          post_meta_data : resolve_data["/post/meta"].data,
          post_ids : [1,2],
          posts: resolve_data["/post/"].data,
        });
      });
    });
  
    describe("After start_bind has been called", () => {
  
      it("should call get data when selected_user_id is updated", () => {
        bb.input_state("profile", {
          user_data : {}
        }); 
        return bb.dispatch("profile/start_bind").then( () => {
          bb.commit("profile/update_selected_user_id", 10);
          return bb.output_state("profile", {
            user_data : resolve_data["/user/data/"].data
          });
        });
      });
    });
  });

}
