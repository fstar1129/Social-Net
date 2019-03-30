import { Injectable, NgZone } from "@angular/core";
import { Facebook } from "ng2-cordova-oauth/core";
import { OauthCordova } from "ng2-cordova-oauth/platform/cordova";
import * as firebase from "firebase";
import { Login } from "../login";
import { NavController } from "ionic-angular";
import { LoadingProvider } from "./loading";
import { AlertProvider } from "./alert";
import { GooglePlus } from "@ionic-native/google-plus";
import { AngularFireDatabase } from "angularfire2/database";
import { DataProvider } from "./data";
import { VideoProvider } from "./video";
import { parse, format, asYouType, getPhoneCode } from "libphonenumber-js";

// import { Diagnostic } from '@ionic-native/diagnostic';

declare var cordova: any;
@Injectable()
export class LoginProvider {
  // Login Provider
  // This is the provider class for most of the login functionalities on Firebase.
  // It's important that you set your Firebase and Social settings on login.ts
  // Other customizations can be done on login.ts such as setting your own the homePage,
  // trialPage, and verificationPages or disabling emailVerification.
  // It's important to hook this provider up with your navCtrl
  // In the constructor of the controller that uses this provider, call setNavController(navCtrl).
  private oauth: OauthCordova;
  private navCtrl: NavController;
  private facebookProvider = new Facebook({
    clientId: Login.facebookAppId,
    appScope: ["email"]
  });
  phoneNumber = "";
  countryCode = "";
  constructor(
    public loadingProvider: LoadingProvider,
    public alertProvider: AlertProvider,
    public zone: NgZone,
    public googlePlus: GooglePlus,
    public angularDb: AngularFireDatabase,
    public dataProvider: DataProvider,
    public videoProvider: VideoProvider
  ) {
    this.oauth = new OauthCordova();
    // Detect changes on the Firebase user and redirects the view depending on the user's status.
    // firebase.auth().onAuthStateChanged((user) => {
    //   if (user) {
    //     // Update userData on Database.
    //     // this.angularDb.object('/accounts/' + user.uid).update({
    //     //   isOnline: true
    //     // }).then((success) => {
    //     //
    //     // }).catch((error) => {
    //     //   //this.alertProvider.showErrorMessage('profile/error-update-profile');
    //     // });

    //     if (user["isAnonymous"]) {
    //       //Goto Trial Page.
    //       this.navCtrl.setRoot(Login.trialPage, { animate: false });
    //     } else {
    //       // this.diagnostic.setBluetoothState(true)
    //       // this.diagnostic.getBluetoothState()
    //       // .then((state) => {
    //       //   if (state == this.diagnostic.bluetoothState.POWERED_ON){
    //       //     alert('on')
    //       //     // do something
    //       //   } else {
    //       //     alert('off')
    //       //     // do something else
    //       //   }
    //       // }).catch(e => console.error(e));

    //       if (Login.emailVerification) {
    //         if (user["emailVerified"]) {
    //           //Goto Home Page.
    //           this.zone.run(() => {
    //             //this.navCtrl.setRoot(Login.homePage, { animate: false });
    //           });
    //           //Since we're using a TabsPage an NgZone is required.
    //         } else {
    //           //Goto Verification Page.
    //           // this.navCtrl.setRoot(Login.verificationPage, { animate: false });
    //           //this.navCtrl.setRoot(Login.homePage, { animate: false });
    //         }
    //       } else {
    //         //Goto Home Page.
    //         this.zone.run(() => {
    //          this.navCtrl.setRoot(Login.homePage, { animate: false });
    //         });
    //         //Since we're using a TabsPage an NgZone is required.
    //       }
    //     }
    //   }
    // });
  }

  // Hook this provider up with the navigationController.
  // This is important, so the provider can redirect the app to the views depending
  // on the status of the Firebase user.
  setNavController(navCtrl) {
    this.navCtrl = navCtrl;
  }

  // Facebook Login, after successful authentication, triggers firebase.auth().onAuthStateChanged((user) on top and
  // redirects the user to its respective views. Make sure to set your FacebookAppId on login.ts
  // and enabled Facebook Login on Firebase app authentication console.
  facebookLogin() {
    this.oauth.logInVia(this.facebookProvider).then(
      success => {
        let credential = firebase.auth.FacebookAuthProvider.credential(
          success["access_token"]
        );
        this.loadingProvider.show();
        firebase
          .auth()
          .signInWithCredential(credential)
          .then(success => {
            this.loadingProvider.hide();
            this.createUserData();
          })
          .catch(error => {
            this.loadingProvider.hide();
            let code = error["code"];
            this.alertProvider.showErrorMessage(code);
          });
      },
      error => {}
    );
  }

  // Google Login, after successful authentication, triggers firebase.auth().onAuthStateChanged((user) on top and
  // redirects the user to its respective views. Make sure to set your GoogleWebClient Id on login.ts
  // and enabled Google Login on Firebase app authentication console.
  googleLogin() {
    this.loadingProvider.show();
    this.googlePlus
      .login({
        webClientId: Login.googleClientId
      })
      .then(
        success => {
          let credential = firebase.auth.GoogleAuthProvider.credential(
            success["idToken"],
            null
          );
          firebase
            .auth()
            .signInWithCredential(credential)
            .then(success => {
              this.loadingProvider.hide();
              this.createUserData();
            })
            .catch(error => {
              this.loadingProvider.hide();
              let code = error["code"];
              this.alertProvider.showErrorMessage(code);
            });
        },
        error => {
          this.loadingProvider.hide();
        }
      );
  }

  // Anonymous Login, after successful authentication, triggers firebase.auth().onAuthStateChanged((user) on top and
  // redirects the user to its respective views. Make sure to enable Anonymous login on Firebase app authentication console.
  guestLogin() {
    this.loadingProvider.show();
    firebase
      .auth()
      .signInAnonymously()
      .then(success => {
        this.loadingProvider.hide();
        this.createUserData();
      })
      .catch(error => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Login on Firebase given the email and password.
  phoneLogin(email, password) {
    this.loadingProvider.show();
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(success => {
        this.loadingProvider.hide();
        this.phoneNumber = password;
        this.countryCode = "+" + getPhoneCode(parse(password).country);
        this.createUserData();
      })
      .catch(error => {
        let code = error["code"];
        if (code == "auth/user-not-found") {
          this.register(email, password);
        } else {
          this.loadingProvider.hide();
          this.alertProvider.showErrorMessage(code);
        }
      });
  }

  // Login on Firebase given the email and password.
  emailLogin(email, password) {
    this.loadingProvider.show();
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(success => {
        this.loadingProvider.hide();
        this.phoneNumber = "";
        this.countryCode = "";
        this.createUserData();
      })
      .catch(error => {
        let code = error["code"];
        if (code == "auth/user-not-found") {
          this.register(email, password);
        } else {
          this.loadingProvider.hide();
          this.alertProvider.showErrorMessage(code);
        }
      });
  }

  // Register user on Firebase given the email and password.
  register(email, password) {
    this.loadingProvider.show();
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(success => {
        this.loadingProvider.hide();
        this.phoneNumber = password;
        this.countryCode = "+" + getPhoneCode(parse(password).country);
        this.createUserData();
      })
      .catch(error => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Register user on Firebase given the email and password.
  emailRegister(email, password) {
    this.loadingProvider.show();
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(success => {
        this.loadingProvider.hide();
        this.phoneNumber = "";
        this.countryCode = "";
        this.createUserData();
      })
      .catch(error => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Send Password Reset Email to the user.
  sendPasswordReset(email) {
    this.loadingProvider.show();
    firebase
      .auth()
      .sendPasswordResetEmail(email)
      .then(success => {
        this.loadingProvider.hide();
        this.alertProvider.showPasswordResetMessage(email);
      })
      .catch(error => {
        this.loadingProvider.hide();
        let code = error["code"];
        this.alertProvider.showErrorMessage(code);
      });
  }

  // Create userData on the database if it doesn't exist yet.
  createUserData() {
    firebase
      .database()
      .ref("accounts/" + firebase.auth().currentUser.uid)
      .once("value")
      .then(account => {
        // No database data yet, create user data on database
        if (!account.val()) {
          this.loadingProvider.show();
          let user = firebase.auth().currentUser;
          var userId, name, provider, img, email, phoneNumber;
          let providerData = user.providerData[0];

          userId = user.uid;

          // Get name from Firebase user.
          if (user.displayName || providerData.displayName) {
            name = user.displayName;
            name = providerData.displayName;
          } else {
            if (this.phoneNumber) {
              name = this.phoneNumber;
            } else {
              name = user.email;
            }
          }

          // Set default username based on name and userId.
          let username = name.replace(/ /g, "") + userId.substring(0, 8);

          // Get provider from Firebase user.
          if (providerData.providerId == "password") {
            provider = "Firebase";
          } else if (providerData.providerId == "facebook.com") {
            provider = "Facebook";
          } else if (providerData.providerId == "google.com") {
            provider = "Google";
          }

          // Get photoURL from Firebase user.
          if (user.photoURL || providerData.photoURL) {
            img = user.photoURL;
            img = providerData.photoURL;
          } else {
            img = "assets/images/profile.png";
          }

          // Get email from Firebase user.
          email = user.email;
          // Set default description.
          let description = "Hello! I am a new Communicaters user.";
          let uniqueId = Math.floor(Math.random() * 10000000000);
          let tempData = {
            userId: userId,
            name: name,
            username: username,
            provider: provider,
            img: img,
            email: email,
            description: description,
            uniqueId: uniqueId,
            isOnline: true,
            dateCreated: new Date().toString(),
            phoneNumber: this.phoneNumber,
            countryCode: this.countryCode
          };
          // Insert data on our database using AngularFire.
          this.angularDb
            .object("/accounts/" + userId)
            .set(tempData)
            .then(() => {
              this.loadingProvider.hide();
              this.videoProvider.InitializingRTC(tempData);
              this.dataProvider.setData("userData", tempData);
              this.navCtrl.setRoot(Login.homePage, { animate: false });
            });
        } else {
          let _userData = account.val();
          if (_userData.userId) {
            this.angularDb
              .object("/accounts/" + _userData.userId)
              .update({
                isOnline: true
              })
              .then(success => {})
              .catch(error => {
                //this.alertProvider.showErrorMessage('profile/error-update-profile');
              });
          }
          if (!_userData.isBlock) {
            
            this.videoProvider.InitializingRTC(account.val());
            this.dataProvider.setData("userData", account.val());
            this.navCtrl.setRoot(Login.homePage, { animate: false });
          } else {
            this.alertProvider.showAlert(
              "Login Failed",
              "You are temporary block. please contact to ionSocial team "
            );
          }
        }
      });
  }
}
