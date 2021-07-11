import { SnakeCase } from '@src/naming.js'

export class TestDataSource { 
  constructor({
    module = (data) => new Promise((resolve) => resolve(data)),
    args = (bind_state, computed_params, endpoint) => [endpoint.data(computed_params)],
    assign = (data) => data,
    state  = {},
    mutations = {},
  }){
    this.module    = module;
    this.args      = args;
    this.state     = state;
    this.assign    = assign;
    this.mutations = mutations;
    this.apply_defaults = jest.fn();
  }
}

export const test_plugin_config = {
  data_source : new TestDataSource({}),
  endpoints   : {
    test : { data : "Got Data" }
  },
  naming      : new SnakeCase(),
  namespace   : "bind",
  strict      : false,
};

export const mock_prototype = (clazz, name, test) => {
  let holder = clazz.prototype[name];
  let fun = jest.fn();
  beforeAll(() => {
    holder = clazz.prototype[name];
    clazz.prototype[name] = fun;
  });

  afterAll(() => {
    clazz.prototype[name] = holder;
  });

  beforeEach(() => fun.mockClear());

  return fun;
};
