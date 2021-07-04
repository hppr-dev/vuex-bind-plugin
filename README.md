# vuex-rest-bind-plugin

A vuex plugin that provides a link between your REST api and vuex state.

> Update your state, let me take care of the REST.
>      - vuex-rest-bind-plugin

# Overview

This plugin:
- Keeps page data up to date with REST data automatically
- Eliminates the need for additional code/logic when adding REST endpoints
- Provides an at-a-glance perspective of REST endpoints and state bindings
- Seperates component and REST state data

The link is established by configuring 2 parts of the plugin:
  1. REST endpoint definitions --> how to query REST endpoints
  2. Vuex store bindings --> how to store data for and from REST queries

# Installation

Install with npm

```
  npm install vuex-rest-bind-plugin
```

# Usage Overview


1. Define endpoints from which to pull data

```
// endpoint_config.js

export default {
  get_posts: {
    endpoint : "/posts",
    method   : "get", 
    params   : {
      user_id : Number,
      date    : Date, 
    }
  },
  create_post : {
    endpoint : "/posts",
    method   : "post",
    params   : {
      user_id : Number,
      text    : String,
    }
  }
}

2. Add binding information to your module store config

```
// user_store.js
import { BoundStore } from 'vuex-rest-bind-plugin'

export default BoundStore({
  state     : {...}
  mutations : {...}
  actions   : {...},
  bindings  : {
    posts : {
      type      : Array,
      bind_type : "watch",
      time      : 30000,
      endpoint  : "get_posts",
      params   : {
        user_id       : "user_id",
        selected_date : "date",
      },
    },
  }
})

```

3. Include the plugin with your vuex config:

```
import RestBindPlugin from 'vuex-rest-bind-plugin'
import user from './user_store.js'
import endpoints from './endpoint_config.js'

...

const vuex_config = {
  plugins   : [RestBindPlugin({url: "http://myapi", endpoints})],
  modules   : {
    user
  },
  state     : {...},
  mutations : {...},
  actions   : {...},
}
```

4. Use the state variables in your components:

```
<template>
  <div v-for="post in posts">
    <span> {{ post }} </span>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: "UserPosts",
  computed: {
    ...mapState("user", ["posts"])
  }
}
</script>

# Plugin Components

## bind module

The plugin automatically adds a module named "bind" to your store.
The module name can be changed using the `namespace` configuration value.
The bind module is responsible for holding and acting on the bound variables.

### Setting headers

Call `commit("bin/set_header", {key: "key", value: "value"})` to set custom request headers.
Note that these headers will be set on all requests coming from the bind module.

## BoundStore

### Custom state

### Custom mutations

### Custom actions

# Configuration

## Plugin Configuration

Defines how the plugin will function.

Plugin defaults:
```
const plugin = new RestBindPlugin({
  url       : "",
  headers   : { "Content-Type" : "application/json" },
  endpoints : {},
  namespace : "bind",
  update_prefix  : "update_",
  loading_prefix : "loading_",
  done_prefix    : "done_",
  load_prefix    : "load_",
  trigger_prefix : "trigger_",
});
```

| Config Key     | Default                                 | Description                                                             |
|----------------|-----------------------------------------|------------------------------------------------------                   |
| url            | ""                                      | Base endpoint url. Used as baseURL in axios query.                      |
| headers        | { "Content-Type" : "application/json" } | Request headers. Used as headers in axios query.                        |
| endpoints      | {}                                      | Endpoints config. See [Endpoint Configuration](#endpoint-configuration)  |
| namespace      | "bind"                                  | Namespace of the plugins "bind" store.                                  |
| update_prefix  | "update_"                               | Prefix of generated update mutations.                                   |
| loading_prefix | "loading_"                              | Prefix of generated loading mutations.                                  |
| done_prefix    | "loading_"                              | Prefix of generated done loading mutations.                             |
| load_prefix    | "load_",                                | Prefix of generated load actions.                                       | 

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
| params         | {},              | Endpoint parameters. See [Endpoint Parameters](#endpoint-parameters)                                                                              |
| get_url        | null,            | Url computation function. Use when parameters are needed in the url. When this is defined, the url setting is ignored.                            |
| headers        | null,            | Special headers to set for this request. These headers are added to the headers set in the plugin config and then used as headers in axios query. |

# Endpoint Parameters
params: { <API_NAME> : API_TYPE>

## Binding Configutation

Defines how to store endpoint data.

```
const bindings = {
  OUTPUT_NAME : {
    endpoint      : OUTPUT_NAME,
    bind_type     : "watch",
    param_map     : {},
    side_effect   : "",
    update        : null,
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
|  param_map     | null        | Parameter mapping. Defines which state variables to use as parameters to the api. See [Parameter Mapping](#parameter-mapping)                             |
|  side_effect   | ""          | The name of an action to call when REST data is commited to this binding. The action must be within the current namespace.                                 |
|  update        | null        | Function that takes (state, payload). Replaces the automatically generated update mutation.                                                                |
|  transform     | null        | Function that takes the (data) from the api and tranforms it before committing it to state.                                                                |
|  create_params | false       | Set to true to automatically create state variables for the parameters in the param_map.                                                                   |
|  loading       | false       | Set to true to create state variables that track when the data is being loaded                                                                             |
|  period        | 0           | Time interval in milliseconds to check for new api data. Only used for "watch" bindings                                                                    |

### Binding Types

#### watch

This binding periodically updates the data from the api.
How often this updates can be set with the "period" binding configuratino.
When a parameter in the state changes, the plugin automatically tries to pull data again.

#### trigger

This binding does not pull or push data until a trigger action is called.
The trigger action by default is "trigger_OUTPUT_NAME".
Set trigger_prefix in plugin options to change the prefix for the trigger action.

#### once

This binding only pulls the data once.
It is used by the other two actions, either periodically with watch or directly with trigger.
This action checks that parameters are set and then makes the request.
If any of the needed parameters are absent, no request takes place.

### Parameter Mapping

The default parameter mapping is to use the same names as the REST endpoint.
For example, if the endpoint has `params: {id: Number, text: String}` then the state should have `{ id: 0, text: "" }`.

Sometimes it may be necessary to name your state variables differently than what is in the endpoint parameters.
This is where the param_map setting comes in.
The param_map is in the format `{ STATE_VAR: ENDPOINT_PARAM }` and any missing parameters default to the endpoint parameter name.
For example, if the endpoint has `params: { id: Number, text: String }` and the binding has `{ param_map: { some_id: "id" } }` then the state should have `{ some_id: 0, text: "" }`.

