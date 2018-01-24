/**
 * @desc Advanced localstorage controller
 * @author iyinchao<yincharles@163.com>
 */

const Store = {}

Store.get = function (key) {
  let data
  const val = localStorage.getItem(key)

  if (val) {
    try {
      let obj = JSON.parse(val)
      if (obj.exp && obj.exp < Date.now()) {
        this.delete(key)
        return data
      }
      return obj.v
    } catch (e) {
      console.warn('@Store.get', 'Invalid data.')
    }
  }

  return data
}

Store.set = function (key, data, option) {
  const op = Object.assign({}, {
    expire: false
  }, option)

  if (!key) {
    console.warn('@Store.set', 'Cannot set with empty key.')
    return
  }
  if (data === undefined || data === null) {
    console.warn('@Store.set', 'Cannot store empty value.')
    return
  }

  // Generate json
  let dataFiltered
  switch (typeof data) {
    case 'object':
    case 'number':
    case 'string':
      dataFiltered = data
      break
    default:
      console.warn('@Store.set', 'Invalid data value.')
      return
  }

  const json = {
    v: dataFiltered
  }

  // Add option values
  if (op.expire) {
    if (typeof op.expire === 'number' && op.expire > 0) {
      json.exp = Date.now() + op.expire
    } else {
      console.warn('@Store.set', 'Invalid option.expire.')
    }
  }

  localStorage.setItem(key, JSON.stringify(json))
}

Store.delete = function (key) {
  localStorage.removeItem(key)
}

export default Store
