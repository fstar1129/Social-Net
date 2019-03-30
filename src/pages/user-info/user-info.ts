import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, AlertController } from 'ionic-angular';
import { DataProvider } from '../../providers/data';
import { LoadingProvider } from '../../providers/loading';
import { FirebaseProvider } from '../../providers/firebase';
import { MessagePage } from '../message/message';
import { ImageModalPage } from '../image-modal/image-modal';
import * as firebase from 'firebase';

@Component({
  selector: 'page-user-info',
  templateUrl: 'user-info.html'
})
export class UserInfoPage {
  private user: any;
  private userId: any;
  private friendRequests: any;
  private requestsSent: any;
  private friends: any;
  private alert: any;
  // UserInfoPage
  // This is the page where the user can view user information, and do appropriate actions based on their relation to the current logged in user.
  constructor(public navCtrl: NavController, public navParams: NavParams, public modalCtrl: ModalController, public dataProvider: DataProvider,
    public loadingProvider: LoadingProvider, public alertCtrl: AlertController, public firebaseProvider: FirebaseProvider) { }

  ionViewDidLoad() {
    this.userId = this.navParams.get('userId');
    this.loadingProvider.show();
    // Get user info.
    this.dataProvider.getUser(this.userId).subscribe((user) => {
      this.user = user;
      this.loadingProvider.hide();
    });
    // Get friends of current logged in user.
    this.dataProvider.getUser(firebase.auth().currentUser.uid).subscribe((user) => {
      this.friends = user.friends;
    });
    // Get requests of current logged in user.
    this.dataProvider.getRequests(firebase.auth().currentUser.uid).subscribe((requests) => {
      this.friendRequests = requests.friendRequests;
      this.requestsSent = requests.requestsSent;
    });
  }

  // Back
  back() {
    this.navCtrl.pop();
  }

  // Enlarge user's profile image.
  enlargeImage(img) {
    let imageModal = this.modalCtrl.create(ImageModalPage, { img: img });
    imageModal.present();
  }

  // Accept friend request.
  acceptFriendRequest() {
    this.alert = this.alertCtrl.create({
      title: 'Confirm Friend Request',
      message: 'Do you want to accept <b>' + this.user.name + '</b> as your friend?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Accept',
          handler: () => {
            this.firebaseProvider.acceptFriendRequest(this.userId);
          }
        }
      ]
    }).present();
  }

  // Deny friend request.
  rejectFriendRequest() {
    this.alert = this.alertCtrl.create({
      title: 'Reject Friend Request',
      message: 'Do you want to reject <b>' + this.user.name + '</b> as your friend?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Reject',
          handler: () => {
            this.firebaseProvider.deleteFriendRequest(this.userId);
          }
        }
      ]
    }).present();
  }

  // Cancel friend request sent.
  cancelFriendRequest() {
    this.alert = this.alertCtrl.create({
      title: 'Friend Request Pending',
      message: 'Do you want to delete your friend request to <b>' + this.user.name + '</b>?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Delete',
          handler: () => {
            this.firebaseProvider.cancelFriendRequest(this.userId);
          }
        }
      ]
    }).present();
  }

  // Send friend request.
  sendFriendRequest() {
    this.alert = this.alertCtrl.create({
      title: 'Send Friend Request',
      message: 'Do you want to send friend request to <b>' + this.user.name + '</b>?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Send',
          handler: () => {
            this.firebaseProvider.sendFriendRequest(this.userId);
          }
        }
      ]
    }).present();
  }

  // Open chat with this user.
  sendMessage() {
    this.navCtrl.push(MessagePage, { userId: this.userId });
  }

  // Check if user can be added, meaning user is not yet friends nor has sent/received any friend requests.
  canAdd() {
    if (this.friendRequests) {
      if (this.friendRequests.indexOf(this.userId) > -1) {
        return false;
      }
    }
    if (this.requestsSent) {
      if (this.requestsSent.indexOf(this.userId) > -1) {
        return false;
      }
    }
    if (this.friends) {
      if (this.friends.indexOf(this.userId) > -1) {
        return false;
      }
    }
    return true;
  }

  // Un friend 
  unFriend(userId){
    this.dataProvider.unFriend(userId)
  }
}
