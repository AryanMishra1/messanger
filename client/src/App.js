import { io } from 'socket.io-client';
import { useState, createContext, useEffect } from 'react';
import Login from './components/Login/Login';
import Home from './components/Home/Home';
import './css/App.css';
import 'antd/dist/antd.css';

const socket = io('ws://localhost:5000');

export const LoginContext = createContext();

const App = () => {
  
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [allChats, setAllChats] = useState({});
  const [newMessage, setNewMessage] = useState(false);

  useEffect(() => {

    socket.on('newMessage', (message) => {
      setAllChats(prevState => {
        const newAllChats = prevState;
        const userChat = newAllChats[message.id];
        userChat['newMessage'] = true;
        userChat.chats.push({
          sender : message.group ? message.sender : null,
          received : true,
          content : message.content
        })
        return newAllChats;
      });
      setNewMessage(true);
    });

    socket.on('myNewGroup', (newGroup) => {
      setAllGroups(prevState => prevState ? [...prevState, newGroup] : [newGroup]);

      setAllChats(prevState => {
        const newAllChats = prevState;
        newAllChats[newGroup.id] = {
          newMessage : false,
          chats : []
        };
        return newAllChats;
      });
      setNewMessage(true);
    })

    socket.on('myGroups', (myGroups) => setAllGroups(myGroups))

    socket.on('activeUsers', (allActiveUsers) => {
      setActiveUsers([...(allActiveUsers.filter(user => user.id !== socket.id))]);

      setAllChats(prevState => {
        const newUsersChat = prevState;
        allActiveUsers.forEach(user => user.id !== socket.id ? 
          newUsersChat[user.id] ? null : 
          newUsersChat[user.id] = {
            newMessage : false,
            sender : {
              username : user.username,
              id : user.id
            },
            chats : []
          } : null
        )
        return newUsersChat;
      })
    })
  }, []);

  return (
    <div className="App">
      <LoginContext.Provider value={{loggedIn, setLoggedIn, username, setUsername, socket, activeUsers, setActiveUsers, allGroups, setAllGroups, allChats, setAllChats, newMessage, setNewMessage}}>
        {
          loggedIn ? <Home/> : <Login/>
        }
      </LoginContext.Provider>
    </div>
  );
}

export default App;
