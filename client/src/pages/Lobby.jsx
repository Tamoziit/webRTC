import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";

const Lobby = () => {
  const [email, setEmail] = useState('');
  const [room, setRoom] = useState('');
  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback((e) => {
    e.preventDefault();
    socket.emit('room:join', { email, room })
  }, [email, room, socket]);

  const handleJoinRoom = useCallback((data) => {
    const { email, room } = data;
    navigate(`/room/${room}`);
  }, [navigate]);

  useEffect(() => {
    socket.on('room:join', handleJoinRoom);
    return () => {
      socket.off('room:join', handleJoinRoom); //cleanup func. to prevent multiple listeners from single point at each component render at client side, by de-listening a listener
    }
  }, [socket, handleJoinRoom]);

  return (
    <div>
      <h1>Lobby</h1>

      <form onSubmit={handleSubmitForm}>
        <label htmlFor="email">
          Email ID&nbsp;&nbsp;
        </label>
        <input
          type="email"
          id="email"
          placeholder=" eg: janedoe@gmail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <br />
        <label htmlFor="room">
          Room Number&nbsp;&nbsp;
        </label>
        <input
          type="text"
          id="room"
          placeholder=" eg: 11"
          value={room}
          onChange={e => setRoom(e.target.value)}
        />
        <br />
        <br />
        <button>Join</button>
      </form>
    </div>
  )
}

export default Lobby