function player_data(id, nick_name, pwd) {
  return {
    _id: id,
    name: nick_name,
    passwd: pwd,
    weight: 0,
    nr_game: 0,
    nr_kill: 0,
  };
}

module.exports = player_data;
