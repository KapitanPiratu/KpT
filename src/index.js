const fs = require('fs')
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const baseCode = '1234';
let code = baseCode;

app.use(express.static('public'));

app.get('/', (req, res) => {
    const page = req.query['page'];
    let path;
    switch (page) {
        case 'main':
            path = '/public/main.html';
            break;
        case 'secondary':
            path = '/public/secondary.html';
            break;
        case 'alert':
            path = '/public/alert.html';
            break;
        case 'admin':
            path = '/public/admin.html';
            break;
        default:
            path = '/public/index.html';
            break;
    }
    res.sendFile(__dirname + path);
});

app.get('/audio', (req, res) => {
    const file = __dirname + '/public/alarm.mp3';
    fs.exists(file, (exists) => {
        if (exists) {
            const rstream = fs.createReadStream(file);
            rstream.pipe(res);
        } else {
            res.sendStatus(404);
        }
    });
})

//handling sockets
io.on('connection', (socket) => {
    console.log('a user connected');
    
    socket.on('connection_with_type', type => {
        io.emit('console_msg', { msg: `a device connected as ${type} (IP: "${socket.handshake.address}")`});
        io.emit('console_msg', { msg: `loaded secret code: ${code}`});
    })

    socket.on('console_command', msg => {
        io.emit('console_msg', msg)
        switch (msg.command[0]) {
            case 'code':
                io.emit('console_msg', { msg: `the current secret code is: ${code}` });
                break;
            case 'changecode':
            case 'cc':
                if (msg.command[1] == 'base'){
                    code = baseCode;
                    io.emit('console_msg', { msg: `successfully changed the code to the base code: ${code}` });
                }else if (msg.command[1].length == 4){
                    code = msg.command[1];
                    io.emit('console_msg', { msg: `successfully changed the code - new code: ${code}` });
                }else{
                    io.emit('console_msg', { msg: '!! failed to change the code: wrong code' });
                }
                break;
            case 'activate':
                io.emit('console_msg', { msg: 'Activated animation', correct: true })
            default:
                break;
        }

    })

    socket.on('check_answer', ans => {
        if (ans == code){
            io.emit('console_msg', { msg: `Answer was submitted: "${ans}" - CORRECT`, correct: true })
        } else{
            io.emit('console_msg', { msg: `Answer was submitted: "${ans}" - WRONG`, correct: false })
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected')
        io.emit('console_msg', { msg: `device disconnected (IP: "${socket.handshake.address}")`});
    });
});

server.listen(3000, () => {
  console.log('listening on port 3000');
});