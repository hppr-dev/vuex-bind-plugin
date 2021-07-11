
export class Naming { 
  prefixes = {
    update  : "update",
    load    : "load",
    loading : "loading",
    done    : "done",
    trigger : "trigger",
  }
}

export class SnakeCase extends Naming {
  update(name) {
    return `${this.prefixes.update}_${name}`;
  }
  load(name) {
    return `${this.prefixes.load}_${name}`;
  }
  loading(name) {
    return `${this.prefixes.loading}_${name}`;
  }
  done(name) {
    return `${this.prefixes.done}_${this.loading(name)}`;
  }
  trigger(name) {
    return `${this.prefixes.trigger}_${name}`;
  }
}

export class CamelCase extends Naming {
  update(name) {
    return `${this.prefixes.update}${capitalize(name)}`;
  }
  load(name) {
    return `${this.prefixes.load}${capitalize(name)}`;
  }
  loading(name) {
    return `${this.prefixes.loading}${capitalize(name)}`;
  }
  done(name) {
    return `${this.prefixes.done}${capitalize(this.loading(name))}`;
  }
  trigger(name) {
    return `${this.prefixes.trigger}${capitalize(name)}`;
  }
}

const capitalize = (word) => `${word.slice(0,1).toUpperCase()}${word.slice(1)}`;
