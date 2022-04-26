import { Server } from "socket.io";

const io = new Server(5000, {
    cors : {
        origin : '*',
        methods : ['GET', 'POST']
    },
    maxHttpBufferSize : 1e8
});

var activeUsers = [];
const groups = {};

io.on('connection', (socket) => {

    socket.on("disconnect", () => {
        activeUsers = activeUsers.filter(user => user.id !== socket.id);
        io.emit("activeUsers", activeUsers);
    });

    socket.on('login', (data) => {
        const userId = socket.id;
        activeUsers.push({
            newMessage : false,
            username : data.username,
            id : userId
        })
        io.emit('activeUsers', activeUsers);
    });

    socket.on('newMessage', (message) => {
        if(message.group) {
            for(let i = 0; i<message.receiver.length; i++) {
                io.to(message.receiver[i].id).emit('newMessage', message);
            }
        } else {
            io.to(message.receiver.id).emit('newMessage', message);
        }
    })

    socket.on('joinGroup', joiningMsg => {
        const groupId = joiningMsg.invitation.id;
        const groupName = joiningMsg.invitation.name;
        const userId = joiningMsg.sender.id;
        const username = joiningMsg.sender.username;
        const invitedBy = joiningMsg.invitation.invitedBy;

        groups[groupId].users.push(joiningMsg.sender);
        const newGroupData = {
            name : groupName,
            id : groupId,
            newMessage : true,
            users : groups[groupId].users
        }
        io.to(userId).emit('myNewGroup', newGroupData);
        
        groups[groupId].users.forEach(user => {
            if(user.id !== userId){
                io.to(user.id).emit('myGroups', [groups[groupId]]);
                const joinedMsg = {
                    group : true,
                    id : groupId,
                    sender : {
                        username : username,
                        id : userId
                    },
                    content : {
                        joined : {
                            invitedBy : invitedBy
                        }
                    },
                }
                io.to(user.id).emit('newMessage', joinedMsg);
            }
        });
    })

    socket.on('invite', invitation => {
        socket.to(invitation.receiver.id).emit('newMessage', invitation);
    })

    socket.on('createGroup', (data) => {
        groups[data.id] = {
            name : data.name,
            id : data.id,
            users : data.users
        }
        for(let i = 0; i<data.users.length; i++){
            io.to(data.users[i].id).emit('myNewGroup', data);
        }
    })
})