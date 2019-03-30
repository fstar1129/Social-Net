import { Component } from "@angular/core";
import { NavController, AlertController, NavParams, App } from "ionic-angular";
import { LogoutProvider } from "../../providers/logout";
import { LoadingProvider } from "../../providers/loading";
import { AlertProvider } from "../../providers/alert";
import { AngularFireDatabase } from "angularfire2/database";
import { Validator } from "../../validator";
import * as firebase from "firebase";

@Component({
  selector: "page-verification",
  templateUrl: "verification.html"
})
export class VerificationPage {
  // VerificationPage
  // This is the page where the user is redirected when their email needs confirmation.
  // A verification check interval is set to check every second, if the user has confirmed their email address.
  // When an account is confirmed the user is then directed to homePage.
  private user: any;
  private alert;
  private checkVerified;
  private emailVerified;
  private isLoggingOut;

  constructor(
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public navParams: NavParams,
    public app: App,
    public logoutProvider: LogoutProvider,
    public loadingProvider: LoadingProvider,
    public angularDb: AngularFireDatabase,
    public alertProvider: AlertProvider
  ) {
    // Hook our logout provider with the app.
    this.logoutProvider.setApp(this.app);
  }

  ionViewDidLoad() {
    // Set our routeGuard variables to false, to not allow rereouting.
    this.emailVerified = false;
    this.isLoggingOut = false;
    // Get user data and send an email verification automatically.
    this.getUserData();
    this.sendEmailVerification();
    // Create the emailVerification checker.
    var that = this;
    that.checkVerified = setInterval(function() {
      firebase.auth().currentUser.reload();
      if (firebase.auth().currentUser.emailVerified) {
        clearInterval(that.checkVerified);
        that.emailVerified = true;
        that.alertProvider.showEmailVerifiedMessageAndRedirect(that.navCtrl);
      }
    }, 1000);
  }

  ionViewCanLeave(): boolean {
    // routeGuard to prevent from leaving this view unless email is verified, or user is logging out.
    if (this.emailVerified || this.isLoggingOut) {
      return true;
    } else {
      return false;
    }
  }

  // Get user data from the logged in Firebase user to show on html markup.
  getUserData() {
    let user = firebase.auth().currentUser;
    var userId, name, provider, img, email;
    let providerData = user.providerData[0];

    userId = user.uid;

    // Retrieve name from Firebase user
    if (user.displayName || providerData.displayName) {
      name = user.displayName;
      name = providerData.displayName;
    } else {
      name = "ionSocial User";
    }

    // Retrieve provider from Firebase user
    if (providerData.providerId == "password") {
      provider = "Firebase";
    } else if (providerData.providerId == "facebook.com") {
      provider = "Facebook";
    } else if (providerData.providerId == "google.com") {
      provider = "Google";
    }

    // Retrieve photoURL from Firebase user
    if (user.photoURL || providerData.photoURL) {
      img = user.photoURL;
      img = providerData.photoURL;
    } else {
      img = "assets/images/profile.png";
    }

    // Retrieve email from Firebase user
    email = user.email;

    // Set to user variable for our markup html
    this.user = {
      userId: userId,
      name: name,
      provider: provider,
      img: img,
      email: email
    };
  }

  // Send an email verification to the user's email.
  sendEmailVerification() {
    this.loadingProvider.show();
    firebase
      .auth()
      .currentUser.sendEmailVerification()
      .then(success => {
        this.alertProvider.showEmailVerificationSentMessage(
          firebase.auth().currentUser.email
        );
        this.loadingProvider.hide();
      });
  }

  // Set the user email
  setEmail() {
    this.alert = this.alertCtrl
      .create({
        title: "Change Email Address",
        message: "Please enter a new email address.",
        inputs: [
          {
            name: "email",
            placeholder: "Your Email Address",
            value: firebase.auth().currentUser.email
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
              // Check if entered email is different from the current email
              if (firebase.auth().currentUser.email != email) {
                // Check if email is valid.
                if (Validator.profileEmailValidator.pattern.test(email)) {
                  this.loadingProvider.show();
                  // Update email on Firebase
                  firebase
                    .auth()
                    .currentUser.updateEmail(email)
                    .then(success => {
                      Validator.profileEmailValidator.pattern.test(email);
                      this.loadingProvider.hide();
                      // Clear the existing interval because when we call ionViewDidLoad, another interval will be created.
                      clearInterval(this.checkVerified);
                      // Call ionViewDidLoad again to update user on the markup and automatically send verification mail.
                      this.ionViewDidLoad();
                      // Update the user data on the database if it exists.
                      firebase
                        .database()
                        .ref("accounts/" + firebase.auth().currentUser.uid)
                        .once("value")
                        .then(account => {
                          if (account.val()) {
                            this.angularDb
                              .object(
                                "/accounts/" + firebase.auth().currentUser.uid
                              )
                              .update({
                                email: email
                              });
                          }
                        });
                    })
                    .catch(error => {
                      //Show error
                      this.loadingProvider.hide();
                      let code = error["code"];
                      this.alertProvider.showErrorMessage(code);
                      if (code == "auth/requires-recent-login") {
                        this.logoutProvider.logout();
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

  // Clear the interval, and log the user out.
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
              // Clear the verification check interval.
              clearInterval(this.checkVerified);
              // Set our routeGuard to true, to enable changing views.
              this.isLoggingOut = true;
              // Log the user out.
              this.logoutProvider.logout();
            }
          }
        ]
      })
      .present();
  }
}
