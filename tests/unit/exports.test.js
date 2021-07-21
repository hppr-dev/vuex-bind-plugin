import Bind from '@src/exports.js'
import BindPlugin from '@src/bind_plugin.js'
import BoundStore from '@src/bound_store.js'
import { SnakeCase, CamelCase } from '@src/naming.js'
import { create_bound_stores } from '@src/utils.js'

import {
  DataSource,
  RestDataSource,
  match,
  lookup_mock,
  mapBindings,
  mapBindingsWithLoading,
  mapParams,
  syncParams,
  mapTriggerActions,
} from '@src/exports.js'
  

jest.mock('@src/bound_store.js');

describe("module exports", () => {
  it("should export what is expected", () => {
    expect(DataSource).toBeDefined();
    expect(RestDataSource).toBeDefined();
    expect(match).toBeDefined();
    expect(lookup_mock).toBeDefined();
    expect(mapBindings).toBeDefined();
    expect(mapBindingsWithLoading).toBeDefined();
    expect(mapParams).toBeDefined();
    expect(syncParams).toBeDefined();
    expect(mapTriggerActions).toBeDefined();
  });
})
describe("Bind.Plugin", () => {
  it("should be BindPlugin", () => {
    expect(Bind.Plugin).toBe(BindPlugin);
  });
});

describe("Bind.Store", () => {
  it("should be BoundStore", () => {
    expect(Bind.Store).toBe(BoundStore);
  });
});


describe("Bind.Modules", () => {
  it("should be create_bound_stores", () => {
    expect(Bind.Modules).toBe(create_bound_stores);
  });
});

describe("Bind.SnakeCase", () => {
  it("should be an instance of SnakeCase", () => {
    expect(Bind.SnakeCase()).toBeInstanceOf(SnakeCase);
  });
});

describe("Bind.CamelCase", () => {
  it("should be an instance of CamelCase", () => {
    expect(Bind.CamelCase()).toBeInstanceOf(CamelCase);
  });
});
