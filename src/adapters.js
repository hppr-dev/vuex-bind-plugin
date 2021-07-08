import BindPlugin from './bind_plugin.js'

const storage_scopes = {
  "local"   : window.localStorage,
  "session" : window.sessionStorage,
  "cookie"  : {
    getItem : (key) => {
      return Object.fromEntries(document.cookie.split(';').map((c) => c.trim().split("=")))[key];
    },
    setItem : (key, value) => {
      document.cookie = value? 
        `${key}=${value};expires=${Date.now() + BindPlugin.config.cookies_expire};path=${BindPlugin.config.cookies_path}` :
        `${key}=;Max-Age=0`;
    }
  }
}

export const storage_adapter = (key, value, type, scope) => {
  let storage = storage_scopes[scope];
  return new Promise((resolve, reject) => {
    if(is_unset(value, type)) {
      resolve(storage.getItem(key));
    } else {
      storage.setItem(key, value);
      resolve(value);
    }
  });
}

export const wasm_adapter = (file_name, func_name, args ) => {
  if( BindPlugin.config.wasm_funcs.length > 0 ) {
    return WebAssembly.instatiateStreaming(fetch(file_name), BindPlugin.config.wasm_funcs)
      .then((wasm_obj) => {
        return wasm_obj.instance[func_name](...args);
      });
  } else {
    throw `Tried to init wasm_adapter without wasm endpoints`;
  }
}
