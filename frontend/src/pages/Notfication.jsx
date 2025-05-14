import React, { useEffect } from 'react';
import { useSocket } from '../components/SocketContext';

function Notifications() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    socket.on('newNotification', (data) => {
      console.log("New notification received:", data);

      const message = `${data.username} tweeted: ${data.tweet}`;

      if (Notification.permission === 'granted') {
        new Notification('New Tweet Alert!', {
          body: message,
        });
      } else {
  toast(message); 
      }
    });

    return () => {
      socket.off('newNotification');
    };
  }, [socket]);

  return null;
}

export default Notifications;
