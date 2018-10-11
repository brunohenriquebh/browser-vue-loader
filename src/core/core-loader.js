/**
 * This file contains a custom implementation of the ES Module Loader.
 * The based loader is provided by the ES Module Loader Polyfill at
 * https://github.com/ModuleLoader/es-module-loader
 *
 */
import RegisterLoader from 'es-module-loader/core/register-loader'
import { fetchContent, addToCache } from './fetch-source'
import {
  splitKey,
  constructKey,
  lookupNpmPackage,
  resolveActualUrl,
  checkDefaultBinary
} from './key-utils'
import Router from './router'

/**
 * The custom loader
 */
class BrowserVueLoader extends RegisterLoader {
  constructor (baseKey) {
    super(2)
    this.router = new Router(this)
  }

  /**
   * Resolve hook
   *
   * super[RegisterLoader.resolve](key, parentKey) will return:
   *  - undefined if "key" is a plain names (eg 'lodash')
   *  - URL resolution if "key" is a relative URL (eg './x' will resolve to parentKey as a URL, or the baseURI)
   *
   * @param {String} key - the request key
   * @param {String} parentKey - the parent key, from where the key is requested.
   * @return {String} the resolved key
   */
  async [RegisterLoader.resolve] (key, parentKey) {
    let {processor, url, options} = splitKey(key)
    let {url: parentUrl} = splitKey(parentKey)
    let relativeResolved = super[RegisterLoader.resolve](url, parentUrl)
    if (relativeResolved) {
      url = relativeResolved
    }

    if (url.indexOf('://') < 0 && url.indexOf('.') < 0 && !url.startsWith("string_vue:")) {
      // NPM package
      const npmPackage = await lookupNpmPackage(url)
      if (npmPackage) {
        url = npmPackage
        processor = processor || 'commonjs'
      }
    }
    if( !url.startsWith("string_vue:"))
      url = await resolveActualUrl(url)

    if (checkDefaultBinary(url)) {
      options.binary = true
    }
    return constructKey({processor, url, options})
  }

  /**
   * Instantiate hook
   *
   * The module shall be registered inside the loader when this
   * asynchronous function finishes.
   *
   * @param {String} key - the resolved key
   */
  async [RegisterLoader.instantiate] (key) {
    const {processor, url, options} = splitKey(key)

    const source = await fetchContent(url, Boolean(options.binary))
    if (processor) {
      await this.router.routeTo(processor, key, source)
    } else {
      await this.router.route(key, source)
    }
  }
}

// create the loader instance.
export const loader = new BrowserVueLoader()

/**
 * The function to be registered at global namespace.
 * It loads a Vue component / ES module from given URL and returns by Promises.
 * @param {String} entryUrl - the URL to load the resource from.
 * @return {Promise<any>} the loaded component / module.
 */
export const loadVue = (entryUrl) => {

  if(entryUrl.startsWith("string_vue:")){ //Hack Used to render from static variables
    const content = entryUrl;
    
    entryUrl = 'http://'+ Math.random().toString(36)+".vue";
    addToCache(entryUrl, content.substr(11));
  }

  return  loader.import(entryUrl)
  .then(m => m.default ? m.default : m)
}
export const loadVueOnDocument = (entryUrl, document) => {
  loadVue.onDocument = document;
  return loadVue(entryUrl);
}
