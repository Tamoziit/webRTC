import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from 'react-player';
import peer from "../service/peer";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    //when we call a user
    const offer = await peer.getOffer(); //creating our own offer
    socket.emit("user:call", { to: remoteSocketId, offer }); //pushing our offer to any connected user on the same room
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncomingCall = useCallback(({ from, offer }) => {
    console.log(`Incoming Call`, from, offer);
  }, []);

  useEffect(() => {
    socket.on('user:joined', handleUserJoined);
    socket.on('incoming:call', handleIncomingCall);

    //cleanup
    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('incoming:call', handleIncomingCall);
    }
  }, [socket, handleUserJoined, handleIncomingCall]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
      {remoteSocketId && <button onClick={handleCallUser}>Call</button>}
      {myStream &&
        <>
          <h2>My Stream</h2>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={myStream}
          />
        </>
      }
    </div>
  )
}

export default Room