function ret_data(code, msg, _nick_name) {
  return {
    ret_code: code,
    ret_msg: msg,
      nick_name: _nick_name,
  };
}

module.exports = ret_data;
