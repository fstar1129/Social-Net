import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content, ModalController, AlertController, ActionSheetController } from 'ionic-angular';
import { DataProvider } from '../../providers/data';
import { ImageProvider } from '../../providers/image';
import { LoadingProvider } from '../../providers/loading';
import * as firebase from 'firebase';
import { UserInfoPage } from '../user-info/user-info';
import { GroupInfoPage } from '../group-info/group-info';
import { ImageModalPage } from '../image-modal/image-modal';
import { AngularFireModule } from 'angularfire2';
import { Camera } from '@ionic-native/camera';
import { Keyboard } from '@ionic-native/keyboard';
import {AngularFireDatabase} from 'angularfire2/database';
import { SocialSharing } from '@ionic-native/social-sharing';
import _ from 'lodash'
import { AudioProvider } from 'ionic-audio';
import { MediaCapture, MediaFile, CaptureError, CaptureImageOptions } from '@ionic-native/media-capture';
import { File } from '@ionic-native/file';

@Component({
  selector: 'page-group',
  templateUrl: 'group.html'
})
export class GroupPage {
  @ViewChild(Content) content: Content;
  private title: any;
  private groupId: any;
  private message: any;
  private messages: any;
  private alert: any;
  private updateDateTime: any;
  private subscription: any;
  private messagesToShow: any;
  private startIndex: any = -1;
  private scrollDirection: any = 'bottom';
  // Set number of messages to show.
  private numberOfMessages = 10;
  isAdmin:any;  
  myTracks:any;
  allTracks:any;
  selectedTrack:any;
  userId;
  // GroupPage
  // This is the page where the user can chat with other group members and view group info.
  constructor(public navCtrl: NavController, public navParams: NavParams, public dataProvider: DataProvider,
    public modalCtrl: ModalController, public angularfire: AngularFireModule,public angularDb:AngularFireDatabase, public alertCtrl: AlertController,
    public imageProvider: ImageProvider, public loadingProvider: LoadingProvider, public camera: Camera, public keyboard: Keyboard,
    private socialSharing: SocialSharing, public actionSheetCtrl: ActionSheetController,private _audioProvider: AudioProvider,
    private mediaCapture: MediaCapture,private file: File,) { 
    this.myTracks = [{
      src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t12-MP3-V0.mp3',
    },
    {
      src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t30-MP3-V0.mp3',
    }];
  }

  ionViewDidLoad() {
    // Get group details
    this.groupId = this.navParams.get('groupId');
    this.userId =firebase.auth().currentUser.uid;
    this.subscription = this.dataProvider.getGroup(this.groupId).subscribe((group) => {
      if (group.$exists()) {
        if(group.admin){
            let index = _.indexOf(group.admin,firebase.auth().currentUser.uid);
            if(index>-1){
              this.isAdmin = true;
            }
        }
        this.title = group.name;
        // Get group messages
        this.dataProvider.getGroupMessages(group.$key).subscribe((messages) => {
          if (this.messages) {
            // Just append newly added messages to the bottom of the view.
            if (messages.length > this.messages.length) {
              let message = messages[messages.length - 1];

              this.dataProvider.getUser(message.sender).subscribe((user) => {
                message.avatar = user.img;
                message.name = user.name;
              });
              this.messages.push(message);
              // Also append to messagesToShow.
              this.messagesToShow.push(message);
              // Reset scrollDirection to bottom.
              this.scrollDirection = 'bottom';
            }
          } else {
            // Get all messages, this will be used as reference object for messagesToShow.
            this.messages = [];
            messages.forEach((message) => {
              this.dataProvider.getUser(message.sender).subscribe((user) => {
                message.avatar = user.img;
                message.name = user.name;
              });
              this.messages.push(message);
            });
            // Load messages in relation to numOfMessages.
            if (this.startIndex == -1) {
              // Get initial index for numberOfMessages to show.
              if ((this.messages.length - this.numberOfMessages) > 0) {
                this.startIndex = this.messages.length - this.numberOfMessages;
              } else {
                this.startIndex = 0;
              }
            }
            if (!this.messagesToShow) {
              this.messagesToShow = [];
            }
            // Set messagesToShow
            for (var i = this.startIndex; i < this.messages.length; i++) {
              this.messagesToShow.push(this.messages[i]);
            }
            this.loadingProvider.hide();
          }
        });
      }
    });

    // Update messages' date time elapsed every minute based on Moment.js.
    var that = this;
    if (!that.updateDateTime) {
      that.updateDateTime = setInterval(function() {
        if (that.messages) {
          that.messages.forEach((message) => {
            let date = message.date;
            message.date = new Date(date);
          });
        }
      }, 60000);
    }
  }

  // Load previous messages in relation to numberOfMessages.
  loadPreviousMessages() {
    var that = this;
    // Show loading.
    this.loadingProvider.show();
    setTimeout(function() {
      // Set startIndex to load more messages.
      if (that.startIndex - that.numberOfMessages > -1) {
        that.startIndex -= that.numberOfMessages;
      } else {
        that.startIndex = 0;
      }
        // Refresh our messages list. that.messages = null;
      that.messagesToShow = null;
      // Set scroll direction to top.
      that.scrollDirection = 'top';
      // Populate list again.
      that.ionViewDidLoad();
    }, 1000);
  }

  // Update messagesRead when user lefts this page.
  ionViewWillLeave() {
    if (this.messages)
      this.setMessagesRead(this.messages);
  }

  share(message,index){

    if(this.isAdmin){
         let actionSheet = this.actionSheetCtrl.create({
     title: 'Message',
     buttons: [
       {
         text: 'Share',
         role: 'share',
         handler: () => {
           // share message 
           // Check if sharing via email is supported
           if(message.type == 'text'){
             this.socialSharing.share(message.message, "","", "").then(() => {
              // Sharing via email is possible
            }).catch(() => {
              // Sharing via email is not possible
            });
          }else{
            this.socialSharing.share(message.message, "Communicater Share",message.url.toString(),message.url).then(() => {
              // Sharing via email is possible
            }).catch(() => {
              // Sharing via email is not possible
            });
          }
            

         }
       },
       {
           text: 'Delete',
           role: 'delete',
           handler: () => {
             // share message 
               let messages = JSON.parse(JSON.stringify(this.messages));
               messages.splice(index, 1);
                // Update group messages.
                this.dataProvider.getGroup(this.groupId).update({
                  messages: messages
                });
                this.messagesToShow.splice(index,1)
                // Clear messagebox.
                this.message = '';
                  
           }
         },
       {
         text: 'Cancel',
         role: 'cancel',
         handler: () => {
         }
       }
     ]
   });

   actionSheet.present();
    }else{
         let actionSheet = this.actionSheetCtrl.create({
     title: 'Share Message',
     buttons: [
       {
         text: 'Share',
         role: 'share',
         handler: () => {
           // share message 
           // Check if sharing via email is supported
           if(message.type == 'text'){
             this.socialSharing.share(message.message, "","", "").then(() => {
              // Sharing via email is possible
            }).catch(() => {
              // Sharing via email is not possible
            });
          }else{
            this.socialSharing.share(message.message, "",message.url,"").then(() => {
              // Sharing via email is possible
            }).catch(() => {
              // Sharing via email is not possible
            });
          }
            

         }
       },
    
       {
         text: 'Cancel',
         role: 'cancel',
         handler: () => {
         }
       }
     ]
   });

   actionSheet.present();
    }
  }

  // Check if currentPage is active, then update user's messagesRead.
  setMessagesRead(messages) {
    if (this.navCtrl.getActive().instance instanceof GroupPage) {
      // Update user's messagesRead on database.
      this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/groups/' + this.groupId).update({
        messagesRead: this.messages.length
      });
    }
  }

  // Check if 'return' button is pressed and send the message.
  onType(keyCode) {
    if (keyCode == 13) {
      this.keyboard.close();
      this.send();
    }
  }

  // Back
  back() {
    this.subscription.unsubscribe();
    this.navCtrl.pop();
  }

  // Scroll to bottom of page after a short delay.
  scrollBottom() {
    var that = this;
    setTimeout(function() {
      that.content.scrollToBottom();
    }, 300);
  }

  // Scroll to top of the page after a short delay.
  scrollTop() {
    var that = this;
    setTimeout(function() {
      that.content.scrollToTop();
    }, 300);
  }

  // Scroll depending on the direction.
  doScroll() {
    if (this.scrollDirection == 'bottom') {
      this.scrollBottom();
    } else if (this.scrollDirection == 'top') {
      this.scrollTop();
    }
  }

  // Check if the user is the sender of the message.
  isSender(message) {
    if (message.sender == firebase.auth().currentUser.uid) {
      return true;
    } else {
      return false;
    }
  }

  // Check if the message is a system message.
  isSystemMessage(message) {
    if (message.type == 'system') {
      return true;
    } else {
      return false;
    }
  }

  // View user info
  viewUser(userId) {
    this.navCtrl.push(UserInfoPage, { userId: userId });
  }

  // Send text message to the group.
  send() {
    // Clone an instance of messages object so it will not directly be updated.
    // The messages object should be updated by our observer declared on ionViewDidLoad.
    let messages = JSON.parse(JSON.stringify(this.messages));
    messages.push({
      date: new Date().toString(),
      sender: firebase.auth().currentUser.uid,
      type: 'text',
      message: this.message
    });
    // Update group messages.
    this.dataProvider.getGroup(this.groupId).update({
      messages: messages
    });
    // Clear messagebox.
    this.message = '';
  }

  // Enlarge image messages.
  enlargeImage(img) {
    let imageModal = this.modalCtrl.create(ImageModalPage, { img: img });
    imageModal.present();
  }

  // Send photoMessage.
  sendPhoto() {
    // Ask user if they want to take photo or choose from gallery.
    this.alert = this.alertCtrl.create({
      title: 'Send Photo Message',
      message: 'Do you want to take a photo or choose from your photo gallery?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Choose from Gallery',
          handler: () => {
            // Upload the image and return promise.
            this.imageProvider.uploadGroupPhotoMessage(this.groupId, this.camera.PictureSourceType.PHOTOLIBRARY).then((url) => {
              // Process photoMessage on database.
              this.sendPhotoMessage(url);
            });
          }
        },
        {
          text: 'Take Photo',
          handler: () => {
            // Upload the image and return promise.
            this.imageProvider.uploadGroupPhotoMessage(this.groupId, this.camera.PictureSourceType.CAMERA).then((url) => {
              // Process photoMessage on database.
              this.sendPhotoMessage(url);
            });
          }
        }
      ]
    }).present();
  }

  // Process photoMessage on database.
  sendPhotoMessage(url) {
    let messages = JSON.parse(JSON.stringify(this.messages));
    messages.push({
      date: new Date().toString(),
      sender: firebase.auth().currentUser.uid,
      type: 'image',
      url: url
    });
    this.dataProvider.getGroup(this.groupId).update({
      messages: messages
    });
    this.message = '';
  }

  // View group info.
  groupInfo() {
    this.navCtrl.push(GroupInfoPage, { groupId: this.groupId });
  }

  audioRec(){
   let options: CaptureImageOptions = { limit: 1 };
    this.mediaCapture.captureAudio(options)
      .then(
        (data: MediaFile[]) =>{
          this.updateAudioFile(data[0])
        },
        (err: CaptureError) => {
        }
      );
  }

   updateAudioFile(data){
      var path = data.localURL.substr(0, data.localURL.lastIndexOf('/')) + '/';
      this.file.readAsArrayBuffer(path, data.name)
      .then((success) => {
          var audioBlob = new Blob([success], {
            type: "audio/amr"
          });
          var metadata = {
            'contentType': 'audio/amr'
          };
          // Generate filename and upload to Firebase Storage.
          firebase.storage().ref().child('audio/' + this.userId + this.generateAudioname() ).put(audioBlob, metadata).then((snapshot) => {
              let url = snapshot.metadata.downloadURLs[0];
              this.sendAudioMessage(url)
          },(error)=>{
            //alert('err'+error)
          })
          
      },(error)=>{
      })
      
  }
   // Process photoMessage on database.
  sendAudioMessage(url) {
 
    let messages = JSON.parse(JSON.stringify(this.messages));
    messages.push({
      date: new Date().toString(),
      sender: firebase.auth().currentUser.uid,
      type: 'audio',
      src: url
    });
    // Update group messages.
    this.dataProvider.getGroup(this.groupId).update({
      messages: messages
    });
  }

   playSelectedTrack() {
    // use AudioProvider to control selected track 
    this._audioProvider.play(this.selectedTrack);
  }
  
  pauseSelectedTrack() {
     // use AudioProvider to control selected track 
     this._audioProvider.pause(this.selectedTrack);
  }
         
  onTrackFinished(track: any) {
  } 
  // Generate a random filename of length for the image to be uploaded
  generateAudioname() {
    var length = 8;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text + ".amr";
  } 

}
