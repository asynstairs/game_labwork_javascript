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

field[2][1] = 1;

console.log(who_connected);

function isFirstStep(player_id) {
    console.log('can_step_here');
    let sum = 0;
    if (player_id === 1) {
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                sum += field[i][j];
                if (!sum) {
                    console.log('NOT FIRST STEP');
                    return false;
                }
            }
        }
        console.log('FIRST step');
        return sum === 0;
    } else {
        if (player_id === 2) {
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    sum += field[i][j];
                    if (sum > 1) {
                        console.log('NOT FIRST STEP');
                        return false;
                    }
                }
            }
        }
        console.log('FIRST step');
        return sum === 1;
    }
}

function notAlone(x, y, player_id) {
    console.log('notAlone()');
    for (let i = 0; i < 2; i++) {
        for (let j = -1; j < 1; j++ ) {
            if (player_id === 1) {
                console.log('Player 1 ', x+i, y+j, '= ', field[x+i][y+j]);
                if (field[x+i][y+j] === 1) {
                    console.log('[UPPER] Found friend at ', x+i, y+j);
                    return true;
                } else if (field[x+i][y+j] === 3) {
                    console.log('[UPPER] Not found friend at ', x+i, y+j);
                    for (let k = -1; k < 1; k++) {
                        for (let l = -1; l < 1; l++) {
                            if (field[x+i+k][y+j+l] === 1) {
                                console.log('[LOWER] Found friend at ', x+i+k, y+j+l);
                                return true;
                            } else {
                                console.log('[LOWER] Not Found friend at ', x+i+k, y+j+l);
                                return false;
                            }
                        }
                    }
                }
            } else {
                console.log('Player 2 ', x+i, y+j);
                if (field[x+i][y+j] === 2) {
                    return true;
                } else if (field[x+i][y+j] === 4) {
                    for (let k = -1; k < 1; k++) {
                        for (let l = -1; l < 1; l++) {
                            if (field[x+i+k][y+j+l] === 2) {
                                return true;
                            } else {
                                return false;
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
    if (isFirstStep(player_id) || notAlone(x, y, player_id)) {
        if (player_id === 1) {
            field[x][y] = 1;
        } else {
            field[x][y] = 2;
        }
        return true;
    } else {
        return false;
    }
}

io.sockets.on('connection', function(socket) {
    console.log('A player has been connected.');
    who_connected.push(socket);

    io.sockets.emit('how_many_connected', who_connected.length)

    socket.on('disconnect', function(data) {
        console.log('A player has been disconnected.');
        who_connected.splice(who_connected.indexOf(socket), 1);
    });

    socket.on('cell_click', function (data) {
        console.log(data);
        // console.log(canStepHere(data[0], data[1], data[2]));
        let isStep = canStepHere(data[0], data[1], data[2]);
        console.log(isStep);
        io.sockets.emit('step',1);
        console.log('AFTER');
    });

});


