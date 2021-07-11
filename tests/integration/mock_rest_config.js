import { store_config } from './basic_rest_config.js'

export const plugin_config = {
  strict        : true,
  sources : {
    url  : "http://myapi.hppr.dev/api",
    mock : true,
  },
  endpoints : {
    users : {
      type : Array
    },
    user_data : {
      url       : "/user/data/",
      params    : {
        user_id : Number
      },
      mock : { some_user_data : "mock" },
    },
    login : {
      url       : "/login",
      method    : "post",
      params    : {
        username : String,
        password : String,
      },
      mock : { token : "12345fdsa" },
    },
    posts : {
      url    : "/post/",
      type   : Array,
      params : {
        date : String
      },
      mock : [
        {id: 1, text: "hello"},
        {id: 2, text: "world"},
        {id: 3, text: "foo"},
        {id: 4, text: "bar"}
      ],
    },
    post_meta : {
      url : "/post/meta",
      params : {
        ids : Array
      },
      mock : { post_meta_data : "mocked" },
    },
  }
};

export { store_config };
