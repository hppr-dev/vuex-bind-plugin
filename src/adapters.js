import BindPlugin from './bind_plugin.js'
import { is_unset, get_default } from './utils.js'

const storage_scopes = {
  "local"   : window.localStorage,
  "session" : window.sessionStorage,
  "cookie"  : {
    getItem(key) {
      return Object.fromEntries(document.cookie.split(';').map((c) => c.trim().split("=")))[key];
    },
    setItem(key, value) {
      document.cookie = `${key}=${value};expires=${Date.now() + this._cookie_config.expires};path=${this._cookie_config.path}`;
    },
    removeItem(key) {
      document.cookie = `${key}=;Max-Age=0`;
    }
  }
}

export const storage_adapter = (key, value, type, scope, cookie_config={}) => {
  let storage = storage_scopes[scope];
  storage._cookie_config = cookie_config;
  return new Promise((resolve) => {
    if ( value === null ) {
      storage.removeItem(key);
      resolve(get_default(type));
    } else {
      let current_value = storage.getItem(key);
      if ( current_value === null || !is_unset(value, type) ) {
        storage.setItem(key, value);
        resolve(value);
      } else {
        resolve(current_value);
      }
    }
  });
}

export const wasm_adapter = (file_name, func_name, args ) => {
  throw 'wasm data sources are not supported at this time';
/*
  if( BindPlugin.config.wasm_funcs.length > 0 ) {
    return WebAssembly.instatiateStreaming(fetch(file_name), BindPlugin.config.wasm_funcs)
      .then((wasm_obj) => {
        return wasm_obj.instance[func_name](...args);
      });
  } else {
    throw "Tried to init wasm_adapter without wasm endpoints";
  }
*/
}
