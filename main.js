
let localStream;
let remoteStream;
let peerConnection;

let client;
let channel;

let APP_ID = "9aebd21fd5b24c7692b448e0f38df752"

let token = null;
let uid = String(Math.floor(Math.random() * 7777777))



const servers = {
    iceServers:[
        {
            urls:['stun::stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})

    channel = client.createChannel('main-channel')
    await channel.join()

    channel.on('Member joined', handleUserJoined)

    localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
    document.getElementById('user1').srcObject = localStream

    createOffer()
}

let handleUserJoined = async (MemberID) => {
    console.log('A new user joined: ', MemberID)
}

let createOffer = async () => {
    peerConnection = new RTCPeerConnection(servers)
    
    remoteStream = new MediaStream()
    document.getElementById('user2').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack()
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate) {
            console.log('New ICE candidate:', event.candidate)
        }
    }

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    console.log('Offer: ', offer)
}

init()