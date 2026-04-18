import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-hot-toast";
import { axiosErrorToastMessage, isUnauthorizedAxiosError } from "../src/lib/utils.js";

export const ChatContext = createContext(null);

export const ChatProvider = ({children}) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const {socket, axios} = useContext(AuthContext);
    // function to get all users for sidebar
    const getUsers = useCallback(async () => {
        try {
            const {data} = await axios.get('/api/messages/users');
            if (Array.isArray(data)) {
                setUsers(data);
                setUnseenMessages({});
            } else if (data?.users) {
                setUsers(data.users);
                setUnseenMessages(data.unseenMessages || {});
            }
        } catch (error) {
            if (!isUnauthorizedAxiosError(error)) {
                toast.error(axiosErrorToastMessage(error));
            }
        }
    }, [axios]);

    //function to get messages for selected user
    const getMessages = async (userId) => {
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if (Array.isArray(data)) {
                setMessages(data);
            } else if (data?.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            if (!isUnauthorizedAxiosError(error)) {
                toast.error(axiosErrorToastMessage(error));
            }
        }
    };

    //function to send message to selected user
    const sendMessage = async (messageData) => {
        try {
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if (data?.success === false) {
                toast.error(data.message || 'Failed to send message');
                return;
            }
            const newMessage = data?.newMessage ?? data;
            if (newMessage) {
                setMessages((previousMessages) => [...previousMessages, newMessage]);
            }
        } catch (error) {
            if (!isUnauthorizedAxiosError(error)) {
                toast.error(axiosErrorToastMessage(error));
            }
        }
    };

    //function to subscribe to message for selected user
    const subscribeToMessages = useCallback(() => {
        if(!socket) return;
        socket.on('newMessage', (newMessage) => {
            if(selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((previousMessages) => [...previousMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else {
                setUnseenMessages((previousUnseenMessages) => ({
                    ...previousUnseenMessages,
                    [newMessage.senderId] : previousUnseenMessages[newMessage.senderId] ? previousUnseenMessages[newMessage.senderId] + 1 : 1
                }));
            }
        });
    }, [socket, selectedUser, axios]);

    //function to unsuscribe to messages 
    const unsuscribeToMessages = useCallback(() => {
        if(socket) {
            socket.off('newMessage');
        }
    }, [socket]);
    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsuscribeToMessages();
        };
    }, [socket, selectedUser, subscribeToMessages, unsuscribeToMessages]);

    const value = {
       messages,
       users,
       selectedUser,
       getUsers,
       getMessages,
       sendMessage,
       setSelectedUser,
       unseenMessages,
       setUnseenMessages
    };

    return (<ChatContext.Provider value={value}>
        {children}
    </ChatContext.Provider>
    )
};
