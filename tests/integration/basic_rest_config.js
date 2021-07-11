export const plugin_config = {
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
};

export const resolve_data = {
    '/users/'     : { data : ["jenkins", "flores", "jamie"] },
    '/user/data/' : { data : { updates : ["updated this", "at a partaay"] , friend_ids : [1,2,3] } },
    '/login'      : { data : { token : "somesecuritytoken" }},
    '/post/'      : { data : [ { id: 1, text : "let me tell you about"}, { id: 2, text : "dinosaurs are the best" } ] },
    '/post/meta'  : { data : { date_created : "100BC", likes : 0, shares : 1 }},
};

export const store_config = {
  profile_store : {
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
        bind_type : "trigger",
        redirect  : "update_token",
        create_params : true,
      },
      user_data : {
        bind_type : "watch",
        period    : 10000,
        param_map : {
          selected_user_id : "user_id",
        },
      },
      users : {
        bind_type : "once"
      },
      posts : {
        bind_type     : "trigger",
        create_params : true,
        redirect      : "update_posts_and_meta_ids",
        side_effect   : "trigger_post_meta_data",
      },
      post_meta_data : {
        endpoint  : "post_meta",
        bind_type : "trigger",
        param_map : {
          post_ids : "ids"
        },
      }
    }
  }
};
