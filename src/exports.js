import BindPlugin from "./bind_plugin.js"
import BoundStore from "./bound_store.js"
import { DataSource, RestDataSource } from './data_sources.js'
import { SnakeCase, CamelCase } from './naming.js'
import { match, lookup_mock, create_bound_stores } from './utils.js'
import { mapBindings, mapBindingsWithLoading, mapTriggerActions, mapParams, syncParams } from './importers.js'


export { DataSource, RestDataSource, match, lookup_mock }

export { mapBindings, mapBindingsWithLoading, mapTriggerActions, mapParams, syncParams }

export default {
  Plugin  : BindPlugin,
  Store   : BoundStore,
  Modules : create_bound_stores,
  SnakeCase : () => new SnakeCase(),
  CamelCase : () => new CamelCase(),
}
