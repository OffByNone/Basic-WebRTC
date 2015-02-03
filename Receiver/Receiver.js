"use strict";
(function() {

    //if the below two lines are not executed the matchstick will think it
    //failed to open the app and return to the default screen after a timeout

    var receiverManager = new ReceiverManager("~screensharing"); //create a new ReceiverManager with the same app id used in the sender
    var messageChannel = receiverManager.createMessageChannel("screensharing");
    var errors = document.getElementById("errors");
    var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    var SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
    navigator.getUserMedia = navigator.getUserMedia ? "getUserMedia" : navigator.mozGetUserMedia ? "mozGetUserMedia" : navigator.webkitGetUserMedia ? "webkitGetUserMedia" : "getUserMedia";
    var testV = document.createElement("video");
    var SRC_OBJECT = 'srcObject' in testV ? "srcObject" :
                     'mozSrcObject' in testV ? "mozSrcObject" :
                     'webkitSrcObject' in testV ? "webkitSrcObject" : "srcObject";

    var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;
    var peerConnection;
    var candidates = [];
    
    function start(){
        var configuration = {};
        var options = {};
        peerConnection = new PeerConnection(configuration, options);
        var channelName = "screenSharingTest";
        var channelOptions = {};

        peerConnection.createDataChannel(channelName, channelOptions);

         peerConnection.onicecandidate = function (e) {
            // candidate exists in e.candidate
            if (!e || !e.candidate) { return }
            candidates.push(e.candidate);
            errors.innerHTML += JSON.stringify(e.candidate) + "<br />";
            messageChannel.send(JSON.stringify({"candidate": e.candidate}));
        };

        peerConnection.onaddstream = function (evt) {
            video.src = evt;
        };
    }

    function setLocalDescription(offer) {
        peerConnection.setLocalDescription(offer);
        messageChannel.send(JSON.stringify({"sdp": offer}));
    }

    messageChannel.on("message", function(senderId, data){
        var message = JSON.parse(data);
        if(!peerConnection) start();
        
        var constraints = {
            offerToReceiveAudio:true,
            offerToReceiveVideo:true
        };
        
        if(message.sdp)
        {
            try{
            peerConnection.setRemoteDescription(new SessionDescription(message.sdp), function() {
                if (peerConnection.remoteDescription.type == 'offer') {
                    peerConnection.createAnswer(setLocalDescription, logError, constraints);
                }
            },logError);
            }
            catch(e)
            {
                logError(e);
            }
        }
        if(message.candidate)
            peerConnection.addIceCandidate(new IceCandidate(message.candidate));
    });

    function logError(error) {
        errors.innerHTML += error.name + ': ' + error.message + "<br />";
    }

    receiverManager.open();
})();
