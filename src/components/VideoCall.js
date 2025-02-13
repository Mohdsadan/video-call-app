import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import "./VideoCall.css"

const VideoCall = () => {
    const [peerId, setPeerId] = useState("");
    const [remotePeerId, setRemotePeerId] = useState("");
    const [muted, setMuted] = useState(false);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [stream, setStream] = useState(null);
    const peerInstance = useRef(null);
    const videoRef = useRef(null);
    const remoteVideoRef = useRef(null);
  
    useEffect(() => {
      // Initialize Peer
      const peer = new Peer();
      peerInstance.current = peer;
  
      peer.on("open", (id) => {
        setPeerId(id);
        console.log("My Peer ID:", id);
      });
  
      // Get User Media (Webcam & Audio)
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((userStream) => {
          setStream(userStream);
          if (videoRef.current) {
            videoRef.current.srcObject = userStream;
          }
        })
        .catch((err) => console.error("Error accessing media devices:", err));
  
      // Handle incoming call
      peer.on("call", (call) => {
        console.log("Receiving a call...");
        if (!stream) return;
  
        call.answer(stream); // Answer with local stream
  
        call.on("stream", (remoteStream) => {
          console.log("Remote stream received");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
        });
  
        call.on("close", () => {
          console.log("Call closed.");
        });
      });
  
      return () => {
        peer.disconnect();
      };
    }, []);
  
    const callPeer = () => {
      if (!stream) {
        console.error("Stream not available.");
        return;
      }
      if (!remotePeerId) {
        alert("Please enter a valid Peer ID!");
        return;
      }
  
      console.log("Calling Peer:", remotePeerId);
      const call = peerInstance.current.call(remotePeerId, stream);
  
      call.on("stream", (remoteStream) => {
        console.log("Remote stream received from call.");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });
  
      call.on("error", (err) => {
        console.error("Call error:", err);
      });
    };
  
    const toggleMute = () => {
      stream.getAudioTracks().forEach((track) => (track.enabled = !muted));
      setMuted(!muted);
    };
  
    const toggleVideo = () => {
      stream.getVideoTracks().forEach((track) => (track.enabled = !videoEnabled));
      setVideoEnabled(!videoEnabled);
    };
  
    const shareScreen = async () => {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
  
        const sender = stream.getVideoTracks()[0];
        sender.stop(); // Stop webcam video
  
        setStream(screenStream);
        if (videoRef.current) {
          videoRef.current.srcObject = screenStream;
        }
      } catch (error) {
        console.error("Error sharing screen:", error);
      }
    };
  
    return (
      <div className="video-call-container">
        <h2>Your ID: {peerId}</h2>
        <input
          type="text"
          value={remotePeerId}
          onChange={(e) => setRemotePeerId(e.target.value)}
          placeholder="Enter Remote Peer ID"
        />
        <button onClick={callPeer}>Call</button>
        <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
        <button onClick={toggleVideo}>{videoEnabled ? "Disable Video" : "Enable Video"}</button>
        <button onClick={shareScreen}>Share Screen</button>
        <div className="video-wrapper">
          <video ref={videoRef} autoPlay muted playsInline className="local-video" />
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
        </div>
      </div>
    );
  };
  
  export default VideoCall;