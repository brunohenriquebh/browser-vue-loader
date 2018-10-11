import './babel-polyfill'
import { loadVue, loadVueOnDocument } from './core/core-loader'
import { processScriptTag } from './core/script-tag'

window.loadVue = loadVue
window.loadVueOnDocument = loadVueOnDocument
processScriptTag()
