const { response } = require('express');
let express = require('express');
let app = express();
let server = require('http').createServer(app);
let io = require('socket.io')(server);

server.listen(4000);

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/index.html');
});

app.get('/styles.css', function(req, res) {
    res.sendFile(__dirname + "/" + "styles.css");
});

app.get('/player.js', function(request, response) {
    response.sendFile(__dirname + '/player.js');
});

var who_connected = [];

var steps = 0;

var field = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    []
]


for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
        field[i][j] = 0;
    }
}


function isFirstStep(player_id) {
    console.log('can_step_here');
    let sum = 0;
    if (player_id === 1) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                sum += field[i][j];
                if (sum !== 0) {
                    console.log('SUM =' + sum);
                    console.log('NOT FIRST STEP');
                    return false;
                }
            }
        }
        console.log('FIRST step');
        return sum === 0;
    } else {
        sum = 0;
        if (player_id === 2) {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    sum += field[i][j];
                    if (sum > 5) {
                        console.log('SUM =' + sum);
                        console.log('NOT FIRST STEP');
                        return false;
                    }
                }
            }
        }
        console.log('FIRST step');
        return true;
    }
}

function notAlone(x, y, player_id) {
    console.log('notAlone()');
    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++ ) {
            if (player_id === 1) {
                console.log('Player 1 ', x+i, y+j, '= ', field[x+i][y+j]);
                if (field[x+i][y+j] === 1) {
                    console.log('[UPPER] Found friend at ', x+i, y+j);
                    return true;
                } else if (field[x+i][y+j] === 3) {
                    console.log('[UPPER] Not found friend at ', x+i, y+j);
                    for (let k = -1; k < 2; k++) {
                        for (let l = -1; l < 2; l++) {
                            if (field[x+i+k][y+j+l] === 1 || field[x+i+k][y+j+l] === 3) {
                                console.log('[LOWER] Found friend at ', x+i+k, y+j+l);
                                return true;
                            } else {
                                console.log('[LOWER] Not Found friend at ', x+i+k, y+j+l);
                            }
                        }
                    }
                }
            } else {
                console.log('Player 2 ', x+i, y+j, '= ', field[x+i][y+j]);
                if (field[x+i][y+j] === 2) {
                    console.log('[UPPER] Found friend at ', x+i, y+j);
                    return true;
                } else if (field[x+i][y+j] === 4) {
                    console.log('[UPPER] Not found friend at ', x+i, y+j);
                    for (let k = -1; k < 1; k++) {
                        for (let l = -1; l < 1; l++) {
                            if (field[x+i+k][y+j+l] === 2 || field[x+i+k][y+j+l] === 4) {
                                console.log('[LOWER] Found friend at ', x+i+k, y+j+l);
                                return true;
                            } else {
                                console.log('[LOWER] Not Found friend at ', x+i+k, y+j+l);
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}


function canStepHere(x, y, player_id) {
    if (field[x][y] === 3 || field[x][y] === 4){
        console.log('CANT STEP HERE! OVERRIDES!');
        return false;
    }
    if (isFirstStep(player_id)) {
        return true;
    }
    else {
        return notAlone(x, y, player_id);
    }
}

let steps_1st = 3;
let steps_2nd = 0;

io.sockets.on('connection', function(socket) {
    console.log('A player has been connected.');
    who_connected.push(socket);
    socket.on('disconnect', function(data) {
        console.log('A player has been disconnected.');
        who_connected.splice(who_connected.indexOf(socket), 1);
    });

    socket.on('cell_click', function (data) {
        console.log(data);
        let isStep = canStepHere(data[0], data[1], data[2]);
        console.log(isStep);
        if (isStep) {
            if (data[2] === 1) {
                    if (steps_1st > 0) {
                        console.log('FIRST PLAYER : ' + steps_1st + ' STEP');
                        if (field[data[0]][data[1]] === 2) {
                            io.sockets.emit('step', {
                                step: isStep,
                                player: data[2],
                                x: data[0],
                                y: data[1],
                                attack: true
                            });
                            field[data[0]][data[1]] = 3;
                        } else if (field[data[0]][data[1]] === 0){
                            io.sockets.emit('step', {
                                step: isStep,
                                player: data[2],
                                x: data[0],
                                y: data[1],
                                attack: false
                            });
                            field[data[0]][data[1]] = 1;
                        }
                        steps_2nd++;
                        steps_1st--;
                    }
            } else {
                if (steps_2nd > 0) {
                    console.log('SECOND PLAYER : ' + steps_2nd + ' STEP');
                    if (data[2] === 2 && field[data[0]][data[1]] === 1) {
                        io.sockets.emit('step', {
                            step: isStep,
                            player: data[2],
                            x: data[0],
                            y: data[1],
                            attack: true
                        });
                        field[data[0]][data[1]] = 4;
                    } else if (data[2] === 2 && field[data[0]][data[1]] === 0) {
                        io.sockets.emit('step', {
                            step: isStep,
                            player: data[2],
                            x: data[0],
                            y: data[1],
                            attack: false
                        });
                        field[data[0]][data[1]] = 2;
                    }

                    steps_1st++;
                    steps_2nd--;
                }
            }
        }
    });

});


