function player_data(id, nick_name, pwd, img, mass, game, kill) {
    return {
        _id: id,
        name: nick_name,
        passwd: pwd,
        image_url: img,
        weight: mass,
        nr_game: game,
        nr_kill: kill,
    };
}

module.exports = player_data;
