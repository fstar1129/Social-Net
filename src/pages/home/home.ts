import { Component } from "@angular/core";
import {
  NavController,
  AlertController,
  NavParams,
  App,
  ModalController
} from "ionic-angular";
import { LogoutProvider } from "../../providers/logout";
import { LoadingProvider } from "../../providers/loading";
import { AlertProvider } from "../../providers/alert";
import { ImageProvider } from "../../providers/image";
import { DataProvider } from "../../providers/data";
import { AngularFireDatabase } from "angularfire2/database";
import { Validator } from "../../validator";
import { LoginPage } from "../login/login";
import { UpdateContactPage } from "../update-contact/update-contact";
import { UsersPage } from "../users/users";

import { Login } from "../../login";
import * as firebase from "firebase";
import { Camera } from "@ionic-native/camera";
import { ReportedPostPage } from "../reported-post/reported-post";

declare var AccountKitPlugin: any;

@Component({
  selector: "page-home",
  templateUrl: "home.html"
})
export class HomePage {
  private user: any;
  private alert;
  // HomePage
  // This is the page where the user is directed after successful login and email is confirmed.
  // A couple of profile management function is available for the user in this page such as:
  // Change name, profile pic, email, and password
  // The user can also opt for the deletion of their account, and finally logout.
  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public navParams: NavParams,
    public app: App,
    public logoutProvider: LogoutProvider,
    public modalCtrl: ModalController,
    public loadingProvider: LoadingProvider,
    public imageProvider: ImageProvider,
    public angularDb: AngularFireDatabase,
    public alertProvider: AlertProvider,
    public dataProvider: DataProvider,
    public camera: Camera
  ) {
    this.logoutProvider.setApp(this.app);
  }

  ionViewDidLoad() {
    // Observe the userData on database to be used by our markup html.
    // Whenever the userData on the database is updated, it will automatically reflect on our user variable.
    // this.loadingProvider.show();
    this.dataProvider.getCurrentUser().subscribe(user => {
      // this.loadingProvider.hide();

      this.user = <any>user;
      console.log(" user", this.user);
    });
  }
  sendfeedback() {
    window.open(
      `mailto:mayorainfotech@gmail.com?Subject=SendFeedBack`,
      "_system"
    );
    // window.open(`mailto:nakulkundaliya12@gmail.com?Subject=SendFeedBack`, '_system');
  }
  // Change user's profile photo. Uses imageProvider to process image and upload on Firebase and update userData.
  setPhoto() {
    // Ask if the user wants to take a photo or choose from photo gallery.
    this.alert = this.alertCtrl
      .create({
        title: "Set Profile Photo",
        message:
          "Do you want to take a photo or choose from your photo gallery?",
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Choose from Gallery",
            handler: () => {
              // Call imageProvider to process, upload, and update user photo.
              this.imageProvider.setProfilePhoto(
                this.user,
                this.camera.PictureSourceType.PHOTOLIBRARY
              );
            }
          },
          {
            text: "Take Photo",
            handler: () => {
              // Call imageProvider to process, upload, and update user photo.
              this.imageProvider.setProfilePhoto(
                this.user,
                this.camera.PictureSourceType.CAMERA
              );
            }
          }
        ]
      })
      .present();
  }

  // Change user's profile name, username, and description.
  setName() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Profile Name",
        message: "Please enter a new profile name.",
        inputs: [
          {
            name: "name",
            placeholder: "Your Name",
            value: this.user.name
          }
        ],
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Save",
            handler: data => {
              let name = data["name"];
              // Check if entered name is different from the current name
              if (this.user.name != name) {
                // Check if name's length is more than five characters
                if (name.length >= Validator.profileNameValidator.minLength) {
                  // Check if name contains characters and numbers only.
                  if (Validator.profileNameValidator.pattern.test(name)) {
                    this.loadingProvider.show();
                    let profile = {
                      displayName: name,
                      photoURL: this.user.photoURL
                    };
                    // Update profile on Firebase
                    firebase
                      .auth()
                      .currentUser.updateProfile(profile)
                      .then(success => {
                        // Update userData on Database.
                        this.angularDb
                          .object("/accounts/" + this.user.userId)
                          .update({
                            name: name
                          })
                          .then(success => {
                            Validator.profileNameValidator.pattern.test(name); //Refresh validator
                            this.alertProvider.showProfileUpdatedMessage();
                          })
                          .catch(error => {
                            this.alertProvider.showErrorMessage(
                              "profile/error-update-profile"
                            );
                          });
                      })
                      .catch(error => {
                        // Show error
                        this.loadingProvider.hide();
                        let code = error["code"];
                        this.alertProvider.showErrorMessage(code);
                        if (code == "auth/requires-recent-login") {
                          this.logoutProvider.logout().then(res => {
                            AccountKitPlugin.logout();
                            this.navCtrl.parent.parent.setRoot(LoginPage);
                          });
                        }
                      });
                  } else {
                    this.alertProvider.showErrorMessage(
                      "profile/invalid-chars-name"
                    );
                  }
                } else {
                  this.alertProvider.showErrorMessage("profile/name-too-short");
                }
              }
            }
          }
        ]
      })
      .present();
  }

  //Set username
  setUsername() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Username",
        message: "Please enter a new username.",
        inputs: [
          {
            name: "username",
            placeholder: "Your Username",
            value: this.user.username
          }
        ],
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Save",
            handler: data => {
              let username = data["username"];
              // Check if entered username is different from the current username
              if (this.user.username != username) {
                this.dataProvider
                  .getUserWithUsername(username)
                  .take(1)
                  .subscribe(userList => {
                    if (userList.length > 0) {
                      this.alertProvider.showErrorMessage(
                        "profile/error-same-username"
                      );
                    } else {
                      this.angularDb
                        .object("/accounts/" + this.user.userId)
                        .update({
                          username: username
                        })
                        .then(success => {
                          this.alertProvider.showProfileUpdatedMessage();
                        })
                        .catch(error => {
                          this.alertProvider.showErrorMessage(
                            "profile/error-update-profile"
                          );
                        });
                    }
                  });
              }
            }
          }
        ]
      })
      .present();
  }
  //Set username
  setPhoneNumber() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Phonenumber",
        message: "Please enter a Phone number.",
        inputs: [
          {
            name: "phonenumber",
            placeholder: "Phone number( with country code )",
            value: this.user.phoneNumber
          }
        ],
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Save",
            handler: data => {
              let phoneNumber = data["phonenumber"];
              // Check if entered username is different from the current username
              if (this.user.phoneNumber != phoneNumber) {
                this.dataProvider
                  .getUserWithPhonenumber(phoneNumber)
                  .take(1)
                  .subscribe(userList => {
                    if (userList.length > 0) {
                      this.alertProvider.showErrorMessage(
                        "profile/error-same-phoneNumber"
                      );
                    } else {
                      this.angularDb
                        .object("/accounts/" + this.user.userId)
                        .update({
                          phoneNumber: phoneNumber
                        })
                        .then(success => {
                          this.alertProvider.showPhoneNumberUpdatedMessage();
                        })
                        .catch(error => {
                          this.alertProvider.showErrorMessage(
                            "profile/error-update-profile"
                          );
                        });
                    }
                  });
              }
            }
          }
        ]
      })
      .present();
  }

  // updateContact number
  updateContactNumber() {
    let profileModal = this.modalCtrl.create(UpdateContactPage, {
      userData: this.user
    });
    profileModal.present();
  }

  loginCallback(response) {
    alert(response);
  }

  //Set description
  setDescription() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Description",
        message: "Please enter a new description.",
        inputs: [
          {
            name: "description",
            placeholder: "Your Description",
            value: this.user.description
          }
        ],
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Save",
            handler: data => {
              let description = data["description"];
              // Check if entered description is different from the current description
              if (this.user.description != description) {
                this.angularDb
                  .object("/accounts/" + this.user.userId)
                  .update({
                    description: description
                  })
                  .then(success => {
                    this.alertProvider.showProfileUpdatedMessage();
                  })
                  .catch(error => {
                    this.alertProvider.showErrorMessage(
                      "profile/error-update-profile"
                    );
                  });
              }
            }
          }
        ]
      })
      .present();
  }

  // Change user's email. Uses Validator.ts to validate the entered email. After, update the userData on database.
  // When the user changed their email, they have to confirm the new email address.
  setEmail() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Email Address",
        message: "Please enter a new email address.",
        inputs: [
          {
            name: "email",
            placeholder: "Your Email Address",
            value: this.user.email
          }
        ],
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Save",
            handler: data => {
              let email = data["email"];
              //Check if entered email is different from the current email
              if (this.user.email != email) {
                //Check if email is valid.
                if (Validator.profileEmailValidator.pattern.test(email)) {
                  this.loadingProvider.show();
                  // Update email on Firebase.
                  firebase
                    .auth()
                    .currentUser.updateEmail(email)
                    .then(success => {
                      // Update userData on Database.
                      this.angularDb
                        .object("/accounts/" + this.user.userId)
                        .update({
                          email: email
                        })
                        .then(success => {
                          Validator.profileEmailValidator.pattern.test(email);
                          // Check if emailVerification is enabled, if it is go to verificationPage.
                          if (Login.emailVerification) {
                            if (!firebase.auth().currentUser.emailVerified) {
                              this.navCtrl.setRoot(Login.verificationPage);
                            }
                          }
                        })
                        .catch(error => {
                          this.alertProvider.showErrorMessage(
                            "profile/error-change-email"
                          );
                        });
                    })
                    .catch(error => {
                      //Show error
                      this.loadingProvider.hide();
                      let code = error["code"];
                      this.alertProvider.showErrorMessage(code);
                      if (code == "auth/requires-recent-login") {
                        this.logoutProvider.logout().then(res => {
                          this.dataProvider.clearData();
                          AccountKitPlugin.logout();
                          this.navCtrl.parent.parent.setRoot(LoginPage);
                        });
                      }
                    });
                } else {
                  this.alertProvider.showErrorMessage("profile/invalid-email");
                }
              }
            }
          }
        ]
      })
      .present();
  }

  // Change user's password, this option only shows up for users registered via Firebase.
  // The currentPassword is first checked, after which the new password should be entered twice.
  // Uses password validator from Validator.ts.
  setPassword() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Password",
        message: "Please enter a new password.",
        inputs: [
          {
            name: "currentPassword",
            placeholder: "Current Password",
            type: "password"
          },
          {
            name: "password",
            placeholder: "New Password",
            type: "password"
          },
          {
            name: "confirmPassword",
            placeholder: "Confirm Password",
            type: "password"
          }
        ],
        buttons: [
          {
            text: "Cancel",
            handler: data => {}
          },
          {
            text: "Save",
            handler: data => {
              let currentPassword = data["currentPassword"];
              let credential = firebase.auth.EmailAuthProvider.credential(
                this.user.email,
                currentPassword
              );
              // Check if currentPassword entered is correct
              this.loadingProvider.show();
              firebase
                .auth()
                .currentUser.reauthenticate(credential)
                .then(success => {
                  let password = data["password"];
                  // Check if entered password is not the same as the currentPassword
                  if (password != currentPassword) {
                    if (
                      password.length >=
                      Validator.profilePasswordValidator.minLength
                    ) {
                      if (
                        Validator.profilePasswordValidator.pattern.test(
                          password
                        )
                      ) {
                        if (password == data["confirmPassword"]) {
                          // Update password on Firebase.
                          firebase
                            .auth()
                            .currentUser.updatePassword(password)
                            .then(success => {
                              this.loadingProvider.hide();
                              Validator.profilePasswordValidator.pattern.test(
                                password
                              );
                              this.alertProvider.showPasswordChangedMessage();
                            })
                            .catch(error => {
                              this.loadingProvider.hide();
                              let code = error["code"];
                              this.alertProvider.showErrorMessage(code);
                              if (code == "auth/requires-recent-login") {
                                this.logoutProvider.logout().then(res => {
                                  this.dataProvider.clearData();
                                  AccountKitPlugin.logout();
                                  this.navCtrl.parent.parent.setRoot(LoginPage);
                                });
                              }
                            });
                        } else {
                          this.alertProvider.showErrorMessage(
                            "profile/passwords-do-not-match"
                          );
                        }
                      } else {
                        this.alertProvider.showErrorMessage(
                          "profile/invalid-chars-password"
                        );
                      }
                    } else {
                      this.alertProvider.showErrorMessage(
                        "profile/password-too-short"
                      );
                    }
                  }
                })
                .catch(error => {
                  //Show error
                  this.loadingProvider.hide();
                  let code = error["code"];
                  this.alertProvider.showErrorMessage(code);
                });
            }
          }
        ]
      })
      .present();
  }

  // Delete the user account. After deleting the Firebase user, the userData along with their profile pic uploaded on the storage will be deleted as well.
  // If you added some other info or traces for the account, make sure to account for them when deleting the account.
  deleteAccount() {
    this.alert = this.alertCtrl
      .create({
        title: "Confirm Delete",
        message:
          "Are you sure you want to delete your account? This cannot be undone.",
        buttons: [
          {
            text: "Cancel"
          },
          {
            text: "Delete",
            handler: data => {
              this.loadingProvider.show();
              // Delete Firebase user
              firebase
                .auth()
                .currentUser.delete()
                .then(success => {
                  // Delete profilePic of user on Firebase storage
                  this.imageProvider.deleteUserImageFile(this.user);
                  // Delete user data on Database
                  this.angularDb
                    .object("/accounts/" + this.user.userId)
                    .remove()
                    .then(() => {
                      this.loadingProvider.hide();
                      this.alertProvider.showAccountDeletedMessage();
                      this.logoutProvider.logout().then(res => {
                        AccountKitPlugin.logout();
                        this.navCtrl.parent.parent.setRoot(LoginPage);
                      });
                    });
                })
                .catch(error => {
                  this.loadingProvider.hide();
                  let code = error["code"];
                  this.alertProvider.showErrorMessage(code);
                  if (code == "auth/requires-recent-login") {
                    this.logoutProvider.logout().then(res => {
                      this.dataProvider.clearData();
                      this.navCtrl.parent.parent.setRoot(LoginPage);
                    });
                  }
                });
            }
          }
        ]
      })
      .present();
  }

  // Log the user out.
  logout() {
    this.alert = this.alertCtrl
      .create({
        title: "Confirm Logout",
        message: "Are you sure you want to logout?",
        buttons: [
          {
            text: "Cancel"
          },
          {
            text: "Logout",
            handler: data => {
              this.logoutProvider.logout().then(res => {
                this.dataProvider.clearData();
                AccountKitPlugin.logout();
                this.navCtrl.parent.parent.setRoot(LoginPage);
              });
            }
          }
        ]
      })
      .present();
  }

  reportedPost() {
    this.navCtrl.push(ReportedPostPage);
  }

  users() {
    this.navCtrl.push(UsersPage);
  }
}
