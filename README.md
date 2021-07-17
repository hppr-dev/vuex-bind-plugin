# vuex-bind-plugin

A vuex plugin that provides a link between outside data and application state.
In this context, outside data refers to any data that is not initially available to the application.
For example, outside data could be API endpoints, or a WebAssembly binary*. 

*Future version

> Update your state, let me take care of the rest.
>      - vuex-bind-plugin


# Overview

This plugin:
- Watches your state and updates outputs based on state changes or action triggers
- Eliminates the need for additional code/logic when adding new sources of data
- Provides an at-a-glance perspective of which data is coming from where
- Seperates component and outside data

The link is established by configuring 2 parts:
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
    endpoint  : "get_user",
    bind      : "change",
  }
};
```

In the resulting configuration, once `$store.commit("update_id", 10)` is called, `$store.state.current_user` will be automatically updated with the resource that is returned by GETing /users/?id=10.
See [Usage Overview](#usage-overview) for a more in depth example.

# Installation

Install with npm

```
  npm install vuex-bind-plugin
```


# Usage Overview


1. Define endpoints

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

2. Create a store with namespace and bindings information

```
// user_store.js

export default {
  namespace : "user",
  state     : {...},
  mutations : {...},
  actions   : {...},
  bindings  : {
    posts : {
      bind : "watch",
      time : 30000,
    },
  }
};

```

3. Configure the plugin

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

4. Use the state variables as normal

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

## bind module store

The plugin automatically creates a module store with the namespace "bind".
This module is responsible for keeping track of current bindings and the parameters that trigger updates.
It does this by maintaining a list of parameters that other pieces of state depend on.

The bind module also holds state variables used by the data source.
For instance, the rest datasource adds url and headers state variables to the bind module.
To update these values use the update mutations for them: i.e. `commit("update_headers", { key : "Authorization", value: "sometoken" }`.

The module name can be changed using the `namespace` plugin configuration value.

## Store modules

Store modules refer to the custom module stores that define the state, getters, mutations, actions, and bindings of the application.
These are the modules that are passed to `Bind.Modules` in the Vuex.Store config.
When `Bind.Modules` is called each module store is inspected for bindings and namespace fields and if they have them they are made into `Bind.Store`s.
Otherwise, the module store is imported as-is.

The configuration for Bind.Store is exactly the same as for a regular vuex store, but with two extra required fields:

- bindings  -- binding configuration for the store module. See [Binding Configuration](#binding-configuration)
- namespace -- Namespace of the module. Not to be confused with the namespaced vuex option.

and one optional field:

- endpoints -- module endpoint configuration. See [Organizing Endpoints and Bindings](#organizing-endpoints-and-bindings).

An error will occur if namespace is not set or if a Bind.Store is initialized before the Bind.Plugin.

It is possible to configure the root store as a Bind.Store by setting the namespace to "":

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

A `Bind.Store` generates state, mutations and actions for each of the given bindings.
See [Binding Configuration](#binding-configuration) for information on configuring bindings.

### Generated state

Endpoint bindings require two pieces of state: the output and the parameters.

The output is automatically created.
Parameters can be created in the module state, or automatically with `create_params : true`.

Note that when parameters are manually created in module state, they will also need update mutations created matching the current [naming scheme](#naming).

For example using the default naming:
```
export default {
  state : {
    user_id : 0
  },
  mutations : {
    update_user_id : (state, value) => ... // Required
  },
  bindings : {
    posts : {
      bind      : "once",
      endpoint  : "posts",
      param_map : {
        user_id : 'id',
      },
    }
  }
}
```

The output can also be changed to modify another state variable by redirecting the output.
Use `redirect : 'update_other_thing'` to commit to the update_other_thing mutation instead of updating the output state variable.

The starting value of outputs and parameters in the state are defined as the default value of their defined type.
See [Default Type Values](#default-type-values).

### Generated mutations

Each state variable must be able to be mutated.

When the state variables are generated, an `update_` mutation is created as well.

The prefix for generated update mutations can be set by modifying the [naming scheme](#naming).

### Generated actions

Every binding generates an action to be called to load its data.

By default, the `load_` action is defined to load "watch" and "once" bindings and `trigger_` actions are generated for "trigger" bindings.

A special `"start_bind"` action is also created to intialize binding and load binding data.
Only call this action once.

The name of the start_bind action, as well as the prefixes for the load and trigger actions, can be set by modifying the [naming scheme](#naming).

# Configuration

## Default Configuration

Default values are used extensively in the configuration of bindings and endpoints.
The aim of this is to make configuring bindings and endpoints as simple and concise as possible.
Keep in mind that most configuration options have default values that are automatically filled by store configuration.

For example:

```
const plugin = Bind.Plugin({
  ...
  endpoints : {
    users : {
      url    : "/users/",
      method : "get",
      params : {
        group : String,
      },
    }
  }
});

const bindings = {
  users : {
    bind          : "once",
    endpoint      : "users",
    create_params : true,
  }
}
```

Could also be written as:

```
const plugin = Bind.Plugin({...}); // Endpoint moved to bindings

const bindings = {
  users : {
    endpoint : {
      params : {
        group : String,
      },
    },
    create_params : true,
  }
};
```

It is up to the user to decide which defaults will be declared implicitly for the sake of configuration clarity.

## Plugin Configuration

Defines how the plugin will function.

Plugin configuration defaults:
```
const plugin = new Bind.Plugin({
  sources           : { ... },  
  endpoints         : {},
  namespace         : "bind",
  naming            : Bind.SnakeCase(),
  strict            : false,
  default_source    : "rest",
  log_blocked_binds : false,
});
```

| Config Key     | Default                                 | Description                                                             |
|----------------|-----------------------------------------|-------------------------------------------------------------------------|
| sources        | {...}                                   | Configuration for data sources. See [Data Sources](#data-sources)         |
| endpoints      | {}                                      | Endpoints config. See [Endpoint Configuration](#endpoint-configuration) |
| namespace      | "bind"                                  | Namespace of the plugin's "bind" store.                                  |
| naming         | Bind.SnakeCase()                        | Naming scheme. See [Naming](#naming)                                    |
| strict         | false                                   | Check types where possible and log them to the console. Use in development only |
| default_source | "rest"                                  | The default source to use when the endpoint source can't be inferred. See [Inferring Source](#inferring-source) |
| log_blocked_binds         | false                                   | Log when a bind was triggered, but not commited because of unset parameters. Use in development only |


### Data Sources

The plugin does not use any data source by default.
You will need to add configuration values to the sources option to enable them.
Each data source has it's own keys in the sources option.

Sources keys:

| Key   | Type | Data Source | Description |
|=======|======|=============|=============|
| url   | String | "rest"    | the base url to query for data |
| headers | Object | "rest"  | the initial headers for requests to the data |
| wasm    | String | "wasm"  | the path to the wasm file to load |
| custom  | Class  | ...     | See [Custom Data Sources](#custom-data-sources) |

Inlude the `url` option to configure the rest data source.
You may also configure headers for your requests here.
```
{
  url : "http://api_url", // Base url of rest requests
  headers : some_headers, // Optional request headers
}
```

Include the `wasm` option to configure the WebAssembly data source.
```
{
  wasm : "application.wasm" // url of the wasm file to load
}
```

For example, the following snippet configures all three:

```
const plugin = Bind.Plugin({
  sources : {
    url     : "http://my_api",
    wasm    : "functions.wasm",
  }
  ...
});
```

#### Custom Data Sources

To create a custom data source include the `custom` field in the `sources` plugin option.
The value should be a custom data source that extends the DataSource class below.

```
export class DataSource {
  // module    = (data) => Promise.resolve(data)         -- Must be defined by subclass
  // args      = (state, params, endpoint) => [ params ] -- Must be defined by subclass
  assign    = (response) => response;

  state     = {};
  mutations = {};

  constructor(state) {
    this.state = state;
  }

  apply_defaults(name, endpoint) {
    endpoint.params = endpoint.params? endpoint.params : {};
    endpoint.type = endpoint.type? endpoint.type : Object;
  }
}
```

##### Queries

The data source describes the 3 parts of pulling data from an endpoint:

1. Creating the arguments to the module -- args
2. Calling the module                   -- module
3. Assigning the data back to state     -- assign


`module` returns a promise that resolves to the data to commit to state.
The arguments to module are calculated by calling the datasource's `args` function.

`args` parses the bind state, parameters, and endpoint data to create the arguments for the module call.
It returns an Array which is used as the arguments to the datasource's `module` function.
The `args` function takes three arguments in the following order:

  1. state    -- The state store of the bind module
  2. params   -- The parameters computed from the state
  3. endpoint -- The endpoint definition

`assign` transforms the data from the module to the format that will be stored in state.

Basically, the data source is called as `module(...args(bind_state, params, endpoint))then((data) => commit(output, assign(data)))`.

##### State, Mutations, and Defaults

A data source's `apply_defaults` function is used to apply the default endpoint options to it's endpoints.

The data source's `state` and `mutations` properties are added to the bind module's store, so they can be used in the module's queries.

##### Example

```
import { DataSource } from 'vuex-bind-plugin'

class WaiterDataSource extends DataSource {
  module = (greeting, person, data) => Promise.resolve(`${greeting} ${person}, ${JSON.stringify(data)}`)

  args   = (bind_state, params, endpoint) => [
    bind_state.greeting,
    endpoint.person
    params,
  ]

  constructor() {
    super({ greeting : "hello" });
    this.mutations.update_greeting = (state, value) => state.greeting = value;
  }

  apply_defaults(name, endpoint) {
    super.apply_defaults(name, endpoint);
    endpoint.person = endpoint.person ?? name;
  }
}

const plugin = new Bind.Plugin({
  sources : {
    custom : { 
      "waiter" : WaiterDataSource 
    },
  },
});

const store_config = {
  namespace : "kitchen",
  bindings : {

    paul : {
      bind     : "change",
      endpoint : {
        source : "waiter", // Must be set because data source is custom
        params : {
          burger : String,
          cheese : Boolean,
        }
      },
    },

    matt : {
      bind     : "change",
      endpoint : {
        source : "waiter",
        person : "matthew",
        params : {
          pizza : String
        }
      }
    }

  }
}
```

When initialized into a vuex store the above contrived example with the module state:

```
{
  burger : "veggie",
  cheese : true,
  pizza : "pepperoni"
}
```

Would set `state.paul` to `'Hello paul, { burger : "veggie", cheese : true }'`

and `state.matt` to `'Hello matthew, { pizza : "pepperoni" }'`.

Then when `commit('kitchen/update_pizza', 'cheese')` is called, `state.matt` will be set to `Hello matthew, { pizza : "cheese" }`.

A less contrived example would be to have a custom `RestDataSource` that allows different endpoint options.
Note that the RestDataSource's module function is `axios`.
The following would allow the endpoint to set `additional_data` and `additional_params` on each request.

```
import { RestDataSource } from 'vuex-bind-plugin'

class CustomRestDataSource extends RestDataSource {
  args = (bind_state, params, endpoint) => {
    let rest_args = super.args(bind_state, params, endpoint);
    rest_args[0].data = { ...rest_args[0].data, ...endpoint.additional_data };
    rest_args[0].params = { ...rest_args[0].params, ...endpoint.additional_params };
    return rest_args;
  }
}
```

### Using Mock Data

Mock data can be built in to your endpoint definitions by including a mock field.

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
    mock : ["my first post", "my second post", "my third post" ]
  },
}
```

To return the mock data instead of querying the data source set `mock : true` in sources.

```
import Bind from "vuex-bind-plugin"

const plugin = new Bind.Plugin({
  ...
  sources : { ..., mock : true }
});
```

By default, this will cause endpoints to return the data in `mock` instead of requesting resources.
If an endpoint does not have a mock field, the [default value](#default-type-values) for the type is used.

If different logic is needed for retrieving mock data, include a `transform` function in the sources option for the plugin.

```
import { lookup_mock } from "vuex-bind-plugin"

const endpoints = {
  posts: {
    endpoint : "/posts",
    type     : Array,
    method   : "get", 
    params   : {
      user    : String,
      date    : Date, 
    },
    mock : ({ user }) => ({
      "fred" : ["fred's first post", "fred is da best"],
      "ben"  : ["ben is da benst", "who wants a taco?"],
      "julia": ["can anyone pet sit?", "hey it's julia"]
    }[user])
  },
}

const plugin = new Bind.Plugin({
  endpoints,
  sources : { 
    mock: true ,
    transform : lookup_mock, 
  },
});
```

`lookup_mock` is a utility function that passes param data into the mock_data function of your endpoint.
So in the above example, a query with `user : "fred"` would result in `["fred's first post", "fred is da best"]` and a query with `user : "greg"` would return `[]` (because "greg" is not present).


A custom function may also be used for the transform.
The tranform function is passed an object with `endpoint`, and `input_params` fields.
The `endpoint` is a reference to the endpoint definition, and `input_params` are the current parameter values that have been pulled from the state.
For example, a tranform to return the calculated params could be written as `tranform : ({ input_params }) => input_params`.

### Naming

The names of generated mutations, and actions are fully configurable.
Use the `naming` option to specify which naming scheme to use.
The two included schemes are `Bind.SnakeCase` and `Bind.CamelCase`.

The naming scheme only affects the generated portions of the vuex config and not configuration values associated with the plugin.

Access to the current naming scheme is available by using `naming`. See [Overwriting Generated Configuration](#overwriting-generated-configuration).

#### Why snake_case as default?

Short Answer: It's easier: `prefix + '_' + name` requires less computation than `prefix + name.slice(0,1).toUpperCase() + name.slice(1)`.

It's also what is used internally in the plugin.
Actions, mutations, etc in snake case also separates them from regular functions.
It further drives home the idea that we are working with strings with dispatch and commit.
That being said, naming conventions are project/personal specific, so the configuration is left to the user.

#### camelCase

To use camelCase for actions, mutations, etc use the `Bind.CamelCase()` setting in the naming option:

```
import Bind from 'vuex-bind-plugin'

const plugin = Bind.Plugin({
  ...
  naming : Bind.CamelCase(),
})
```

#### Custom naming scheme

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
    bind : "trigger",
    loading   : true,
    params    : {
      id : Number
    },
    create_params : true
  }
};
```

## Endpoint Configuration

Endpoints define where data will be retreived from.

Endpoints are data source specific, so the endpoint format may differ between different data sources.

Regardless of data source the `type` and `params` fields are available on all endpoints:
```
const endpoints = {
  ENDPOINT_NAME : {
    source  : "",    // Inferred
    type    : Object,
    params  : {},
  }
}
```

| Config Key  | Default | Description                                                                                  |
|-------------|---------|----------------------------------------------------------------------------------------------|
| source      | ""      | Data source to use. See [Inferring Source](#inferring-source).                               |
| type        | Object  | Type of object returned in the responses data                                                |
| params      | {}      | Endpoint parameters. See [Endpoint Parameters](#endpoint-parameters)                         |
| transform   | N/A     | Function that takes the (data) from the api and transforms it before committing it to state. |

### Inferring Source

The source of the data for the endpoint is inferred from the options provided for the endpoint and the plugin.
If only one source is configured, it infers all endpoints are configured for that one.
If multiple sources are configured, parameters use the presence of certain options to decide which defaults to use:

- the rest data source uses `url` and `method`
- the wasm data source uses `func`

Note that when custom datasources are configured, the source can not be inferred.
In other words, the source must be set on endpoints that use custom datasources.

For example:
```
const endpoints = {
  posts : { // Infers source : rest
    url : "/posts/",
  },
  users : { // Infers source : rest
    method : "get",
  },
  fract : { // Infers source : wasm
    func : "mandelbrot"
  }
}
```

Adding an explicit source to your endpoint config improves clarity, but it is not necessary.

If a source can not be inferred, then it will default to "rest".
This may be changed by setting the `default_source` option in [Plugin Configuration](#plugin-configuration).
This is useful if a project starts with a single source configured, but then requires another.

Inferring the source of an endpoint is important when considering defaults.
See [Configuration Defaults](#configuration-defaults).

### Endpoint Parameters

Endpoint parameters are set as an object in the form:

```
params : {
  NAME : TYPE_OR_MATCH
}
```

Where `NAME` is the name of the parameter that is used in the request and `TYPE_OR_MATCHER` is a type (Array, String, etc.) or a [match](#parameter-matching).

Typically the type will be one of `String`, `Array`, `Number` or simply `Object` (which will match just about anything).

The types of these parameters are used to generate [default values](#default-type-values) of parameters when they are stored in the state.

The `strict` plugin config option may be set to check the values being sent and received are of the specified type.
If a variable that does not match a parameter type is provided and the `strict` option is set a warning will show on the console.
This option should only be set in the development environment.

#### Default Type Values

Default values are retreived from the type given for the parameter or endpoint.

For built in types the default value is `Array()`,`Number()`, `Object()`, etc.
This value is inferred to be the parameter in "unset" state, and it is what the state is initialized to when building Bind.Stores.

#### Parameter Matchers

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

To create a custom matcher, create a function that returns an object with three fields: `name`, `is_set` and `default`.

The `name` is used to identify the matcher.
The `is_set` function is used to determine whether a parameter is set or not.
The `default` value is used as the default value for the parameter.

For example to match a number greater than 10 define:
```
const greater_than_ten = () => ({
  name    : "Greater than 10",
  is_set  : (value) => value > 10,
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

Rest endpoints require extra fields pertaining to rest request configuration:

```
const endpoints = {
  ENDPOINT_NAME : {
    url     : "/ENDPOINT_NAME/",
    method  : "get",
    headers : undefined,
    type    : Object,
    params  : {},
  }
}
```

| Config Key     | Default          | Description                                                                                                                                       |
|----------------|------------------|-------------------------------------------------|
| url            | "/ENDPOINT_NAME/" | Endpoint url. Used as url in axios query. May be a function that takes params and returns the resulting url. |
| method         | "get"             | REST method. Used as method in axios query.     |
| headers        | null              | Special headers to set for this request. These headers are added to the headers set in the plugin config and then used as headers in axios query. |
| type           | Object            | See [General Endpoints](#general-endpoints)     |
| params         | {}                | See [Endpoint Parameters](#endpoint-parameters) |

#### Computed url

The url option in the endpoint may be a function.
This is for when the url depends on some params.

```
const endpoints = {
  post : {
    url : (params) => `/posts/${params.id}`, // i.e. '/posts/10'
    params : {
      id : Number
    },
  }
}
```

Note that the params are still sent in POST data or GET params.

### WebAssembly Endpoints

*Not implemented yet*

```
const endpoints = {
  ENDPOINT_NAME : {
    func   : "ENDPOINT_NAME",
    order  : [],
    type   : Object,
    params : {},
  }
}
```

| Config Key     | Default          | Description                                                                                                                                       |
|----------------|------------------|------------------------------------------------------|
| func      | "ENDPOINT_NAME" | WebAssembly function name                                  |
| order     | []              | Ordering of arguments to the function call                 |
| type      | Object          | See [General Endpoints](#general-endpoints)                |
| params    | {}              | See [Endpoint Parameters](#endpoint-parameters)            |

## Binding Configuration

Defines how to store endpoint data.

```
const bindings = {
  OUTPUT_NAME : {
    endpoint      : OUTPUT_NAME,
    bind          : "once",
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
|  endpoint      | OUTPUT_NAME | Name of the endpoint to bind to. Should match an entry in endpoint configs. Defaults to the name of the output variable. |
|  bind          | "once"      | Binding type. One of "watch", "trigger", "change", or "once". See [Binding Types](#binding-types) |
|  param_map     | {}          | Parameter mapping. Defines which state variables to use as parameters to the api. See [Parameter Mapping](#parameter-mapping) |
|  side_effect   | N/A         | The name of an action to call when REST data is commited to this binding. The action must be within the current namespace. |
|  redirect      | N/A         | Redirects the output to another mutation. Instead of updating the data in OUTPUT_NAME, commit the data here. |
|  transform     | N/A         | Function that takes the (data) from the api and tranforms it before committing it to state.       |
|  create_params | false       | Set to true to automatically create state variables for endpoint parameters or the mappings in param_map.                                                                   |
|  loading       | false       | Set to true to create state variables that track when the data is being loaded                    |
|  period        | N/A         | Time interval in milliseconds to check for new api data. Only used for "watch" bindings           |

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

By default the state variables are named the same as the endpoint parameters.
For example, if the endpoint has `params: {id: Number, text: String}` then the state SHOULD have `{ id: 0, text: "" }`.
The `param_map` option can be used to set different names for state variables than endpoint parameters.

The `param_map` option is in the format `{ STATE_VAR: ENDPOINT_PARAM }` and any missing parameters default to the endpoint parameter name.

For example, if the endpoint has `params: { id: Number, text: String }` and the binding has `{ param_map: { some_id: "id" } }` then the state SHOULD have `{ some_id: 0, text: "" }`.

Note that when `create_params` is `true` the state variables will be created to fufill the parameter requirements.
In other words, the above examples WOULD create what the state SHOULD have.

#### Computed Parameters

Parameters may be computed from the state of the store module.
To compute a parameter from the local state, set the parameter in the `param_map` as an object with a `computed` property that is a function.

Note that the name in the binding `param_map` must match the name in the endpoint `params`.

```
const endpoints = { 
  user_nums : {
    method : "get",
    type   : Array,
    params : {
      id   : String,
      nums : String,
    }
  }
},

const bindings = {
  user_nums : {
    param_map : {
      user_id : "id",
      nums    : { computed : (state) => state.sequence.join(',') },
  }
}

export default {
  bindings,
  endpoints,
  state : {
    sequence : [1,2,3,4,5],
    user_id  : 10,
  },
}
``` 

In the above example the `nums` parameter would be computed as `'1,2,3,4,5'`.

## Organizing Endpoints and Bindings

Endpoints may be configured in 3 different places/scopes:

1. Plugin Config  -- Global scope
2. Store Config   -- Local scope
3. Binding Config -- Anonymous scope

The following three examples are equivalent configurations:

*Endpoint in plugin config*
```
import Bind from 'vuex-bind-plugin'

const mymodule = {
  bindings : {
    get_users : {
      endpoint : "users",     // References users in the global scope
      bind     : "once",
    }
  }
}

const store = new Vuex.Store({
  plugins : [new Bind.Plugin({
    source : { url : "http://myapi" },
    endpoints : {
      users : {
        method : "get",
        type   : Array,
        params : {
          group : Number,
        },
      }
    }
  })],
  modules : Bind.modules({
    mymodule,
  })
});
```

*Endpoint in module config*
```
import Bind from 'vuex-bind-plugin'

const mymodule = {
  endpoints : {
    users : {
      method : "get",
      type   : Array,
      params : {
        group : Number,
      },
    }
  },
  bindings : {
    get_users : {
      endpoint : "users",     // References users in the local scope
      bind     : "once",
    }
  }
}

const store = new Vuex.Store({
  plugins : [new Bind.Plugin({
    source : { url : "http://myapi" },
  })],
  modules : Bind.modules({
    mymodule,
  })
});
```

*Endpoint in binding config*
```
import Bind from 'vuex-bind-plugin'

const mymodule = {
  bindings : {
    get_users : {
      bind     : "once",
      endpoint : {           // No reference
        method : "get",
        type   : Array,
        params : {
          group : Number,
        },
      },
    }
  }
}

const store = new Vuex.Store({
  plugins : [new Bind.Plugin({
    source : { url : "http://myapi" },
  })],
  modules : Bind.modules({
    mymodule,
  })
});

```

Each of these approaches are equally valid, though using one over the other may lead to cleaner lookibg code.
A caveat to defining the endpoint in the binding is that it can not be referenced in other bindings.
The best way to define endpoints is up to the current application and api.
