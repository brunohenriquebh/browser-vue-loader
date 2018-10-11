const injectStyle = (css) => {
  const styleElement = document.createElement('style')
  styleElement.appendChild(document.createTextNode(css))
  if(window.loadVue != null && window.loadVue.onDocument !=  null){
    window.loadVue.onDocument.head.appendChild(styleElement)
  }
  else 
  document.head.appendChild(styleElement)
}

export default injectStyle
