import { Injectable } from '@angular/core';
import { Platform,AlertController,ModalController,Events } from 'ionic-angular';
import { NativeAudio } from '@ionic-native/native-audio';

import 'rxjs/add/operator/map';
declare var apiRTC: any;
declare var cordova:any;
import { DataProvider } from './data';
import { AlertProvider } from './alert';
/*
  Generated class for the VideoProvider provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/
@Injectable()
export class VideoProvider {
  webRTCClient;
  alert;
  constructor(public platform: Platform,
    public alertCtrl:AlertController,
    public modalCtrl:ModalController,
    public events:Events,
    public dataProvider:DataProvider,
    public alertProvider:AlertProvider,
    private nativeAudio: NativeAudio) {
    this.platform.ready().then(()=>{
      this.nativeAudio.preloadComplex('uniqueI1', 'assets/tone.mp3', 1, 1, 0).then((succ)=>{

      }, (err)=>{
      });
    })
  }

  InitializingRTC(userData){
    if(this.platform.is('android')){
      var permissions = cordova.plugins.permissions;
      // permissions.hasPermission(permissions.CAMERA, this.checkVideoPermissionCallback, null);
      // permissions.hasPermission(permissions.RECORD_AUDIO, this.checkAudioPermissionCallback, null);
      // permissions.hasPermission(permissions.BLUETOOTH_ADMIN, this.checkBluetoothPermissionCallback, null);
    }
    //apiRTC initialization
      apiRTC.init({
        apiKey: "819abef1fde1c833e0601ec6dd4a8226",
        apiCCId :userData.uniqueId,
        nickname:userData.name,
        userData:userData,
        onReady: (e) => {
          this.AddEventListeners();
          this.sessionReadyHandler(e);
        }
      });
  }
  checkVideoPermissionCallback(status){
    var permissions = cordova.plugins.permissions;

    if(!status.hasPermission) {
          var errorCallback = function() {
              alert('Camera permission is not turned on');
          }
          permissions.requestPermission(
          permissions.CAMERA,
          function(status) {
              if(!status.hasPermission) {
                  errorCallback();
              }
          },
          errorCallback);
      }
  }
  checkAudioPermissionCallback(status){
    var permissions = cordova.plugins.permissions;
    if(!status.hasPermission) {
      var errorCallback = function() {
          alert('Audio permission is not turned on');
      }
      permissions.requestPermission(
      permissions.RECORD_AUDIO,
      function(status) {
          if(!status.hasPermission) {
              errorCallback();
          }
      },
      errorCallback);
  }
  }
  checkBluetoothPermissionCallback(status){
    var permissions = cordova.plugins.permissions;

    if(!status.hasPermission) {
          var errorCallback = function() {
              alert('BLUETOOTH permission is not turned on');
          }
          permissions.requestPermission(
          permissions.BLUETOOTH_ADMIN,
          function(status) {
              if(!status.hasPermission) {
                  errorCallback();
              }
          },
          errorCallback);
      }
  }
  sessionReadyHandler(e){
    this.webRTCClient = apiRTC.session.createWebRTCClient({
      status: "status" //Optionnal
    });
    this.dataProvider.setWebRTCClient(this.webRTCClient)
  }
  AddEventListeners(){
      apiRTC.addEventListener("userMediaSuccess", (e) => {
        this.events.publish('userMediaSuccess',e)
      })
      apiRTC.addEventListener("userMediaError", (e) => {
        this.alert.dismiss()
      })
      apiRTC.addEventListener("incomingCall", (e) => {
        this.events.publish('openVideocall');
        this.nativeAudio.loop('uniqueI1').then((succ)=>{
        }, (err)=>{
        });
        this.alert = this.alertCtrl.create({
        title: 'INCOMING CALL ',
        // subTitle: '<img src="assets/calling.gif"><br><p>Call from 96325 ...</p>',
        subTitle: '<img src="assets/call-me.gif"><br><p>Call from '+e.detail.callerNickname+' ...</p>',
        cssClass:'outgoingcall incomingcall',
        enableBackdropDismiss:false,
        buttons: [
          {
            text: 'Reject',
            role: 'cancel',
            cssClass:'reject',
            handler: () => {
              this.nativeAudio.stop('uniqueI1')
              this.RejectCall(e.detail.callId);
            }
          },
          {
            text: 'Answer',
            cssClass:'answer',
            handler: () => {
              this.nativeAudio.stop('uniqueI1')
              this.AnswerCall(e.detail.callId);

            }
          }
        ]
        });
        this.alert.present();
      })
      apiRTC.addEventListener("hangup", (e) => {
        this.events.publish('hangup',e);
        this.alertProvider.showToast(e.detail.reason);
        this.nativeAudio.stop('uniqueI1')

        this.alert.dismiss();
      })
      apiRTC.addEventListener("remoteStreamAdded", (e) => {
        this.events.publish('remoteStreamAdded',e)
        this.alert.dismiss();

      })
      apiRTC.addEventListener("webRTCClientCreated", (e) => {
        this.webRTCClient.setAllowMultipleCalls(true);
        this.webRTCClient.setVideoBandwidth(300);
        this.webRTCClient.setUserAcceptOnIncomingCall(true);
      })
  }
  MakeCall(calleeId) {
    this.events.publish('openVideocall')
    var callId = this.webRTCClient.call(calleeId);
    if (callId != null) {
      //this.incomingCallId = callId;
      this.dataProvider.setIncomingCallId(callId)
      this.alert = this.alertCtrl.create({
          title:"OUTGOING CALL",
          subTitle: '<img src="assets/call-me.gif"><br><p>Call to '+callId+'</p>',
          buttons: [ {
            text: 'Dismiss',
            role: 'cancel',
            handler: () => {
              this.RejectCall(callId)
            }
          }],
          cssClass:'outgoingcall ',
          enableBackdropDismiss:false
        });
      this.alert.present();


    }
  }
  AnswerCall(incomingCallId) {
    this.dataProvider.setIncomingCallId(incomingCallId)
    this.webRTCClient.acceptCall(incomingCallId);
  }
  _webRTCClinetref(){
    return this.webRTCClient
  }

  RejectCall(incomingCallId) {
    this.alert.dismiss();
    this.webRTCClient.refuseCall(incomingCallId);
    this.events.publish('rejectCall',incomingCallId)
    // this.RemoveMediaElements(incomingCallId);
  }


}
