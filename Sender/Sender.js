(function() {
    var appid = "~screensharing"; //Unique id of your application, must start with a ~
    var matchstickIPAddress = "192.168.1.13"; //IP address of the matchstick
    var receiverAppUrl = "http://192.168.1.4/Basic-WebRTC/Receiver/Receiver.html"; //Url of the page to load on the receiver
    var timeout = -1; //after not communicating with the sender for this many milliseconds return to the default matchstick screen. -1 means don't timeout
    var useInterprocessCommunication = true; //not sure what this means for my application
    var isRunning = false;
    var isPlaying = false;
    var opening = false;
    var closing = false;
    var messageChannel;

    var senderDaemon = new SenderDaemon(matchstickIPAddress, appid); //comes from the sender api, is the object which will be used to communicate with the matchstick

    var shareScreen = document.getElementById("shareScreen");
    var playPause = document.getElementById("playPause");
    var shareType = document.getElementById("shareType");
    var toggleAppStatus = document.getElementById("toggleAppStatus");


    var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    navigator.getUserMedia = navigator.getUserMedia ? "getUserMedia" : navigator.mozGetUserMedia ? "mozGetUserMedia" : navigator.webkitGetUserMedia ? "webkitGetUserMedia" : "getUserMedia";
    var testV = document.createElement("video");
    var SRC_OBJECT = 'srcObject' in testV ? "srcObject" :
                     'mozSrcObject' in testV ? "mozSrcObject" :
                     'webkitSrcObject' in testV ? "webkitSrcObject" : "srcObject";

    var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

    senderDaemon.on("appopened", function (channel) {
        shareScreen.className = "";
        playPause.className = "";
        toggleAppStatus.innerHTML = "Close App";
        isRunning = true;
        opening = false;
        messageChannel = channel;
        messageChannel.on("message", function(message){
            if(message.sdp){
                //message.sdp = JSON.parse('{"type": "answer","sdp": "v=0\\r\\no=Mozilla-SIPUA-32.0 2740 0 IN IP4 0.0.0.0\\r\\ns=SIP Call\\r\\nt=0 0\\r\\na=ice-ufrag:159a30a3\\r\\na=ice-pwd:6662b262b843fe518f19f10a21000a71\\r\\na=fingerprint:sha-256 7D:1E:F0:5A:50:A9:81:26:C2:74:5F:81:4A:EE:D5:E1:70:17:94:16:D6:9B:62:D9:9C:B8:7C:6A:D8:37:DA:30\\r\\nm=application 58561 DTLS/SCTP 5000\\r\\nc=IN IP4 192.168.1.13\\r\\na=sctpmap:5000 webrtc-datachannel 16\\r\\na=setup:actpass\\r\\na=candidate:0 1 UDP 2122252543 192.168.1.13 58561 typ host\\r\\n"}');
                peerConnection.setRemoteDescription(new SessionDescription(message.sdp));
            }
            if(message.candidate)
                peerConnection.addIceCandidate(new IceCandidate(message.candidate));
        });
        start();
        var constraints = {
            offerToReceiveAudio:true,
            offerToReceiveVideo:true
        };
        peerConnection.createOffer(setLocalDescription, logError, constraints);
    });
    senderDaemon.on("appclosed",function (){
        //this doesnt currently work.  I dont see an appclosed event in their code :(
        shareScreen.className = "disabled";
        playPause.className = "disabled";
        toggleAppStatus.innerHTML = "Launch App";
        isRunning = false;
        closing = false;
    });

    toggleAppStatus.onclick  = function(){
        if(opening || closing) return;
        if(isRunning){
            //closing = true;
            senderDaemon.closeApp();
        }
        else{
            opening = true;
            senderDaemon.openApp(receiverAppUrl, timeout, useInterprocessCommunication);
        }
    };

    var peerConnection;
    var candidates = [];

    function start(){
        //var configuration = {'iceServers': [{'url': 'STUN:192.168.1.13'}]};
        configuration = {};
        var options = {};
        peerConnection = new PeerConnection(configuration, options);
        var channelName = "screenSharingTest";
        var channelOptions = {};

        var dc = peerConnection.createDataChannel(channelName, channelOptions);

        peerConnection.onicecandidate = function (e) {
            // candidate exists in e.candidate
            if (!e || !e.candidate) { return }
            candidates.push(e.candidate);
            messageChannel.send(JSON.stringify({"candidate": e.candidate}));
        };
        peerConnection.oniceconnectionstatechange = function(event){
            console.log(event);
        };
    }

    function setLocalDescription(offer) {
        peerConnection.setLocalDescription(offer);
        messageChannel.send(JSON.stringify({sdp:offer}));
    }

    function logError(error) {
        console.log(error.name + ': ' + error.message);
    }

    shareScreen.onclick = function(){

        if(peerConnection.signalingState === "have-remote-pranswer" || peerConnection.signalingState === "stable")
        {
            console.log(peerConnection.signalingState);
            var constraints = {
                video: {
                    mediaSource: 'camera' // 'application' || 'browser' || 'window' || 'screen' || 'camera'
                }
            };

            function callback(localMediaStream) {
                console.log(localMediaStream);
                peerConnection.addStream(localMediaStream);
            }

            function errorCallback(err) {
                console.log("The following error occured: " + err);
            }

            navigator.getUserMedia (constraints, callback, errorCallback);
        }

    }

})();




/*
    var answer = JSON.parse('{"type": "answer","sdp": "v=0\\r\\no=Mozilla-SIPUA-32.0 2740 0 IN IP4 0.0.0.0\\r\\ns=SIP Call\\r\\nt=0 0\\r\\na=ice-ufrag:159a30a3\\r\\na=ice-pwd:6662b262b843fe518f19f10a21000a71\\r\\na=fingerprint:sha-256 7D:1E:F0:5A:50:A9:81:26:C2:74:5F:81:4A:EE:D5:E1:70:17:94:16:D6:9B:62:D9:9C:B8:7C:6A:D8:37:DA:30\\r\\nm=application 58561 DTLS/SCTP 5000\\r\\nc=IN IP4 192.168.1.13\\r\\na=sctpmap:5000 webrtc-datachannel 16\\r\\na=setup:actpass\\r\\na=candidate:0 1 UDP 2122252543 192.168.1.13 58561 typ host\\r\\n"}');

*/