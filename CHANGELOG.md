# [Version 1.0.0](https://github.com/hppr-dev/vuex-bind-plugin/tree/1.0.0)

- Initial release

# [Version 1.0.1](https://github.com/hppr-dev/vuex-bind-plugin/tree/1.0.1)

- Change create_params binding option default to true
- Finish implementation/documentation of custom data sources
- Fix README custom data sources tabnle formatting

# [Version 1.0.2](https://github.com/hppr-dev/vuex-bind-plugin/tree/1.0.2)

- Add mapping helpers
- Support nested BoundStores

# [Version 1.0.3](https://github.com/hppr-dev/vuex-bind-plugin/tree/1.0.3)

- Fix mapTriggerActions helper method
- Update mapBindingsWithLoading to have it actually work
- Remove computed params from bound store params creation
- Add watch property to computed params to enable updating on updates to the state

# Version 1.0.4 BROKEN UNPUBLISHED

- Quick patch to add getters to computed parameters in param_maps.

# [Version 1.0.5](https://github.com/hppr-dev/vuex-bind-plugin/tree/1.0.5)

- Quick patch fix last version. rootGetters is not setup like rootState is.
- Pass rootGetters instead of trying to get the local module getters in computed params
