import { Component } from '@angular/core';
import { NavController, NavParams, ModalController, AlertController, ActionSheetController } from 'ionic-angular';
import { DataProvider } from '../../providers/data';
import { LoadingProvider } from '../../providers/loading';
import { ImageProvider } from '../../providers/image';
import { AlertProvider } from '../../providers/alert';
import { ImageModalPage } from '../image-modal/image-modal';
import { AddMembersPage } from '../add-members/add-members';
import { UserInfoPage } from '../user-info/user-info';
import * as firebase from 'firebase';
import {AngularFireDatabase} from 'angularfire2/database';
import { Camera } from '@ionic-native/camera';
import _ from 'lodash'
@Component({
  selector: 'page-group-info',
  templateUrl: 'group-info.html'
})
export class GroupInfoPage {
  private groupId: any;
  private group: any;
  private groupMembers: any;
  private alert: any;
  private user: any;
  private subscription: any;
  isAdmin:any;
  // GroupInfoPage
  // This is the page where the user can view group information, change group information, add members, and leave/delete group.
  constructor(public navCtrl: NavController, public navParams: NavParams, public dataProvider: DataProvider,
    public loadingProvider: LoadingProvider, public modalCtrl: ModalController, public alertCtrl: AlertController,
    public alertProvider: AlertProvider,public angularDb:AngularFireDatabase, public imageProvider: ImageProvider, public camera: Camera,
     public actionSheetCtrl: ActionSheetController) { }

  ionViewDidLoad() {
    // Initialize
    this.groupId = this.navParams.get('groupId');

    // Get group details.
    this.subscription = this.dataProvider.getGroup(this.groupId).subscribe((group) => {
      if (group.$exists()) {
        this.loadingProvider.show();
        this.group = group;
        if(group.admin){
            let index = _.indexOf(group.admin,firebase.auth().currentUser.uid);
            if(index>-1){
              this.isAdmin = true;
            }
        }
        if (group.members) {
          group.members.forEach((memberId) => {
            this.dataProvider.getUser(memberId).subscribe((member) => {
              this.addUpdateOrRemoveMember(member);
            });
          });
        }
        this.loadingProvider.hide();
      } else {
        // Group is deleted, go back.
        this.navCtrl.popToRoot();
      }
    });

    // Get user details.
    this.dataProvider.getCurrentUser().subscribe((user) => {
      this.user = user;
    });
  }

  // Delete subscription.
  // ionViewDidLeave() {
  //   if(this.deleteSubscription)
  //
  // }

  // check user is admin or not 
  isAdminOrNot(member){
    let index = _.indexOf(this.group.admin,member.userId);
    if(index>-1){
      return true
    } else {
      return false;
    }
  }

  // Assign new addmin 
  assignNewAdmin(member){
    if(this.isAdmin && this.user.userId !== member.userId){

      if(this.isAdminOrNot(member)){
       let actionSheet = this.actionSheetCtrl.create({
         title: 'Remove Admin',
         buttons: [
           {
             text: 'Remove Admin',
             role: 'share',
             handler: () => {
               // share message 
               // Check if sharing via email is supported
                this.loadingProvider.show();

                let index = _.indexOf(this.group.admin,member.userId);
                if(index>=0){
                   this.group.messages.push({
                    date: new Date().toString(),
                    sender: this.user.$key,
                    type: 'system',
                    message: this.user.name + ' has removed ' + member.name + ' as admin.',
                    icon: 'md-contacts'
                  });
                   this.group.admin.splice(index,1);
                   this.dataProvider.getGroup(this.groupId).update({
                    admin: this.group.admin,
                    messages: this.group.messages
                  }).then(() => {
                  // Back.
                  this.loadingProvider.hide();
                  this.navCtrl.pop();
                });
                }else{
                  this.loadingProvider.hide();
                  this.alertProvider.showAlert('Failed',"Member not admin.")
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
      }else{
       let actionSheet = this.actionSheetCtrl.create({
           title: 'Assign New Admin',
           buttons: [
             {
               text: 'Make Admin',
               role: 'share',
               handler: () => {
                 // share message 
                 // Check if sharing via email is supported
                  this.loadingProvider.show();

                  let index = _.indexOf(this.group.admin,member.userId);
                  if(index<0){
                     this.group.messages.push({
                      date: new Date().toString(),
                      sender: this.user.$key,
                      type: 'system',
                      message: this.user.name + ' has make ' + member.name + ' as admin.',
                      icon: 'md-contacts'
                    });
                     let _tempAdmin = this.group.admin;
                     _tempAdmin.push(member.userId)
                     this.dataProvider.getGroup(this.groupId).update({
                      admin: _tempAdmin,
                      messages: this.group.messages
                    }).then(() => {
                    // Back.
                    this.loadingProvider.hide();
                    this.navCtrl.pop();
                  });
                  }else{
                    this.loadingProvider.hide();
                    this.alertProvider.showAlert('Failed',"Member alerday admin.")
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
     
  }

   // Get names of the members to be added to the group.

  // Check if user exists in the group then add/update user.
  // If the user has already left the group, remove user from the list.
  addUpdateOrRemoveMember(member) {
    if (this.group) {
      if (this.group.members.indexOf(member.$key) > -1) {
        // User exists in the group.
        if (!this.groupMembers) {
          this.groupMembers = [member];
        } else {
          var index = -1;
          for (var i = 0; i < this.groupMembers.length; i++) {
            if (this.groupMembers[i].$key == member.$key) {
              index = i;
            }
          }
          // Add/Update User.
          if (index > -1) {
            this.groupMembers[index] = member;
          } else {
            this.groupMembers.push(member);
          }
        }
      } else {
        // User already left the group, remove member from list.
        var index = -1;
        for (var i = 0; i < this.groupMembers.length; i++) {
          if (this.groupMembers[i].$key == member.$key) {
            index = i;
          }
        }
        if (index > -1) {
          this.groupMembers.splice(index, 1);
        }
      }
    }
  }

  // View user info.
  viewUser(userId) {
    if (firebase.auth().currentUser.uid != userId)
      this.navCtrl.push(UserInfoPage, { userId: userId });
  }

  // Back
  back() {
    this.subscription.unsubscribe();
    this.navCtrl.pop();
  }

  // Enlarge group image.
  enlargeImage(img) {
    let imageModal = this.modalCtrl.create(ImageModalPage, { img: img });
    imageModal.present();
  }

  // Change group name.
  setName() {
    this.alert = this.alertCtrl.create({
      title: 'Change Group Name',
      message: "Please enter a new group name.",
      inputs: [
        {
          name: 'name',
          placeholder: 'Group Name',
          value: this.group.name
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Save',
          handler: data => {
            let name = data["name"];
            if (this.group.name != name) {
              this.loadingProvider.show();
              // Add system message.
              this.group.messages.push({
                date: new Date().toString(),
                sender: this.user.$key,
                type: 'system',
                message: this.user.name + ' has changed the group name to: ' + name + '.',
                icon: 'md-create'
              });
              // Update group on database.
              this.dataProvider.getGroup(this.groupId).update({
                name: name,
                messages: this.group.messages
              }).then((success) => {
                this.loadingProvider.hide();
                this.alertProvider.showGroupUpdatedMessage();
              }).catch((error) => {
                this.loadingProvider.hide();
                this.alertProvider.showErrorMessage('group/error-update-group');
              });
            }
          }
        }
      ]
    }).present();
  }

  // Change group image, the user is asked if they want to take a photo or choose from gallery.
  setPhoto() {
    this.alert = this.alertCtrl.create({
      title: 'Set Group Photo',
      message: 'Do you want to take a photo or choose from your photo gallery?',
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Choose from Gallery',
          handler: () => {
            this.loadingProvider.show();
            // Upload photo and set to group photo, afterwards, return the group object as promise.
            this.imageProvider.setGroupPhotoPromise(this.group, this.camera.PictureSourceType.PHOTOLIBRARY).then((group) => {
              // Add system message.
              this.group.messages.push({
                date: new Date().toString(),
                sender: this.user.$key,
                type: 'system',
                message: this.user.name + ' has changed the group photo.',
                icon: 'ios-camera'
              });
              // Update group image on database.
              this.dataProvider.getGroup(this.groupId).update({
                img: group.img,
                messages: this.group.messages
              }).then((success) => {
                this.loadingProvider.hide();
                this.alertProvider.showGroupUpdatedMessage();
              }).catch((error) => {
                this.loadingProvider.hide();
                this.alertProvider.showErrorMessage('group/error-update-group');
              });
            });
          }
        },
        {
          text: 'Take Photo',
          handler: () => {
            this.loadingProvider.show();
            // Upload photo and set to group photo, afterwwards, return the group object as promise.
            this.imageProvider.setGroupPhotoPromise(this.group, this.camera.PictureSourceType.CAMERA).then((group) => {
              // Add system message.
              this.group.messages.push({
                date: new Date().toString(),
                sender: this.user.$key,
                type: 'system',
                message: this.user.name + ' has changed the group photo.',
                icon: 'ios-camera'
              });
              // Update group image on database.
              this.dataProvider.getGroup(this.groupId).update({
                img: group.img,
                messages: this.group.messages
              }).then((success) => {
                this.loadingProvider.hide();
                this.alertProvider.showGroupUpdatedMessage();
              }).catch((error) => {
                this.loadingProvider.hide();
                this.alertProvider.showErrorMessage('group/error-update-group');
              });
            });
          }
        }
      ]
    }).present();
  }

  // Change group description.
  setDescription() {
    this.alert = this.alertCtrl.create({
      title: 'Change Group Description',
      message: "Please enter a new group description.",
      inputs: [
        {
          name: 'description',
          placeholder: 'Group Description',
          value: this.group.description
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => { }
        },
        {
          text: 'Save',
          handler: data => {
            let description = data["description"];
            if (this.group.description != description) {
              this.loadingProvider.show();
              // Add system message.
              this.group.messages.push({
                date: new Date().toString(),
                sender: this.user.$key,
                type: 'system',
                message: this.user.name + ' has changed the group description.',
                icon: 'md-clipboard'
              });
              // Update group on database.
              this.dataProvider.getGroup(this.groupId).update({
                description: description,
                messages: this.group.messages
              }).then((success) => {
                this.loadingProvider.hide();
                this.alertProvider.showGroupUpdatedMessage();
              }).catch((error) => {
                this.loadingProvider.hide();
                this.alertProvider.showErrorMessage('group/error-update-group');
              });
            }
          }
        }
      ]
    }).present();
  }

  // Leave group.
  leaveGroup() {
    this.alert = this.alertCtrl.create({
      title: 'Confirm Leave',
      message: 'Are you sure you want to leave this group?',
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Leave',
          handler: data => {
            this.loadingProvider.show();
            // Remove member from group.
            this.group.members.splice(this.group.members.indexOf(this.user.$key), 1);
            // Add system message.
            this.group.messages.push({
              date: new Date().toString(),
              sender: this.user.$key,
              type: 'system',
              message: this.user.name + ' has left this group.',
              icon: 'md-log-out'
            });
            // Update group on database.
            this.dataProvider.getGroup(this.groupId).update({
              members: this.group.members,
              messages: this.group.messages
            }).then((success) => {
              // Remove group from user's group list.
              this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/groups/' + this.groupId).remove().then(() => {
                // Pop this view because user already has left this group.
                this.group = null;
                setTimeout(() => {
                  this.loadingProvider.hide();
                  this.navCtrl.popToRoot();
                }, 300);
              });
            }).catch((error) => {
              this.alertProvider.showErrorMessage('group/error-leave-group');
            });
          }
        }
      ]
    }).present();
  }

  // Delete group.
  deleteGroup() {
    this.alert = this.alertCtrl.create({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this group?',
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Delete',
          handler: data => {
            let group = JSON.parse(JSON.stringify(this.group));
            // Delete all images of image messages.
            group.messages.forEach((message) => {
              if (message.type == 'image') {
                this.imageProvider.deleteGroupImageFile(group.$key, message.url);
              }
            });
            // Delete group image.
            this.imageProvider.deleteImageFile(group.img);
            this.angularDb.object('/accounts/' + firebase.auth().currentUser.uid + '/groups/' + group.$key).remove().then(() => {
              this.dataProvider.getGroup(group.$key).remove();
            });
          }
        }
      ]
    }).present();
  }

  // Add members.
  addMembers() {
    this.navCtrl.push(AddMembersPage, { groupId: this.groupId });
  }
}
