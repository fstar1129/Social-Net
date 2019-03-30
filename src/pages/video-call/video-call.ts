import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams,Events,ViewController } from 'ionic-angular';
import { DataProvider } from '../../providers/data'
/**
 * Generated class for the VideoCallPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
// @IonicPage()
@Component({
  selector: 'page-video-call',
  templateUrl: 'video-call.html',
})
export class VideoCallPage {
  webRTCClient;
  showRemoteVideo= false;
  showHangup = false;
  isVideoMute;
  isAudioMute;
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public events:Events,
    public dataProvider: DataProvider,
    public viewCtrl: ViewController) {
    this.webRTCClient =  this.dataProvider.getwebRTCClient();
    this.events.subscribe('userMediaSuccess',(e)=>{
      this.webRTCClient.addStreamInDiv(e.detail.stream, e.detail.callType, "mini", 'miniElt-' + e.detail.callId, {
        width: "128px",
        height: "128px"
      }, true);
    })
    this.events.subscribe('remoteStreamAdded',(e)=>{
      this.showHangup = true;
      this.showRemoteVideo = true;
      setTimeout(()=>{
        this.webRTCClient.addStreamInDiv(e.detail.stream, e.detail.callType, "remote", 'remoteElt-' + e.detail.callId, {
          width: "100%",
          height: "100%"
        }, false);
      },2000)

    })

    this.events.subscribe('hangup',(e)=>{
      this.RemoveMediaElements(e.detail.callId);
    })

    this.events.subscribe('rejectCall',(e)=>{
      this.RemoveMediaElements(e);
    })
  }

  ionViewDidLoad() {
  }
  ionViewWillLeave(){
    this.events.unsubscribe('userMediaSuccess')
    this.events.unsubscribe('remoteStreamAdded')
    this.events.unsubscribe('hangup')
    this.events.unsubscribe('rejectCall')
    this.HangUp();
    let callId = this.dataProvider.getIncomingCallid();
    this.RemoveMediaElements(callId);
  }
  RemoveMediaElements(callId) {
    
    this.webRTCClient.removeElementFromDiv('mini', 'miniElt-' + callId);
    this.webRTCClient.removeElementFromDiv('remote', 'remoteElt-' + callId);
     this.viewCtrl.dismiss();
  }
  HangUp(){
    let callId = this.dataProvider.getIncomingCallid();
    this.webRTCClient.hangUp(callId);
  }

  toggleAudioMute(){
    this.webRTCClient.toggleAudioMute();
    this.isAudioMute = this.webRTCClient.isAudioMuted();
  }

  toggleVideoMute(){
    this.webRTCClient.toggleVideoMute();
    this.isVideoMute = this.webRTCClient.isVideoMuted();
  }



}
