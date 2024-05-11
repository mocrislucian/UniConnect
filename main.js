let APP_ID = "9aebd21fd5b24c7692b448e0f38df752"

let client;
let channel;

let localStream;
let remoteStream;
let peerConnection;

//user
let token = null;
let uid = String(Math.floor(Math.random() * 10000))

//room
let queryString = window.location.search
let url = new URLSearchParams(queryString)
let roomid = url.get('room')

if(!roomid) {
    window.location = 'lobby.html'
}

let constraints = { 
    video:{
        width:{min:640, ideal:1920, max:4096},
        height:{min:480, ideal:1080, max:2160},
    },
    audio:true
}

const servers = {
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

//create the instance for the users that are joining or leaving
let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    channel = client.createChannel('roomid')
    await channel.join()

    channel.on('Member joined', handleUserJoined)
    channel.on('Member left', handleUserLeft)

    client.on('Message from peer', handleMessageFromPeer)

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user1').srcObject = localStream
}

let handleUserLeft = (MemberId) => {
    document.getElementById('user2').style.display = 'none'
    document.getElementById('user1').classList.remove('smallFrame')
}

let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text)

    if(message.type === 'offer'){
        createAnswer(MemberId, message.offer)
    }

    if(message.type === 'answer'){
        addAnswer(message.answer)
    }

    if(message.type === 'candidate'){
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let handleUserJoined = async (MemberId) => {
    console.log('New user joined: ', MemberId)
    createOffer(MemberId)
}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user2').srcObject = remoteStream
    document.getElementById('user2').style.display = 'block'

    document.getElementById('user1').classList.add('smallFrame')


    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
        }
    }
}

let createOffer = async (MemberId) => {
    await createPeerConnection(MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}

let createAnswer = async (MemberId, offer) => {
    await createPeerConnection(MemberId)
    await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)
}

let addAnswer = async (answer) => {
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }
}

let MicON = async () => {
    console.log(localStream);
    let audio = localStream.getTracks().find(track => track.kind === 'audio')
    console.log(audio);

    if(audio.enabled) {
        audio.enabled = false
        document.getElementById('mic-button').style.backgroundColor = 'rgb(240, 50, 60)'
    } 
    else {
        audio.enabled = true
        document.getElementById('mic-button').style.backgroundColor = 'rgb(179, 102, 249, .10)'
    }
}


let CameraON = async () => {
    let video = localStream.getTracks().find(track => track.kind === 'video')

    if(video.enabled) {
        video.enabled = false;
        document.getElementById('camera-button').style.backgroundColor = 'rgb(240, 50, 60)';
    } 
    else {
        video.enabled = true;
        document.getElementById('camera-button').style.backgroundColor = 'rgb(179, 102, 249, .10)';
    }
}

let leave = async () => {
    await channel.leave()
    await client.logout()
}
document.addEventListener('DOMContentLoaded', function() {
    const microphoneButton = document.getElementById('mic-button');
    const cameraButton = document.getElementById('camera-button');

    if(microphoneButton) {
        microphoneButton.addEventListener('click', MicON)
    }

    if(cameraButton) {
        cameraButton.addEventListener('click', CameraON)
    }
})

window.addEventListener('beforeleave', leave)

init()