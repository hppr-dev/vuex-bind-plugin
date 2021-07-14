
export const scenarios = [
[
  "endpoints in plugin config",
  { // Plugin Config
    strict        : true,
    sources : {
      url : "http://myapi.hppr.dev/api",
    },
    endpoints : {
      users : {
        type : Array
      },
      user_data : {
        url       : "/user/data/",
        params    : {
          user_id : Number
        }
      },
      login : {
        url       : "/login",
        method    : "post",
        params    : {
          username : String,
          password : String,
        },
      },
      posts : {
        url    : "/post/",
        type   : Array,
        params : {
          date : String
        }
      },
      post_meta : {
        url : "/post/meta",
        params : {
          ids : Array
        }
      }
    }
  },
  { // Store Config
    profile : {
      namespace : "profile",
      state     : {
        selected_user_id : 0,
        posts    : [],
        post_ids : [],
        post_meta_data : {},
        token    : [],
      },
      mutations : {
        update_selected_user_id : ( state, value ) => state.selected_user_id = value,
        update_posts_and_meta_ids : ( state, posts ) => {
          state.posts = posts;
          state.post_ids = posts.map((p) => p.id);
        },
        update_token : (state, data) => {
          state.token = data.token;
          state.password = "";
        },
      },
      bindings : {
        login : {
          bind : "trigger",
          redirect  : "update_token",
          create_params : true,
        },
        user_data : {
          bind : "watch",
          period    : 10000,
          param_map : {
            selected_user_id : "user_id",
          },
        },
        users : {
          bind : "once"
        },
        posts : {
          bind     : "trigger",
          create_params : true,
          redirect      : "update_posts_and_meta_ids",
          side_effect   : "trigger_post_meta_data",
        },
        post_meta_data : {
          endpoint  : "post_meta",
          bind : "trigger",
          param_map : {
            post_ids : "ids"
          },
        }
      }
    }
  },
],[
  "endpoints in store config",
  { // Plugin Config
    strict        : true,
    sources : {
      url : "http://myapi.hppr.dev/api",
    },
  },
  { // Store Config
    profile : {
      namespace : "profile",
      state     : {
        selected_user_id : 0,
        posts    : [],
        post_ids : [],
        post_meta_data : {},
        token    : [],
      },
      endpoints : {
        users : {
          type : Array
        },
        user_data : {
          url       : "/user/data/",
          params    : {
            user_id : Number
          }
        },
        login : {
          url       : "/login",
          method    : "post",
          params    : {
            username : String,
            password : String,
          },
        },
        posts : {
          url    : "/post/",
          type   : Array,
          params : {
            date : String
          }
        },
        post_meta : {
          url : "/post/meta",
          params : {
            ids : Array
          }
        }
      },
      mutations : {
        update_selected_user_id : ( state, value ) => state.selected_user_id = value,
        update_posts_and_meta_ids : ( state, posts ) => {
          state.posts = posts;
          state.post_ids = posts.map((p) => p.id);
        },
        update_token : (state, data) => {
          state.token = data.token;
          state.password = "";
        },
      },
      bindings : {
        login : {
          bind : "trigger",
          redirect  : "update_token",
          create_params : true,
        },
        user_data : {
          bind : "watch",
          period    : 10000,
          param_map : {
            selected_user_id : "user_id",
          },
        },
        users : {
          bind : "once"
        },
        posts : {
          bind     : "trigger",
          create_params : true,
          redirect      : "update_posts_and_meta_ids",
          side_effect   : "trigger_post_meta_data",
        },
        post_meta_data : {
          endpoint  : "post_meta",
          bind : "trigger",
          param_map : {
            post_ids : "ids"
          },
        }
      }
    }
  },
],[
  "endpoints in bindings config",
  { // Plugin Config
    strict        : true,
    sources : {
      url : "http://myapi.hppr.dev/api",
    },
  },
  { // Store Config
    profile : {
      namespace : "profile",
      state     : {
        selected_user_id : 0,
        posts    : [],
        post_ids : [],
        post_meta_data : {},
        token    : [],
      },
      mutations : {
        update_selected_user_id : ( state, value ) => state.selected_user_id = value,
        update_posts_and_meta_ids : ( state, posts ) => {
          state.posts = posts;
          state.post_ids = posts.map((p) => p.id);
        },
        update_token : (state, data) => {
          state.token = data.token;
          state.password = "";
        },
      },
      bindings : {
        login : {
          bind : "trigger",
          redirect  : "update_token",
          create_params : true,
          endpoint : {
            url       : "/login",
            method    : "post",
            params    : {
              username : String,
              password : String,
            },
          },
        },
        user_data : {
          bind : "watch",
          period    : 10000,
          param_map : {
            selected_user_id : "user_id",
          },
          endpoint : {
            url       : "/user/data/",
            params    : {
              user_id : Number
            }
          },
        },
        users : {
          endpoint : {
            type : Array
          },
          bind : "once"
        },
        posts : {
          bind     : "trigger",
          create_params : true,
          redirect      : "update_posts_and_meta_ids",
          side_effect   : "trigger_post_meta_data",
          endpoint : {
            url    : "/post/",
            type   : Array,
            params : {
              date : String
            }
          },
        },
        post_meta_data : {
          endpoint  : "post_meta",
          bind : "trigger",
          param_map : {
            post_ids : "ids"
          },
          endpoint : {
            url : "/post/meta",
            params : {
              ids : Array
            }
          }
        }
      }
    }
  }
],
]


export const resolve_data = {
    '/users/'     : { data : ["jenkins", "flores", "jamie"] },
    '/user/data/' : { data : { updates : ["updated this", "at a partaay"] , friend_ids : [1,2,3] } },
    '/login'      : { data : { token : "somesecuritytoken" }},
    '/post/'      : { data : [ { id: 1, text : "let me tell you about"}, { id: 2, text : "dinosaurs are the best" } ] },
    '/post/meta'  : { data : { date_created : "100BC", likes : 0, shares : 1 }},
};
