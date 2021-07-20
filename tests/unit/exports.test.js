import Bind from '@src/exports.js'
import BindPlugin from '@src/bind_plugin.js'
import BoundStore from '@src/bound_store.js'
import { SnakeCase, CamelCase } from '@src/naming.js'
import { create_bound_stores } from '@src/utils.js'

jest.mock('@src/bound_store.js');

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
