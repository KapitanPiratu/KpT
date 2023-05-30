const fs = require('fs')
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const SECRET = '1234' //testing value

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
    })

    socket.on('check_answer', ans => {
        if (ans == SECRET){
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