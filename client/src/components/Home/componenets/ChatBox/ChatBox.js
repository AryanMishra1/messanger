import { useState, useContext, useEffect } from 'react';
import './css/ChatBox.css';
import { LoginContext } from '../../../../App';
import Picker from 'emoji-picker-react';
import { v4 as uuid } from 'uuid';
import { FcInvite } from 'react-icons/fc';
import { BsFillFileEarmarkImageFill } from 'react-icons/bs';
import { AiOutlineVideoCameraAdd } from 'react-icons/ai';
import { FiSend } from 'react-icons/fi';

const ChatBox = ({user}) => {

    const { socket, username, allChats, setAllChats, setNewMessage, activeUsers } = useContext(LoginContext);

    const [emojis, setEmojis] = useState(false);
    const [message, setMessage] = useState({ text : '', media : {}});
    const [userChats, setUserChats] = useState(allChats[user.id]);
    const [selectInvitation, setSelectInvitation] = useState(false);

    useEffect(() => {
        setUserChats(allChats[user.id]);
        setAllChats(prevState => {
            const msgSeen = prevState;
            msgSeen[user.id].newMessage = false;
            return msgSeen; 
        })
        setNewMessage(false);
    });

    const sendMessage = () => {
        const messageData = {
            group : user.users ? true : false,
            id : user.users ? user.id : socket.id,
            receiver : user.users ? [...(user.users.filter(u => u.id !== socket.id))] : user,
            sender : {
                username : username,
                id : socket.id
            },
            content : message,
        }
        socket.emit('newMessage', messageData);

        setAllChats(prevState => {
            const newAllChats = prevState;
            const newUserChat = newAllChats[user.id]
            newUserChat.chats.push({
                sender : user.users ? {
                    username : username,
                    id : socket.id
                } : null,
                received : false,
                content : message
            })
            return newAllChats;
        });
        setMessage({text : '', media : {}});
    }

    const invite = (userToInvite) => {
        const inviteMsg = {
            id : socket.id,
            receiver : userToInvite,
            sender : {
                username : username,
                id : socket.id
            },
            content : {
                invitation : {
                    name : user.name,
                    id : user.id,
                    invitedBy : {
                        username : username,
                        id : socket.id
                    }
                }
            },
        }
        socket.emit('invite', inviteMsg);
        setSelectInvitation(false);

        setAllChats(prevState => {
            const newAllChats = prevState;
            const newUserChat = newAllChats[userToInvite.id]
            newUserChat.chats.push({
                sender : user.users ? {
                    username : username,
                    id : socket.id
                } : null,
                received : false,
                content : inviteMsg.content
            })
            return newAllChats;
        });
    }

    const joinGroup = (invitation) => {
        const joiningMsg = {
            sender : {
                username : username,
                id : socket.id
            },
            invitation : invitation
        }
        socket.emit('joinGroup', joiningMsg);
    }

    return (
        <div className='ChatBoxContainer'>
            <div className='usernameContainer'>
                    <h1 className='user' key={user.id}>{user.name || user.username}</h1>
            </div>
            <div className='inviteContainer'>
                {
                    user.name ? selectInvitation ? 
                        <div className='inviteUsersContainer'>
                            {
                                activeUsers.map(activeUser => {
                                    var found = false;
                                    for(let i = 0; i<user.users.length; i++){
                                        if(activeUser.id === user.users[i].id){
                                            found = true;
                                        }
                                    }
                                    if(!found) {
                                        return (
                                            <button className='invitedUser' onClick={() => invite(activeUser)}>{activeUser.username}</button>
                                        )
                                    }
                                    return null
                                })
                            }
                        </div> : <p className='inviteLabel'>Invite others to Group!!</p> : null
                }
                {
                    user.name ? <button className='invite' onClick={() => setSelectInvitation(!selectInvitation)}><FcInvite size='2rem'/></button> : null
                }
            </div>
            <div className='ChatBox'>
                {
                    userChats ? 
                        userChats.chats.map(message => message.content ?
                            <div key={uuid()} className={message.received ? 'message messageReceived' : 'message messageSent'}>
                                {
                                    user.name ? message.content.joined ? null :
                                        <h4 key={uuid()} className='messageSender'>
                                            {message.sender ? message.sender.id === socket.id ? 'You' : message.sender.username : null}
                                        </h4> : null
                                }
                                {
                                    message.content.joined ? <div>
                                        <h5 id='joinedMsg'>{message.sender.username} joined the group through {message.content.joined.invitedBy.username} invitation.</h5>
                                    </div> : null
                                }
                                {
                                    message.content.invitation ? <div className='invitationContainer'>
                                        <h3 className='invitationMsg'>{message.received ? user.username : 'You'} requested {message.received ? 'you' : user.username} to join {message.content.invitation.name}.</h3>
                                        {
                                            message.received ? <button className='invitationBtn' onClick={() => joinGroup(message.content.invitation)}>Join</button> : null
                                        }
                                    </div> : null
                                }
                                {
                                    message.content.media ? message.content.media.image ? <img className='imageContent' src={message.content.media.content}/> : null : null
                                }
                                {
                                    message.content.media ? 
                                        message.content.media.video ? 
                                            <video className='videoContent' width="750" height="500" controls >
                                                <source src={message.content.media.content} type="video/mp4"/>
                                            </video> : null : null
                                }
                                {
                                    message.content.text ? <h4 key={uuid()} className='messageContent'>{message.content.text}</h4> : null
                                }
                            </div> : <h3>No Content</h3>
                        ) : <h3>No Chats</h3>
                }
            </div>
            <div className='inputContainer'>
                <div className='chatControl'>
                    <button className='emojis' onClick={() => setEmojis(!emojis)}>:)</button>
                    <input type='text' value={message.text} className='textInput' onChange={(e) => {
                        setMessage(prevState => {
                            const newMessageData = {...prevState};
                            newMessageData['text'] = e.target.value
                            return newMessageData
                        });
                    }}/>
                    <div className='selectFile'>

                        <input 
                            type='file'
                            id='imageInput'
                            onChange={(e) => {
                                const file = e.target.files[0];
                                const reader = new FileReader();
                                reader.readAsDataURL(file);
                                reader.onload = () => {
                                setMessage(prevState => {
                                    const newMessageData = {...prevState};
                                    newMessageData['media'] = {
                                        image: true,
                                        content: reader.result,
                                        name: file.name,
                                    }
                                    return newMessageData;
                                });
                                };
                                reader.onerror = function (error) {
                                console.log(error);
                                };
                            }}
                        />
                        <label for='imageInput' className='fileInput'>
                            <BsFillFileEarmarkImageFill size='2rem'/>
                        </label>

                        <input
                            id='videoInput'
                            type="file"
                            onChange={e => {
                            const file = e.target.files[0];
                            const reader = new FileReader();
                            reader.readAsDataURL(file);
                            reader.onload = () => {
                            setMessage(prevState => {
                                const newMessageData = {...prevState};
                                newMessageData['media'] = {
                                    video: true,
                                    content: reader.result,
                                    name: file.name,
                                }
                                return newMessageData;
                            });
                            };
                            reader.onerror = function (error) {
                                console.log(error);
                            }
                        }}/>

                        <label for='videoInput' className='fileInput'><AiOutlineVideoCameraAdd size='2rem'/></label>
                    </div>
                    <button className='sendMessage' onClick={sendMessage}><FiSend size='2rem'/></button>
                </div>
                {
                    emojis ? <div><Picker onEmojiClick={(e, chosenEmojis) => setMessage(prevState => {
                        const emojiAdded = {...prevState};
                        emojiAdded['text'] = emojiAdded['text'] + chosenEmojis.emoji;
                        return emojiAdded;
                    })}/></div> : null
                }
            </div>
        </div>
    )
}

export default ChatBox;