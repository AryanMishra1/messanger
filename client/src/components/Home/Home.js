import { useState, useContext, useEffect } from 'react';
import { Layout } from 'antd';
import './css/Home.css';
import { LoginContext } from '../../App';
import ChatBox from './componenets/ChatBox/ChatBox';
import { v4 as uuid } from 'uuid';
import { MdGroupAdd } from 'react-icons/md';
import { AiOutlineCheck } from 'react-icons/ai';
const { Header, Content, Footer, Sider } = Layout;

const Home = () => {

    const {username, activeUsers, socket, allGroups, allChats, setAllChats, newMessage, setNewMessage} = useContext(LoginContext);
    const [collapsed, setCollapsed] = useState(false);
    const [newGroup, setNewGroup] = useState({});
    const [newGroupName, setNewGroupName] = useState(false);
    const [selectUsers, setSelectUsers] = useState(false);
    const [chats, setChats] = useState(false);
    const [userChat, setUserChat] = useState();

    useEffect(() => console.log('CleanUp!'), [newMessage, allChats, allGroups]);

    const createGroup = () => socket.emit('createGroup', newGroup);

    const getChats = (user) => {
        setNewMessage(false);
        setAllChats(prevState => {
            const msgSeen = prevState;
            msgSeen[user.id].newMessage = false;
            return msgSeen; 
        })
        setUserChat(user);
        setChats(true);
    }

    return (
        <Layout
            style={{
                minHeight: '100vh',
            }}
        >
            <Sider collapsible collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)}>
                <div className='activeUsersContainer'>
                    <h3 className='activeUsersLabel'>Active Users</h3>
                    <div className='activeUsers'>
                        {
                            activeUsers.map(user => <h4 key={user.id} className={allChats[user.id].newMessage ? 'newMessage activeUser' : 'activeUser'} onClick={() => getChats(user)}>{user.username}</h4>)
                        }
                    </div>
                </div>
                <div className='activeUsersContainer'>
                    <h3 className='activeUsersLabel'>Groups</h3>
                    <button className='createGroup' onClick={() => setNewGroupName(true)}>
                        <MdGroupAdd size='2rem' className='createGroupIcon'/>
                    </button>
                    {
                        newGroupName ? 
                            <div className='newGroupNameContainer'>
                                <input type='text' className='newGroupName' onChange={(e) => setNewGroup({name : e.target.value, id : uuid(), newMessage : true})}/>
                                <button
                                    className='newGroupBtn'
                                    onClick={() => {
                                    setNewGroup({...newGroup, users : [{
                                        username : username,
                                        id : socket.id
                                    }]});
                                    setNewGroupName(false);
                                    setSelectUsers(true);
                                }}><AiOutlineCheck size='2rem'/></button>
                            </div> : null
                    }
                    {
                        selectUsers ? 
                            <div className='selectActiveUsersContainer'>
                                <div className='ActiveUsersContainer'>
                                    {
                                        activeUsers.map(user => <button key={uuid()} className='selectActiveUser' onClick={() => {
                                            setNewGroup({
                                                ...newGroup,
                                                users : [...newGroup.users, user]
                                            });
                                        }}>{user.username}</button>)
                                    }
                                </div>
                                <button
                                    className='selectUserBtn'
                                    onClick={() => {
                                        setSelectUsers(false);
                                        createGroup();
                                    }}
                                >
                                        <AiOutlineCheck size='2rem'/>
                                </button>
                            </div> : null
                    }
                    <div>
                        {
                            allGroups ? 
                                allGroups.map(group => 
                                    <h4 
                                        key={group.id}
                                        className={allChats[group.id] 
                                            ? allChats[group.id].newMessage
                                                ? 'newMessage activeUser'
                                                : 'activeUser'
                                            : 'visible'}
                                        onClick={() => getChats(group)}>
                                            {group.name}
                                    </h4>
                                ) : null
                        }
                    </div>
                </div>
            </Sider>
            <Layout className="site-layout">
            <Header>
                <h1 className='Logo'>Messenger</h1>
            </Header>
            <Content className='ChatBoxMainContainer'>
                {
                    chats ? <ChatBox user={userChat}/> : null
                }
            </Content>
            <Footer
                style={{
                textAlign: 'center',
                }}
            >
                TECHOSTO ©2022 Created by TECHOSTO
            </Footer>
            </Layout>
        </Layout>
    )
}

export default Home;