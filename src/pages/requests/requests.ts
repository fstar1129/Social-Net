import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import { DataProvider } from '../../providers/data';
import { FirebaseProvider } from '../../providers/firebase';
import {AngularFireDatabase} from 'angularfire2/database';
import { AlertProvider } from '../../providers/alert';
import { LoadingProvider } from '../../providers/loading';
import { UserInfoPage } from '../user-info/user-info';

@Component({
  selector: 'page-requests',
  templateUrl: 'requests.html'
})
export class RequestsPage {
  private friendRequests: any;
  private requestsSent: any;
  private alert: any;
  private account: any;
  // RequestsPage
  // This is the page where the user can see their friend requests sent and received.
  constructor(public navCtrl: NavController, public navParams: NavParams, public dataProvider: DataProvider, public alertCtrl: AlertController, public angularDb:AngularFireDatabase,
    public loadingProvider: LoadingProvider, public alertProvider: AlertProvider, public firebaseProvider: FirebaseProvider) { }

  ionViewDidLoad() {
    this.loadingProvider.show();
    // Get user info
    this.dataProvider.getCurrentUser().subscribe((account) => {
      this.account = account;
      // Get friendRequests and requestsSent of the user.
      this.dataProvider.getRequests(this.account.userId).subscribe((requests) => {
        // friendRequests.
        if (requests.friendRequests) {
          this.friendRequests = [];
          requests.friendRequests.forEach((userId) => {
            this.dataProvider.getUser(userId).subscribe((sender) => {
              this.addOrUpdateFriendRequest(sender);
            });
          });
        } else {
          this.friendRequests = [];
        }
        // requestsSent.
        if (requests.requestsSent) {
          this.requestsSent = [];
          requests.requestsSent.forEach((userId) => {
            this.dataProvider.getUser(userId).subscribe((receiver) => {
              this.addOrUpdateRequestSent(receiver);
            });
          });
        } else {
          this.requestsSent = [];
        }
        this.loadingProvider.hide();
      });
    });
  }

  // Add or update friend request only if not yet friends.
  addOrUpdateFriendRequest(sender) {
    if (!this.friendRequests) {
      this.friendRequests = [sender];
    } else {
      var index = -1;
      for (var i = 0; i < this.friendRequests.length; i++) {
        if (this.friendRequests[i].$key == sender.$key) {
          index = i;
        }
      }
      if (index > -1) {
        if (!this.isFriends(sender.$key))
          this.friendRequests[index] = sender;
      } else {
        if (!this.isFriends(sender.$key))
          this.friendRequests.push(sender);
      }
    }
  }

  // Add or update requests sent only if the user is not yet a friend.
  addOrUpdateRequestSent(receiver) {
    if (!this.requestsSent) {
      this.requestsSent = [receiver];
    } else {
      var index = -1;
      for (var i = 0; i < this.requestsSent.length; i++) {
        if (this.requestsSent[i].$key == receiver.$key) {
          index = i;
        }
      }
      if (index > -1) {
        if (!this.isFriends(receiver.$key))
          this.requestsSent[index] = receiver;
      } else {
        if (!this.isFriends(receiver.$key))
          this.requestsSent.push(receiver);
      }
    }
  }

  // Back
  back() {
    this.navCtrl.pop();
  }

  // Accept Friend Request.
  acceptFriendRequest(user) {
    this.alert = this.alertCtrl.create({
      title: 'Confirm Friend Request',
      message: 'Do you want to accept <b>' + user.name + '</b> as your friend?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Reject Request',
          handler: () => {
            this.firebaseProvider.deleteFriendRequest(user.$key);
          }
        },
        {
          text: 'Accept Request',
          handler: () => {
            this.firebaseProvider.acceptFriendRequest(user.$key);
          }
        }
      ]
    }).present();
  }

  // Cancel Friend Request sent.
  cancelFriendRequest(user) {
    this.alert = this.alertCtrl.create({
      title: 'Friend Request Pending',
      message: 'Do you want to delete your friend request to <b>' + user.name + '</b>?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Delete',
          handler: () => {
            this.firebaseProvider.cancelFriendRequest(user.$key);
          }
        }
      ]
    }).present();
  }

  // Checks if user is already friends with this user.
  isFriends(userId) {
    if (this.account.friends) {
      if (this.account.friends.indexOf(userId) == -1) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  // View user.
  viewUser(userId) {
    this.navCtrl.push(UserInfoPage, { userId: userId });
  }

}
