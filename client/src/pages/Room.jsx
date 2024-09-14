/* eslint-disable no-unused-vars */
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "../context/SocketProvider";
import ReactPlayer from 'react-player';
import peer from "../service/peer";

const Room = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState();

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

  const handleIncomingCall = useCallback(async ({ from, offer }) => {
    setRemoteSocketId(from);
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    setMyStream(stream);

    const ans = await peer.getAnswer(offer);
    socket.emit('call:accepted', { to: from, ans });
  }, [socket]);

  const sendStreams = useCallback(() => {
    if (peer.peer) {
      const senders = peer.peer.getSenders();
      myStream.getTracks().forEach((track, idx) => {
        if (senders[idx]) {
          senders[idx].replaceTrack(track); // Replace track instead of adding
        } else {
          peer.peer.addTrack(track, myStream); // Add track only if it doesn't exist
        }
      });
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(({ from, ans }) => {
    peer.setLocalDescription(ans);
    console.log("Call Accepted!");
    sendStreams();
  }, [sendStreams]);

  useEffect(() => {
    //listener to handle mutually transferred tracks
    peer.peer.addEventListener('track', async (ev) => {
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
      console.log(ev.streams)
    });
  }, []);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit('peer:nego:needed', { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    //Reconnecting or negotiating the two connected clients
    peer.peer.addEventListener('negotiationneeded', handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded); //de-registering event
    }
  }, [handleNegoNeeded]);

  const handleNegoIncoming = useCallback(async ({ from, offer }) => {
    const ans = await peer.getAnswer(offer);
    socket.emit('peer:nego:done', { to: from, ans });
  }, [socket]);

  const handleNegoFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    //socket registrations
    socket.on('user:joined', handleUserJoined);
    socket.on('incoming:call', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('peer:nego:needed', handleNegoIncoming);
    socket.on('peer:nego:final', handleNegoFinal);

    //cleanup or de-registrations
    return () => {
      socket.off('user:joined', handleUserJoined);
      socket.off('incoming:call', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('peer:nego:needed', handleNegoIncoming);
      socket.off('peer:nego:final', handleNegoFinal);
    }
  }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleNegoIncoming, handleNegoFinal]);

  return (
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
      {myStream && <button onClick={sendStreams}>Send Stream</button>}
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
      {remoteStream &&
        <>
          <h2>Remote Stream</h2>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={remoteStream}
          />
        </>
      }
    </div>
  )
}

export default Room