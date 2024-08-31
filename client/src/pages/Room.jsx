import { useEffect } from "react";
import { useSocket } from "../context/SocketProvider";

const Room = () => {
  const socket = useSocket();

	useEffect(() => {

	}, [])

  return (
    <div>
        <h1>Room Page</h1>
    </div>
  )
}

export default Room