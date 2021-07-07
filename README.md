# vuex-bind-plugin

A vuex plugin that provides a link between your API and vuex state.

> Update your state, let me take care of the rest.
>      - vuex-bind-plugin

# Overview

This plugin:
- Keeps page data up to date with API data automatically
- Eliminates the need for additional code/logic when adding API endpoints
- Provides an at-a-glance perspective of api endpoints and state bindings
- Seperates component and api state data

The link is established by configuring 2 parts of the plugin:
  1. Api endpoint definitions --> how to query api endpoints
  2. Vuex store bindings --> how to store data for and from api queries

More generally, this plugin provides the functionality to automatically update state data based on other state variables.

The operation works by watching for commits to input parameters and when one is changed:
1. Check input parameters
2. If any parameters are unset, don't do anything
3. Otherwise, get data and place it back into the store

# Installation

Install with npm

```
  npm install vuex-bind-plugin
```

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

2. Create a BoundStore with namespace and binding information to your module store config

```
// user_store.js
import BoundStore from 'vuex-bind-plugin'

export default new BoundStore({
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
});

```

3. Include the plugin with your vuex config:

```
import BindPlugin from 'vuex-bind-plugin'
import user from './user_store.js'
import endpoints from './endpoint_config.js'

...

const vuex_config = {
  plugins   : [new BindPlugin({url: "http://myapi", endpoints})],
  modules   : {
    ...user
  },
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
  <input :v-model="date_select" @update="update_date(daye_select)" />
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
    this.$store.dispatch("user/bind");
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
The bind module is responsible for keeping track of current bindings and parameters being watched.

### Setting headers

Call `commit("bin/set_header", {key: "key", value: "value"})` to set custom request headers.
Note that these headers will be set on all requests coming from the bind module.

## BoundStore

A BoundStore generates state, mutations and actions for the given bindings.
The configuration for BoundStore is exactly the same as for a regular vuex store, but with two extra required fields:

- bindings  -- bindings configuration
- namespace -- Namespace of the store. Not to be confused with the namespaced vuex option.

vuex-bind-plugin requires BoundStores to be namespaced.
The resulting configuration automatically sets namespaced to true, even if it is set to false in the Boundstore config.
To configure the root vuex store set namespace to "".
An error will occur if namespace is not set.

```
import Vuex from "vuex"
import { BindPlugin, BoundStore } from "vuex-bind-plugin"

var rootStore = new Vuex.Store(new BoundStore({
  plugins   : [new BindPlugin({ namespace: "my_bind_store", ... })],
  state     : {...},
  mutations : {...},
  actions   : {...},
  namespace : "",   //MUST BE SET
  bindings  : {...},
  } 
);
```

### Generated state

Endpoint bindings require two pieces of state to be present: the output and the parameters.
The output is always defined by bindings, but you may choose to have endpoint parameters generated using the `create_params` binding config value.
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
const plugin = new BindPlugin({
  initial_state  : { url: "", headers :{ "Content-Type" : "application/json" },  
  endpoints      : {},
  camelCase      : false,
  namespace      : "bind",
  update_prefix  : "update_",
  loading_prefix : "loading_",
  done_prefix    : "done_",
  load_prefix    : "load_",
  trigger_prefix : "trigger_",
  strict         : true,
});
```

| Config Key     | Default                                 | Description                                                             |
|----------------|-----------------------------------------|-------------------------------------------------------------------------|
| initial_state  | { url: "", headers :{ "Content-Type" : "application/json" } | The inital state of the data source. See [Data Source](#data-source) |
| endpoints      | {}                                      | Endpoints config. See [Endpoint Configuration](#endpoint-configuration) |
| namespace      | "bind"                                  | Namespace of the plugins "bind" store.                                  |
| camelCase      | false                                   | Use camelCase instead of snake_case. (Not implemented yet)              |
| update_prefix  | "update_"                               | Prefix of generated update mutations.                                   |
| loading_prefix | "loading_"                              | Prefix of generated loading mutations.                                  |
| done_prefix    | "done_"                                 | Prefix of generated done loading mutations.                             |
| load_prefix    | "load_"                                 | Prefix of generated load actions.                                       | 
| trigger_prefix | "trigger_"                              | Prefix of generated trigger actions.                                    |
| strict         | false                                   | Check types where possible and log them to the console. Use in development only |

## Data Source

The intial_state is used to initialize the state of the data source.
It is used when initializing the data source from which data is pulled.
By default, the plugin uses the built in rest data source, which takes an object with url and header fields.
In most cases, setting the url in the initial_state will be all you need.

### Mocking the default datasource

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

const plugin = new BindPlugin({
  ...
  initial_state : { mock : true }
});
```

If more complex logic is needed for mock data, include a `transform` function in the inital_state.

```
import { MockRestDataSource } from "vuex-bind-plugin"

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

const plugin = new BindPlugin({
  initial_state : { 
    mock: true ,
    transform : ({endpoint, input_params}) => endpoint.mock_data(input_params) 
  },
  endpoints : endpoints
});
```

The tranform function is passed an object with `endpoint`, and `input_params` fields.
The `endpoint` is a reference to the endpoint definition, `input_params` are the current parameter values.

The additional `mock_data` can be excluded when building for production by adding `remove_mock_data` rule to your vue or webpack config.

```
// vue.config.js
import { remove_mock_data } from 'vuex-bind-plugin'
...

TODO write example

// webpack.config

TODO write example
```

## Endpoint Configuration

Defines what endpoints are available to use.

Endpoint defaults:
```
const endpoints = {
  ENDPOINT_NAME : {
    url     : "/ENDPOINT_NAME",
    method  : "get",
    type    : Object,
    params  : {},
    get_url : null,
    headers : null,
  }
}
```

| Config Key     | Default          | Description                                                                                                                                       |
|----------------|------------------|---------------------------------------------------------------------------------------------------------------------------------------------------|
| url            | "/ENDPOINT_NAME" | Endpoint url. Used as url in axios query.                                                                                                         |
| method         | "get"            | REST method. Used as method in axios query.                                                                                                       |
| type           | Object           | Type of object returned in the responses data                                                                                                     |
| params         | {}               | Endpoint parameters. See [Endpoint Parameters](#endpoint-parameters)                                                                              |
| get_url        | null             | Url computation function. Use when parameters are needed in the url. When this is defined, the url setting is ignored.                            |
| headers        | null             | Special headers to set for this request. These headers are added to the headers set in the plugin config and then used as headers in axios query. |

# Endpoint Parameters

Endpoint parameters are set as an object in the form:

```
params : {
  name : type
}
```

Where the `name` is the parameter name used in the request and `type` is the type of object.

Typically the type will be one of `String`, `Array`, `Number` or simply `Object` (which will match just about anything).
Custom classes may also be able to be used.

The types of these parameters are used to generate default values of the parameters when they are stored in the state.
If another default value is desired, you will need to set the `create_params` option to false in your binding config.

The `check_type` plugin config option may also be set to ensure that the values being sent are of the specified type.
If a variable that does not match a parameter type is provided and the `check_types` option is set then a warning will show on the console.
This option should only be set in the development environment.

## Binding Configutation

Defines how to store endpoint data.

```
const bindings = {
  OUTPUT_NAME : {
    endpoint      : OUTPUT_NAME,
    bind_type     : "watch",
    param_map     : {},
    side_effect   : "",
    redirect      : "",
    transform     : null,
    create_params : false,
    loading       : false,
    period          : 0,
  },
});
```

| Config Key     | Default     | Description                                                                                                                                                |
|----------------|-------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|
|  endpoint      | OUTPUT_NAME | Name of the endpoint to bind to. Should match an entry in endpoint configs. Defaults to the name of the output variable.                                   |
|  bind_type     | "watch"     | Binding type. One of "watch", "trigger", or "once". See [Binding Types](#binding-types)                                                                    |
|  param_map     | null        | Parameter mapping. Defines which state variables to use as parameters to the api. See [Parameter Mapping](#parameter-mapping)                              |
|  side_effect   | ""          | The name of an action to call when REST data is commited to this binding. The action must be within the current namespace.                                 |
|  redirect      | ""          | Redirects the output to another mutation. Instead of updating the data in OUTPUT_NAME, commit the data here.                                               |
|  transform     | null        | Function that takes the (data) from the api and tranforms it before committing it to state.                                                                |
|  create_params | false       | Set to true to automatically create state variables for the parameters in the param_map.                                                                   |
|  loading       | false       | Set to true to create state variables that track when the data is being loaded                                                                             |
|  period        | 0           | Time interval in milliseconds to check for new api data. Only used for "watch" bindings                                                                    |

### Binding Types

#### watch

Use when API data and input data change.

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

Use when both API data and input data are set values.

This binding only pulls the data once.
It is used by the other two actions, either periodically with watch or directly with trigger.
This action checks that parameters are set and then makes the request.
If any of the needed parameters are absent, no request takes place.

#### on_change

Use when API data only changes based on parameters.

Much like watch bindings, the parameters to the endpoint are tracked, but the API is not polled.
Instead, output data is only updated when input parameters are changed.

### Parameter Mapping

The default parameter mapping is to use the same names as the API endpoint.
For example, if the endpoint has `params: {id: Number, text: String}` then the state should have `{ id: 0, text: "" }`.

Sometimes it may be necessary to name your state variables differently than what is in the endpoint parameters.
This is where the param_map setting comes in.
The param_map is in the format `{ STATE_VAR: ENDPOINT_PARAM }` and any missing parameters default to the endpoint parameter name.
For example, if the endpoint has `params: { id: Number, text: String }` and the binding has `{ param_map: { some_id: "id" } }` then the state should have `{ some_id: 0, text: "" }`.

