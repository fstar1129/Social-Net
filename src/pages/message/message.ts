import { Component, ViewChild } from '@angular/core';
import { NavController, NavParams, Content, AlertController, ModalController, ActionSheetController } from 'ionic-angular';
import { DataProvider } from '../../providers/data';
import { LoadingProvider } from '../../providers/loading';
import { ImageProvider } from '../../providers/image';
import { AngularFireDatabase } from 'angularfire2/database';
import * as firebase from 'firebase';
import { UserInfoPage } from '../user-info/user-info';
import { ImageModalPage } from '../image-modal/image-modal';
import { AlertProvider } from '../../providers/alert';
import { Camera } from '@ionic-native/camera';
import { Keyboard } from '@ionic-native/keyboard';
import { VideoProvider } from '../../providers/video';
import { AdMobFree, AdMobFreeBannerConfig, AdMobFreeInterstitialConfig } from '@ionic-native/admob-free';
import { SocialSharing } from '@ionic-native/social-sharing';
import { MediaCapture, MediaFile, CaptureError, CaptureImageOptions } from '@ionic-native/media-capture';
import { AudioProvider } from 'ionic-audio';
import { File } from '@ionic-native/file';
import _ from 'lodash';


@Component({
  selector: 'page-message',
  templateUrl: 'message.html'
})
export class MessagePage {
  @ViewChild(Content) content: Content;
  private userId: any;
  private title: any;
  private message: any;
  private conversationId: any;
  private messages: any;
  private alert: any;
  private updateDateTime: any;
  private messagesToShow: any;
  private startIndex: any = -1;
  private scrollDirection: any = 'bottom';
  // Set number of messages to show.
  private numberOfMessages = 10;
  private toUserUniqueId;
  isOnline;

  myTracks: any;
  allTracks: any;
  selectedTrack: any;
  // MessagePage
  // This is the page where the user can chat with a friend.
  constructor(public navCtrl: NavController, public navParams: NavParams, public actionSheetCtrl: ActionSheetController,
    private socialSharing: SocialSharing, private mediaCapture: MediaCapture, private file: File,
    public dataProvider: DataProvider, public angularDb: AngularFireDatabase, public admob: AdMobFree,
    public alertProvider: AlertProvider,    
    public loadingProvider: LoadingProvider, public alertCtrl: AlertController, public imageProvider: ImageProvider, public modalCtrl: ModalController, public camera: Camera,
    public keyboard: Keyboard, public videoProvider: VideoProvider, private _audioProvider: AudioProvider) {
    // this.myTracks = [{
    //    src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t12-MP3-V0.mp3',
    //  },
    //  {
    //    src: 'https://archive.org/download/JM2013-10-05.flac16/V0/jm2013-10-05-t30-MP3-V0.mp3',
    //  }];
  }

  ionViewDidLoad() {
    this.userId = this.navParams.get('userId');
    this.launchInterstitial()
    // Get friend details.
    this.dataProvider.getUser(this.userId).subscribe((user) => {
      this.title = user.name;
      this.toUserUniqueId = user.uniqueId;
      this.isOnline = user.isOnline;
    });

    // Get conversationInfo with friend.
    this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/conversations/' + this.userId).subscribe((conversation) => {
      if (conversation.$exists()) {
        // User already have conversation with this friend, get conversation
        this.conversationId = conversation.conversationId;

        // Get conversation
        this.dataProvider.getConversationMessages(this.conversationId).subscribe((messages) => {
          if (this.messages) {
            // Just append newly added messages to the bottom of the view.
            if (messages.length > this.messages.length) {
              let message = messages[messages.length - 1];
              this.dataProvider.getUser(message.sender).subscribe((user) => {
                message.avatar = user.img;
                message.isOnline = user.isOnline;
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
                message.isOnline = user.isOnline;

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
      that.updateDateTime = setInterval(function () {
        if (that.messages) {
          that.messages.forEach((message) => {
            let date = message.date;
            message.date = new Date(date);
          });
        }
      }, 60000);
    }
  }

  launchInterstitial() {

    let interstitialConfig: AdMobFreeInterstitialConfig = {
      isTesting: true, // Remove in production
      autoShow: true
      //id: Your Ad Unit ID goes here
    };

    this.admob.interstitial.config(interstitialConfig);

    this.admob.interstitial.prepare().then(() => {
      // success
    });

  }

  // Load previous messages in relation to numberOfMessages.
  loadPreviousMessages() {
    var that = this;
    // Show loading.
    this.loadingProvider.show();
    setTimeout(function () {
      // Set startIndex to load more messages.
      if ((that.startIndex - that.numberOfMessages) > -1) {
        that.startIndex -= that.numberOfMessages;
      } else {
        that.startIndex = 0;
      }
      // Refresh our messages list.
      that.messages = null;
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

  // Check if currentPage is active, then update user's messagesRead.
  setMessagesRead(messages) {
    if (this.navCtrl.getActive().instance instanceof MessagePage) {
      // Update user's messagesRead on database.
      var totalMessagesCount;
      this.dataProvider.getConversationMessages(this.conversationId).subscribe((messages) => {
        totalMessagesCount = messages.length;
      });
      this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/conversations/' + this.userId).update({
        messagesRead: totalMessagesCount
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

  // Scroll to bottom of page after a short delay.
  scrollBottom() {
    var that = this;
    setTimeout(function () {
      that.content.scrollToBottom();
    }, 300);
  }

  // Scroll to top of the page after a short delay.
  scrollTop() {
    var that = this;
    setTimeout(function () {
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

  // Back
  back() {
    this.navCtrl.pop();
  }

  // Send message, if there's no conversation yet, create a new conversation.
  send() {
    if (this.message) {
      // User entered a text on messagebox
      if (this.conversationId) {
        // Add Message to the existing conversation
        // Clone an instance of messages object so it will not directly be updated.
        // The messages object should be updated by our observer declared on ionViewDidLoad.
        let messages = JSON.parse(JSON.stringify(this.messages));
        messages.push({
          date: new Date().toString(),
          sender: firebase.auth().currentUser.uid,
          type: 'text',
          message: this.message,
          id: new Date().getTime()
        });
        // Update conversation on database.
        this.dataProvider.getConversation(this.conversationId).update({
          messages: messages
        });
        // Clear messagebox.
        this.message = '';
      } else {
        // New Conversation with friend.
        var messages = [];
        messages.push({
          date: new Date().toString(),
          sender: firebase.auth().currentUser.uid,
          type: 'text',
          message: this.message,
          id: new Date().getTime()
        });
        var users = [];
        users.push(firebase.auth().currentUser.uid);
        users.push(this.userId);
        // Add conversation.
        this.angularDb.list('conversations').push({
          dateCreated: new Date().toString(),
          messages: messages,
          users: users
        }).then((success) => {
          let conversationId = success.key;
          this.message = '';
          // Add conversation reference to the users.
          this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/conversations/' + this.userId).update({
            conversationId: conversationId,
            messagesRead: 1
          });
          this.angularDb.object('/accounts/' + this.userId + '/conversations/' + firebase.auth().currentUser.uid).update({
            conversationId: conversationId,
            messagesRead: 0
          });
        });
      }
    }
  }

  // View user info
  viewUser(userId) {
    this.navCtrl.push(UserInfoPage, { userId: userId });
  }

  // Send photoMessage.
  sendPhoto() {
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
            // Upload image then return the url.
            this.imageProvider.uploadPhotoMessage(this.conversationId, this.camera.PictureSourceType.PHOTOLIBRARY).then((url) => {
              // Process image message.
              this.sendPhotoMessage(url);
            });
          }
        },
        {
          text: 'Take Photo',
          handler: () => {
            // Upload image then return the url.
            this.imageProvider.uploadPhotoMessage(this.conversationId, this.camera.PictureSourceType.CAMERA).then((url) => {
              // Process image message.
              this.sendPhotoMessage(url);
            });
          }
        }
      ]
    }).present();
  }

  // Process photoMessage on database.
  sendPhotoMessage(url) {
    if (this.conversationId) {
      // Add image message to existing conversation.
      let messages = JSON.parse(JSON.stringify(this.messages));
      messages.push({
        date: new Date().toString(),
        sender: firebase.auth().currentUser.uid,
        type: 'image',
        url: url,
        id: new Date().getTime()
      });
      // Update conversation on database.
      this.dataProvider.getConversation(this.conversationId).update({
        messages: messages
      });
    } else {
      // Create new conversation.
      var messages = [];
      messages.push({
        date: new Date().toString(),
        sender: firebase.auth().currentUser.uid,
        type: 'image',
        url: url,
        id: new Date().getTime()
      });
      var users = [];
      users.push(firebase.auth().currentUser.uid);
      users.push(this.userId);
      // Add conversation.
      this.angularDb.list('conversations').push({
        dateCreated: new Date().toString(),
        messages: messages,
        users: users
      }).then((success) => {
        let conversationId = success.key;
        // Add conversation references to users.
        this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/conversations/' + this.userId).update({
          conversationId: conversationId,
          messagesRead: 1
        });
        this.angularDb.object('/accounts/' + this.userId + '/conversations/' + firebase.auth().currentUser.uid).update({
          conversationId: conversationId,
          messagesRead: 0
        });
      });
    }
  }

  // Enlarge image messages.
  enlargeImage(img) {
    let imageModal = this.modalCtrl.create(ImageModalPage, { img: img });
    imageModal.present();
  }

  videoCall() {
    this.videoProvider.MakeCall(this.toUserUniqueId)
  }

  share(message) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Share Message',
      buttons: [
        {
          text: 'Share',
          role: 'share',
          handler: () => {
            // share message 
            // Check if sharing via email is supported
            if (message.type == 'text') {
              this.socialSharing.share(message.message, "", "", "").then(() => {
                // Sharing via email is possible
              }).catch(() => {
                // Sharing via email is not possible
              });
            } else {
              this.socialSharing.share(message.message, "Communicater Share", message.url.toString(), message.url).then(() => {
                // Sharing via email is possible
              }).catch(() => {
                // Sharing via email is not possible
              });
            }

          }
        },
        {
          text: 'Delete',
          role: 'share',
          handler: () => {
            this.deleteMessage(message)
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

  audioRec() {
    let options: CaptureImageOptions = { limit: 1 };
    this.mediaCapture.captureAudio(options)
      .then(
        (data: MediaFile[]) => {
          this.updateAudioFile(data[0])
        },
        (err: CaptureError) => {
        }
      );
  }

  updateAudioFile(data) {
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
        firebase.storage().ref().child('audio/' + this.userId + this.generateAudioname()).put(audioBlob, metadata).then((snapshot) => {
          let url = snapshot.metadata.downloadURLs[0];
          this.sendAudioMessage(url)
        }, (error) => {
          //alert('err'+error)
        })

      }, (error) => {
      })

  }

  // Process photoMessage on database.
  sendAudioMessage(url) {
    if (this.conversationId) {
      // Add image message to existing conversation.
      let messages = JSON.parse(JSON.stringify(this.messages));
      messages.push({
        date: new Date().toString(),
        sender: firebase.auth().currentUser.uid,
        type: 'audio',
        src: url,
        id: new Date().getTime()
      });
      // Update conversation on database.
      this.dataProvider.getConversation(this.conversationId).update({
        messages: messages
      });
      this.scrollDirection = 'bottom';
    } else {
      // Create new conversation.
      var messages = [];
      messages.push({
        date: new Date().toString(),
        sender: firebase.auth().currentUser.uid,
        type: 'audio',
        src: url,
        id: new Date().getTime()
      });
      var users = [];
      users.push(firebase.auth().currentUser.uid);
      users.push(this.userId);
      // Add conversation.
      this.angularDb.list('conversations').push({
        dateCreated: new Date().toString(),
        messages: messages,
        users: users
      }).then((success) => {
        let conversationId = success.key;
        // Add conversation references to users.
        this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/conversations/' + this.userId).update({
          conversationId: conversationId,
          messagesRead: 1
        });
        this.angularDb.object('/accounts/' + this.userId + '/conversations/' + firebase.auth().currentUser.uid).update({
          conversationId: conversationId,
          messagesRead: 0
        });
        this.scrollDirection = 'bottom';
      });
    }
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

  deleteMessage(data) {
    console.log('message', data)
    if (data.id) {
      let messages = JSON.parse(JSON.stringify(this.messages));
      console.log("messages before", messages)
      _.remove(messages, (n) => {
        let mes = <any>n;
        return mes.id == data.id
      });
      console.log("messages after", messages)

      
      _.remove(this.messagesToShow, (n) => {
        let mes = <any>n;
        return mes.id == data.id
      });

      // Update conversation on database.
      this.dataProvider.getConversation(this.conversationId).update({
        messages: messages
      });
    } else {
      this.alertProvider.showToast("Something want to wrong please try again.");''
    }

  }
}
