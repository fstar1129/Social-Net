import { Injectable } from '@angular/core';
import { AlertProvider } from './alert';
import { AlertController} from 'ionic-angular'
import { LoadingProvider } from './loading';
import { Camera, CameraOptions } from '@ionic-native/camera';
import * as firebase from 'firebase';
import {AngularFireDatabase} from 'angularfire2/database';

@Injectable()
export class ImageProvider {
  // Image Provider
  // This is the provider class for most of the image processing including uploading images to Firebase.
  // Take note that the default function here uploads the file in .jpg. If you plan to use other encoding types, make sure to
  // set the encodingType before uploading the image on Firebase.
  // Example for .png:
  // data:image/jpeg;base64 -> data:image/png;base64
  // generateFilename to return .png
  private profilePhotoOptions: CameraOptions;
  private photoMessageOptions: CameraOptions;
  private groupPhotoOptions: CameraOptions;
  // All files to be uploaded on Firebase must have DATA_URL as the destination type.
  // This will return the imageURI which can then be processed and uploaded to Firebase.
  // For the list of cameraOptions, please refer to: https://github.com/apache/cordova-plugin-camera#module_camera.CameraOptions
  public alert:any;
  constructor(public angularDb:AngularFireDatabase,
    public alertProvider: AlertProvider,
    public loadingProvider: LoadingProvider,
    public camera: Camera,
    public alertCtrl : AlertController) {
    this.profilePhotoOptions = {
      quality: 50,
      targetWidth: 384,
      targetHeight: 384,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true
    };

    this.photoMessageOptions = {
      quality: 50,
      targetWidth: 384,
      targetHeight: 384,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: false,
      allowEdit:true,
    };

    this.groupPhotoOptions = {
      quality: 50,
      targetWidth: 384,
      targetHeight: 384,
      destinationType: this.camera.DestinationType.DATA_URL,
      encodingType: this.camera.EncodingType.JPEG,
      correctOrientation: true
    };
  }

  // Function to convert dataURI to Blob needed by Firebase
  imgURItoBlob(dataURI) {
    var binary = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    var array = [];
    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {
      type: mimeString
    });
  }

  // Generate a random filename of length for the image to be uploaded
  generateFilename() {
    var length = 8;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text + ".jpg";
  }

  // Set ProfilePhoto given the user and the cameraSourceType.
  // This function processes the imageURI returned and uploads the file on Firebase,
  // Finally the user data on the database is updated.
  setProfilePhoto(user, sourceType) {
    this.profilePhotoOptions.sourceType = sourceType;
    this.loadingProvider.show();
    // Get picture from camera or gallery.
    this.camera.getPicture(this.profilePhotoOptions).then((imageData) => {
      // Process the returned imageURI.
      let imgBlob = this.imgURItoBlob("data:image/jpeg;base64," + imageData);
      let metadata = {
        'contentType': imgBlob.type
      };
      // Generate filename and upload to Firebase Storage.
      firebase.storage().ref().child('images/' + user.userId + '/' + this.generateFilename()).put(imgBlob, metadata).then((snapshot) => {
        // Delete previous profile photo on Storage if it exists.
        this.deleteImageFile(user.img);
        // URL of the uploaded image!
        let url = snapshot.metadata.downloadURLs[0];
        let profile = {
          displayName: user.name,
          photoURL: url
        };
        // Update Firebase User.
        firebase.auth().currentUser.updateProfile(profile)
          .then((success) => {
            // Update User Data on Database.
            this.angularDb.object('/accounts/' + user.userId).update({
              img: url
            }).then((success) => {
              this.loadingProvider.hide();
              this.alertProvider.showProfileUpdatedMessage();
            }).catch((error) => {
              this.loadingProvider.hide();
              this.alertProvider.showErrorMessage('profile/error-change-photo');
            });
          })
          .catch((error) => {
            this.loadingProvider.hide();
            this.alertProvider.showErrorMessage('profile/error-change-photo');
          });
      }).catch((error) => {
        this.loadingProvider.hide();
        this.alertProvider.showErrorMessage('image/error-image-upload');
      });
    }).catch((error) => {
      this.loadingProvider.hide();
    });
  }

  // Upload and set the group object's image.
  setGroupPhoto(group, sourceType) {
    this.groupPhotoOptions.sourceType = sourceType;
    this.loadingProvider.show();
    // Get picture from camera or gallery.
    this.camera.getPicture(this.groupPhotoOptions).then((imageData) => {
      // Process the returned imageURI.
      let imgBlob = this.imgURItoBlob("data:image/jpeg;base64," + imageData);
      let metadata = {
        'contentType': imgBlob.type
      };
      firebase.storage().ref().child('images/' + firebase.auth().currentUser.uid + '/' + this.generateFilename()).put(imgBlob, metadata).then((snapshot) => {
        this.deleteImageFile(group.img);
        // URL of the uploaded image!
        let url = snapshot.metadata.downloadURLs[0];
        group.img = url;
        this.loadingProvider.hide();
      }).catch((error) => {
        this.loadingProvider.hide();
        this.alertProvider.showErrorMessage('image/error-image-upload');
      });
    }).catch((error) => {
      this.loadingProvider.hide();
    });
  }

  // Set group photo and return the group object as promise.
  setGroupPhotoPromise(group, sourceType): Promise<any> {
    return new Promise(resolve => {
      this.groupPhotoOptions.sourceType = sourceType;
      this.loadingProvider.show();
      // Get picture from camera or gallery.
      this.camera.getPicture(this.groupPhotoOptions).then((imageData) => {
        // Process the returned imageURI.
        let imgBlob = this.imgURItoBlob("data:image/jpeg;base64," + imageData);
        let metadata = {
          'contentType': imgBlob.type
        };
        firebase.storage().ref().child('images/' + firebase.auth().currentUser.uid + '/' + this.generateFilename()).put(imgBlob, metadata).then((snapshot) => {
          this.deleteImageFile(group.img);
          // URL of the uploaded image!
          let url = snapshot.metadata.downloadURLs[0];
          group.img = url;
          this.loadingProvider.hide();
          resolve(group);
        }).catch((error) => {
          this.loadingProvider.hide();
          this.alertProvider.showErrorMessage('image/error-image-upload');
        });
      }).catch((error) => {
        this.loadingProvider.hide();
      });
    });
  }

  //Delete the image given the url.
  deleteImageFile(path) {
    var fileName = path.substring(path.lastIndexOf('%2F') + 3, path.lastIndexOf('?'));
    firebase.storage().ref().child('images/' + firebase.auth().currentUser.uid + '/' + fileName).delete().then(() => { }).catch((error) => { });
  }

  //Delete the user.img given the user.
  deleteUserImageFile(user) {
    var fileName = user.img.substring(user.img.lastIndexOf('%2F') + 3, user.img.lastIndexOf('?'));
    firebase.storage().ref().child('images/' + user.userId + '/' + fileName).delete().then(() => { }).catch((error) => { });
  }

  // Delete group image file on group storage reference.
  deleteGroupImageFile(groupId, path) {
    var fileName = path.substring(path.lastIndexOf('%2F') + 3, path.lastIndexOf('?'));
    firebase.storage().ref().child('images/' + groupId + '/' + fileName).delete().then(() => { }).catch((error) => { });
  }

  // Upload photo message and return the url as promise.
  uploadPhotoMessage(conversationId, sourceType): Promise<any> {
    return new Promise(resolve => {
      this.photoMessageOptions.sourceType = sourceType;
      this.loadingProvider.show();
      // Get picture from camera or gallery.
      this.camera.getPicture(this.photoMessageOptions).then((imageData) => {
        // Process the returned imageURI.
        let imgBlob = this.imgURItoBlob("data:image/jpeg;base64," + imageData);
        let metadata = {
          'contentType': imgBlob.type
        };
        // Generate filename and upload to Firebase Storage.
        firebase.storage().ref().child('images/' + conversationId + '/' + this.generateFilename()).put(imgBlob, metadata).then((snapshot) => {
          // URL of the uploaded image!
          let url = snapshot.metadata.downloadURLs[0];
          this.loadingProvider.hide();
          resolve(url);
        }).catch((error) => {
          this.loadingProvider.hide();
          this.alertProvider.showErrorMessage('image/error-image-upload');
        });
      }).catch((error) => {
        this.loadingProvider.hide();
      });
    });
  }

  // Upload group photo message and return a promise as url.
  uploadGroupPhotoMessage(groupId, sourceType): Promise<any> {
    return new Promise(resolve => {
      this.photoMessageOptions.sourceType = sourceType;
      this.loadingProvider.show();
      // Get picture from camera or gallery.
      this.camera.getPicture(this.photoMessageOptions).then((imageData) => {
        // Process the returned imageURI.
        let imgBlob = this.imgURItoBlob("data:image/jpeg;base64," + imageData);
        let metadata = {
          'contentType': imgBlob.type
        };
        // Generate filename and upload to Firebase Storage.
        firebase.storage().ref().child('images/' + groupId + '/' + this.generateFilename()).put(imgBlob, metadata).then((snapshot) => {
          // URL of the uploaded image!
          let url = snapshot.metadata.downloadURLs[0];
          this.loadingProvider.hide();
          resolve(url);
        }).catch((error) => {
          this.loadingProvider.hide();
          this.alertProvider.showErrorMessage('image/error-image-upload');
        });
      }).catch((error) => {
        this.loadingProvider.hide();
      });
    });
  }


  // ======== set post image ========
  setImage(){
    return new Promise((resolve,reject)=>{
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
              this.photoMessageOptions.sourceType =  this.camera.PictureSourceType.PHOTOLIBRARY;
              this.camera.getPicture(this.photoMessageOptions).then((imageData) => {
                resolve("data:image/jpeg;base64," + imageData)
              })
            }
          },
          {
            text: 'Take Photo',
            handler: () => {
              this.photoMessageOptions.sourceType =  this.camera.PictureSourceType.CAMERA;
              this.camera.getPicture(this.photoMessageOptions).then((imageData) => {
                resolve("data:image/jpeg;base64," + imageData)
              })
            }
          }
        ]
      }).present();
    })
  }

  // ======= upload image in post folder ====
  uploadPostImage(url){
    return new Promise((resolve,reject)=>{
      let imgBlob = this.imgURItoBlob(url);
      let metadata = {
        'contentType': imgBlob.type
      };
      // Generate filename and upload to Firebase Storage.
      firebase.storage().ref().child('images/post/' + this.generateFilename()).put(imgBlob, metadata).then((snapshot) => {
        // URL of the uploaded image!
        let url = snapshot.metadata.downloadURLs[0];
        resolve(url);
      }).catch((error) => {
        this.alertProvider.showErrorMessage('image/error-image-upload');
        reject(error)
      });
    })
  }
}
