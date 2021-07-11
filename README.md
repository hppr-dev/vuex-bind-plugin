# vuex-bind-plugin

A vuex plugin that provides a link between outside data and your state.
In this context, outside data means any data that is not initially available to the application.
For example, outside data could be API endpoints, browser storage* or a WebAssembly binary*. 

*Future version

> Update your state, let me take care of the rest.
>      - vuex-bind-plugin


# Overview

This plugin:
- Watches your state and updates outputs based on state changes or action triggers
- Eliminates the need for additional code/logic when adding new sources of data
- Provides an at-a-glance perspective of which data is coming from where
- Seperates component and outside data

The link is established by configuring 2 parts of the plugin:
  1. Endpoints
  2. Bindings

Endpoints define a place where outside data is stored and what parameters are needed to retreive it.
An example of a rest endpoint:

```
export default { 
  get_user: {
    method: "get",
    url: "/users/",
    params: {
      id: Number
    }
    type : String,
  }
};
```

Bindings define the variables in the application state to store the parameters and resulting data.
An example of a rest binding to the previous endpoint:

```
const bindings = {
  current_user : {
    endpoint  : get_user,
    bind_type : "change",
  }
};
```

In the resulting configuration, once `$store.commit("update_id", 10)` is called, `$store.state.current_user` will be automatically updated with resource is returned by GETing /users/?id=10.
See [Usage Overview](#usage-overview) for a more in depth example.

# Installation

Install with npm*

```
  npm install vuex-bind-plugin
```

* Not uploaded to npm yet.

# Usage Overview


1. Define endpoints from which to pull data

```
// endpoint_config.js

export default {
  posts: {
    endpoint : "/posts",
    type     : Array,
    method   : "get", 
    params   : {
      user_id : Number,
      date    : Date, 
    }
  },
  create_post : {
    endpoint : "/posts",
    type     : Object,
    method   : "post",
    params   : {
      user_id : Number,
      text    : String,
    }
  }
}
```

2. Create a Bind.Store config with namespace and binding information to your module store config

```
// user_store.js

export default {
  namespace : "user",
  state     : {...},
  mutations : {...},
  actions   : {...},
  bindings  : {
    posts : {
      bind_type : "watch",
      time      : 30000,
    },
  }
};

```

3. Include the plugin with your vuex config:

```
import Bind from 'vuex-bind-plugin'
import user_store from './user_store.js'
import endpoints from './endpoint_config.js'

...

const vuex_config = {
  plugins   : [new Bind.Plugin({url: "http://myapi", endpoints})],
  modules   : Bind.Modules({
    user_store
  }),
  state     : {...},
  mutations : {...},
  actions   : {...},
}
```

4. Use the state variables in your components:

```
<template>
<div>
  <div v-for="post in posts">
    <span> {{ post }} </span>
  </div>
  <input :v-model="user_select" @update="update_user_id(user_select)" />
  <input :v-model="date_select" @update="update_date(date_select)" />
</div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: "UserPosts",
  data: () => ({
    user_select : 0,
    date_select : "",
  }),
  mounted: function() {
    this.$store.dispatch("user/start_bind");
  },
  computed: {
    ...mapState("user", ["posts"]),
    ...mapMutations("user", ["update_user_id", "update_date"])
  }
}
</script>
```

# Plugin Components

## bind namespace module

The plugin automatically adds a module named "bind" to your store.
The module name can be changed using the `namespace` configuration value.
The bind module is responsible for keeping track of current bindings and the parameters that trigger updates.

### Setting headers

Call `commit("bind/update_header", {key: "key", value: "value"})` to set custom request headers.
Note that these headers will be set on all requests coming from the bind module.

## Bind.Store

A Bind.Store generates state, mutations and actions for given bindings.
The configuration for Bind.Store is exactly the same as for a regular vuex store, but with two extra required fields:

- bindings  -- bindings configuration
- namespace -- Namespace of the store. Not to be confused with the namespaced vuex option.

vuex-bind-plugin requires Bind.Stores to be have a namespace.
The resulting configuration automatically sets namespaced to true, even if it is set to false in the Boundstore config.
An error will occur if namespace is not set or if a Bind.Store is initialized before the Bind.Plugin.

It is possible to configure the root store by setting the namespace to "":

```
import Vuex from "vuex"
import Bind from "vuex-bind-plugin"

var rootStore = new Vuex.Store(new Bind.Store({
  namespace : "",   //MUST BE SET
  plugins   : [new Bind.Plugin({ ... })],
  state     : {...},
  mutations : {...},
  actions   : {...},
  bindings  : {...},
  } 
);
```

### Generated state

Endpoint bindings require two pieces of state to be present: the output and the parameters.

The output is automatically created and you may choose to have endpoint parameters generated using the `create_params` binding config value.
Use `redirect : 'update_other_thing'` to redirect the output to another state variable.

A reason you may want to define the endpoint parameters is when you want to have specific default values.

The output and parameters types are defined in the endpoint config.

### Generated mutations

Each state variable must be able to be mutated.

When the state variables are generated, an `update_` mutation is created as well.

The prefix generated update mutations can be set using the update_prefix plugin config option.

### Generated actions

Every binding generates an action to be called to load its data.

By default, the `load_` action is defined to load "watch" and "once" bindings and `trigger_` actions are generated for "trigger" bindings.

These values can be changed with the `load_prefix` and `trigger_prefix` plugin config options.

A special "start_bind" action is also created to start loading data.

The "state_bind" action dispatches all of the load actions.

Only call this action once before the bindings are needed.

# Configuration

## Plugin Configuration

Defines how the plugin will function.

Plugin defaults:
```
const plugin = new Bind.Plugin({
  initial_state     : { url: "", headers :{ "Content-Type" : "application/json" },  
  endpoints         : {},
  namespace         : "bind",
  naming            : Bind.SnakeCase(),
  strict            : false,
  log_blocked_binds : false,
});
```

| Config Key     | Default                                 | Description                                                             |
|----------------|-----------------------------------------|-------------------------------------------------------------------------|
| initial_state  | { url: "", headers :{ "Content-Type" : "application/json" } | The inital state of the data source. See [Data Source](#data-source) |
| endpoints      | {}                                      | Endpoints config. See [Endpoint Configuration](#endpoint-configuration) |
| namespace      | "bind"                                  | Namespace of the plugins "bind" store.                                  |
| naming         | Bind.SnakeCase()                        | Naming scheme. See [Naming](#naming)                                    |
| strict         | false                                   | Check types where possible and log them to the console. Use in development only |
| log_blocked_binds         | false                                   | Log when a bind was triggered, but not commited because of unset parameters. Use in development only |


## Data Sources

The intial_state is used when initializing the data source.
By default, the plugin uses the rest data source, which takes an object in the form:
```
{
  url     : "http://api_url", // Base url of all requests
  headers : request_headers   // Request headers for requests
}
```
In most cases, setting the url in the initial_state will be all you need.

### Using Mock Data

Mock data can be built in to your endpoint definitions by including a mock_data field.

```
const endpoints = {
  posts: {
    endpoint : "/posts",
    type     : Array,
    method   : "get", 
    params   : {
      user_id : Number,
      date    : Date, 
    },
    mock_data : ["my first post", "my second post", "my third post" ]
  },
}
```

To return the mock data instead of querying the data source set `mock : true` in initial_state.

```
import { MockRestDataSource } from "vuex-bind-plugin"

const plugin = new Bind.Plugin({
  ...
  initial_state : { mock : true }
});
```

If more complex logic is needed for mock data, include a `transform` function in the inital_state.

```
import { query_mock_data } from "vuex-bind-plugin"

const endpoints = {
  posts: {
    endpoint : "/posts",
    type     : Array,
    method   : "get", 
    params   : {
      user_id : Number,
      date    : Date, 
    },
    mock_data : ({ user_id }) => ({
      "fred" : ["fred's first post", "fred is da best"],
      "ben"  : ["ben is da benst", "who wants a taco?"],
      "julia": ["can anyone pet sit?", "hey it's julia"]
    }[user_id])
  },
}

const plugin = new Bind.Plugin({
  initial_state : { 
    mock: true ,
    transform : query_mock_data, 
  },
  endpoints : endpoints
});
```

`query_mock_data` is a utility function that passes param data into the mock_data function of your endpoint.

A custom function may also be used for the transform.
The tranform function is passed an object with `endpoint`, and `input_params` fields.
The `endpoint` is a reference to the endpoint definition, and `input_params` are the current parameter values that would have been pulled from the state.
SA tranform to return the calculated params could be written as `tranform : ({ input_params }) => input_params`.

## Naming

The names of generated mutations, and actions are fully configurable.
Use the `naming` option to specify which naming scheme to use.
The two included schemes are `Bind.SnakeCase` and `Bind.CamelCase`.

The naming scheme only affects the generated portions of the vuex config and not configuration values associated with the plugin.
Care has been taken to not use multi-word options, but when they do show up they will be in snake case.

### Why snake_case default?

Short Answer: It's easier: `prefix + '_' + name` requires less computation than `prefix + name.slice(0,1).toUpperCase() + name.slice(1)`.

It's also what is used internally in the plugin.
Actions, mutations, etc in snake case also separates them from regular functions.
It further drives home the idea that we are working with strings with dispatch and commit.
That being said, naming conventions are project/personal specific, so the configuration is left to the user.

### camelCase

To use camelCase for actions, mutations, etc use the `Bind.CamelCase()` setting in the naming option:

```
import Bind from 'vuex-bind-plugin'

const plugin = Bind.Plugin({
  ...
  naming : Bind.CamelCase(),
})
```

### Custom naming scheme

Naming schemes are fully customizable.
The schemes use prefixes to distinguish between generated actions.
Schemes have the following prefixes available which default to the string of their name (i.e. update defaults to "update"):

- update  -> prefix for the mutations to update values
- load    -> prefix for the actions load in data from endpoints
- loading -> prefix for the loading state and mutations
- done    -> prefix for the done mutation
- trigger -> prefix for the trigger actions for trigger bindings

The scheme also defines `start` which defines the main action name for starting the binding.
It defaults to start_bind for snake case or startBind for camel case.

These values can be changed to whatever is desired by modifying the instance in the naming optino:

```
import Bind from "vuex-bind-plugin"

const naming = Bind.CamelCase();

naming.prefixes.update  = "mutate";
naming.prefixes.loading = "pulling";
naming.prefixes.trigger = "activate";
naming.start = "begin"

const plugin = Bind.Plugin({
  naming,
  ...
});

const bindings = {
/**
  * Generated Mutations:
  *                        CamelCase default
  * - mutateCustom      |  updateCustom
  * - mutateId          |  updateId
  * - pullingCustom     |  loadingCustom
  * - donePullingCustom |  doneLoadingCustom
  *
  * Generated Actions:
  * - activateCustom    |  triggerCustom
  * - begin             |  startBind      
**/
  custom : {
    bind_type : "trigger",
    loading   : true,
    params    : {
      id : Number
    },
    create_params : true
  }
};
```

## Endpoint Configuration

### General Endpoints

Endpoints define where data will be retreived from.

Endpoints are data source specific, so the endpoint format may differ between different data sources.

Regardless of data sources the `type` and params` fields are available on all endpoints:
```
const endpoints = {
  ENDPOINT_NAME : {
    type    : Object,
    params  : {},
  }
}
```

| Config Key     | Default          | Description                                                                                                                                       |
|----------------|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| type           | Object           | Type of object returned in the responses data                                                                                                     |
| params         | {}               | Endpoint parameters. See [Endpoint Parameters](#endpoint-parameters)                                                                              |

### Endpoint Parameters

Endpoint parameters are set as an object in the form:

```
params : {
  name : TYPE_OR_MATCHER
}
```

Where the `name` is the parameter name used in the request and `type` is the type of object.

Typically the type will be one of `String`, `Array`, `Number` or simply `Object` (which will match just about anything).
Custom classes may also be able to be used.

The types of these parameters are used to generate default values of parameters when they are stored in the state. See [Default Values](#default-values)

The `strict` plugin config option may also be set to ensure that the values being sent are of the specified type.
If a variable that does not match a parameter type is provided and the `strict` option is set a warning will show on the console.
This option should only be set in the development environment.

### Default Values

Default values are retreived from the type given for the parameter or binding.

For built in types the default value is `Array()`,`Number()`, `Object()`, etc.
This value is also inferred to be the parameter in "unset" state.

### Parameter Matchers

The plugin comes with utility functions to "match" values to parameters.
For ease of understanding they are available in the match object.

The match object provides the following parameter matchers:

```
import { match } from 'vuex-bind-plugin'
const params = {
  id     : match.PositiveNumber()     // Matches any positive number or 0
  cost   : match.NegativeNumber()     // Matches any negative number or 0
  lat    : match.NumberRange(50,56)   // Matches a number with the given range. Inclusive, 50 and 56 would match.
  coords : match.ArrayLength(2)       // Matches any array with the given length
  dict   : match.ObjectKeys(["key"] ) // Matches any object with the given keys
  extra  : match.All("hello")         // Matches everything. Sets the default to the given value.
  bits   : match.AnythingBut("world") // Matches everything except for the given value
};
```

To create custom matchers, create a function that returns an object with two fields: `is_set` and `default`.

The `is_set` function is used to determine whether a parameter is set or not.
The `default` value is used as the default value for the parameter.

For example to match a number greater than 10 define:
```
const greater_than_ten = () => ({
  is_set : (value) => value > 10,
  default : 0,
})
```

And use it in your endpoint parameters like:
```
const params = {
  value : greater_than_ten,
}
```

### Rest Endpoints

Rest endpoints require extra fields pertaining to request configuration:

```
const endpoints = {
  ENDPOINT_NAME : {
    url     : "/ENDPOINT_NAME",
    method  : "get",
    get_url : undefined,
    headers : undefined,
    type    : Object,
    params  : {},
  }
}
```

| Config Key     | Default          | Description                                                                                                                                       |
|----------------|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| url            | "/ENDPOINT_NAME" | Endpoint url. Used as url in axios query.                                                                                                         |
| method         | "get"            | REST method. Used as method in axios query.                                                                                                       |
| get_url        | null             | Url computation function. Use when parameters are needed in the url. When this is defined, the url setting is ignored.                            |
| headers        | null             | Special headers to set for this request. These headers are added to the headers set in the plugin config and then used as headers in axios query. |
| type           | Object           | See [General Endpoints](#general-endpoints)                                                                                                     |
| params         | {}               | See [Endpoint Parameters](#endpoint-parameters)                                                                              |

### Storage Endpoints

Storage endpoints define keys in browser storage that are accessed and bound into state.

```
const endpoints = {
  ENDPOINT_NAME : {
    key     : "ENDPOINT_NAME",
    scope   : "local",
    type    : String,
  }
}
```

| Config Key     | Default            | Description                                                                               |
|----------------|--------------------|-------------------------------------------------------------------------------------------|
| key            | "ENDPOINT_NAME"    | Storage key, what the value is stored under                                               |
| scope          | "local"            | Storage scope, one of "local", "session" or "cookie"                                      |
| type           | String             | See [General Endpoints](#general-endpoints)                                               |

Note: params are not used/required.

A standard definition of a storage endpoint may look something like:

```
const endpoints = {
  token   : { scope : "cookie" },
  user_id : { scope : "local" },
  static :  { scope : "session" },
}
```


### WebAssembly Endpoints

```
const endpoints = {
  ENDPOINT_NAME : {
    func_name : "ENDPOINT_NAME",
    order     : [],
    type      : Object,
    params    : {},
  }
}
```

| Config Key     | Default          | Description                                                                                                                                       |
|----------------|------------------|------------------------------------------------------|
| func_name | "ENDPOINT_NAME" | WebAssembly function name                                  |
| order     | []              | Ordering of arguments to the function call                 |
| type      | Object          | See [General Endpoints](#general-endpoints)                |
| params    | {}              | See [Endpoint Parameters](#endpoint-parameters)            |

## Binding Configuration

Defines how to store endpoint data.

```
const bindings = {
  OUTPUT_NAME : {
    endpoint      : OUTPUT_NAME,
    bind_type     : "once",
    param_map     : {},
    side_effect   : "",
    redirect      : "",
    transform     : null,
    create_params : false,
    loading       : false,
    period        : 0,
  },
});
```

| Config Key     | Default     | Description                                                                                                                                                |
|----------------|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
|  endpoint      | OUTPUT_NAME | Name of the endpoint to bind to. Should match an entry in endpoint configs. Defaults to the name of the output variable.                                   |
|  bind_type     | "once"     | Binding type. One of "watch", "trigger", or "once". See [Binding Types](#binding-types)                                                                    |
|  param_map     | {}        | Parameter mapping. Defines which state variables to use as parameters to the api. See [Parameter Mapping](#parameter-mapping)                              |
|  side_effect   | N/A          | The name of an action to call when REST data is commited to this binding. The action must be within the current namespace.                                 |
|  redirect      | N/A          | Redirects the output to another mutation. Instead of updating the data in OUTPUT_NAME, commit the data here.                                               |
|  transform     | N/A        | Function that takes the (data) from the api and tranforms it before committing it to state.                                                                |
|  create_params | false       | Set to true to automatically create state variables for the parameters in the param_map.                                                                   |
|  loading       | false       | Set to true to create state variables that track when the data is being loaded                                                                             |
|  period        | N/A           | Time interval in milliseconds to check for new api data. Only used for "watch" bindings                                                                    |

### Binding Types

#### watch

Use when data and input data change.

This binding periodically updates the data from the api.
How often this updates can be set with the "period" binding configuratino.
When a parameter in the state changes, the plugin automatically tries to pull data again.

#### trigger

Use when you want to control when data is sent or retrieved.

This binding does not pull or push data until a trigger action is called.
The trigger action by default is "trigger_OUTPUT_NAME".
Set trigger_prefix in plugin options to change the prefix for the trigger action.

An example of a trigger action would be posting data to the api.
In this case, your application would be responsible for populating the parameters state data.
When the binding is triggered the parameters' data would be taken from the state and pushed to the api.

#### once

Use when both data and input data are set values.

This binding only pulls the data once.
It is used by the other two actions, either periodically with watch or directly with trigger.
This action checks that parameters are set and then makes the request.
If any of the needed parameters are absent, no request takes place.

#### change

Use when data only changes based on parameters.

Much like watch bindings, the parameters to the endpoint are tracked, but the API is not polled.
Instead, output data is only updated when input parameters are changed.

### Parameter Mapping

The default parameter mapping is to use the same names as the API endpoint.
For example, if the endpoint has `params: {id: Number, text: String}` then the state should have `{ id: 0, text: "" }`.

Sometimes it may be necessary to name your state variables differently than what is in the endpoint parameters.
This is where the param_map setting comes in.

The param_map is in the format `{ STATE_VAR: ENDPOINT_PARAM }` and any missing parameters default to the endpoint parameter name.

For example, if the endpoint has `params: { id: Number, text: String }` and the binding has `{ param_map: { some_id: "id" } }` then the state should have `{ some_id: 0, text: "" }`.

# Webpack

*Not Implemented Yet*

## Preevaluating Bind.Stores

By default, Bind.Stores are evaluated at run time in the user's browser.
This is nice for development, but in production these are extra cycles that we don't need to happen at runtime.

Since Bind.Stores evaluate to Vuex store configurations, it is possible to pre-load this configuration for the user.
In other words, in the development environment we have:

```
const boundstore = new Bind.Store({
  namespace : "mystore",
  state     : {...},
  getters   : {...},
  mutations : {...},
  actions   : {...},
  bindings  : {...},
})

const store = new Vuex.Store({
  ...
  modules : {
    ...boundstore
  }
});
```

But in production we want to skip the transformation step and have:

```
const boundstore = {
  state     : {...},
  getters   : {...},
  mutations : {...},
  actions   : {...},
}

const store = new Vuex.Store({
  ...
  modules : {
    "mystore" : boundstore,
  },
});
```

For this we can add the `vuex-bind-plugin-loader` to our webpack or vue.config.js file to precompile Bind.Stores.

```
// vue.config.js
import { vuex-bind-plugin-loader } from 'vuex-bind-plugin'
...

TODO

// webpack.config

TODO
```


## Removing mock data

The additional `mock_data` can be excluded when building for production by adding `remove_mock_data` rule to your vue or webpack config.

```
// vue.config.js
import { remove_mock_data } from 'vuex-bind-plugin'
...

TODO

// webpack.config

TODO
```
