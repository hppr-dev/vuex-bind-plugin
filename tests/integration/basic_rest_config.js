export const plugin_config = {
  strict        : true,
  initial_state : {
    url : "http://myapi.hppr.dev/api",
  },
  endpoints : {
    users : {}, //default endpoint
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
    }
  }
};

export const store_config = {
  profile_store : {
    namespace : "profile",
    state     : {
      selected_user_id : 0,
    },
    mutations : {
      update_selected_user_id : ( state, value ) => state.selected_user_id = value,
    },
    bindings : {
      login : {
        bind_type : "trigger",
        create_params : true,
      },
      user_data : {
        bind_type : "watch",
        period    : 10000,
        param_map : {
          selected_user_id : "user_id",
        }
      },
      users : {
        bind_type : "once"
      }
    }
  }
};
