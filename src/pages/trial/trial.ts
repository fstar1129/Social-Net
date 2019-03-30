import { Component } from '@angular/core';
import { NavController, AlertController, NavParams, App } from 'ionic-angular';
import { LogoutProvider } from '../../providers/logout';
import { LoadingProvider } from '../../providers/loading';
import { AlertProvider } from '../../providers/alert';
import * as firebase from 'firebase';
import { Facebook } from 'ng2-cordova-oauth/core';
import { OauthCordova } from 'ng2-cordova-oauth/platform/cordova';
import { Login } from '../../login';
import { GooglePlus } from '@ionic-native/google-plus';
import { LoginPage } from '../login/login';

@Component({
  selector: 'page-trial',
  templateUrl: 'trial.html'
})
export class TrialPage {
  // TrialPage
  // This is the page where the user is redirected when they logged in as guest.
  // From this page, the guest can upgrade to a full account by logging in via Facebook or Google.
  private alert;
  private oauth: OauthCordova;
  private facebookProvider = new Facebook({
    clientId: Login.facebookAppId,
    appScope: ["email"]
  });

  constructor(public navCtrl: NavController, public alertCtrl: AlertController, public navParams: NavParams, public app: App,
    public logoutProvider: LogoutProvider, public loadingProvider: LoadingProvider, public alertProvider: AlertProvider, public googlePlus: GooglePlus) {
    // Hook our logout provider with the app.
    this.logoutProvider.setApp(this.app);
    this.oauth = new OauthCordova();
  }

  // Shows popup to ask user for Facebook credential, afterwhich, upgrade the guest account to full account.
  linkFacebook() {
    this.oauth.logInVia(this.facebookProvider).then(success => {
      let credential = firebase.auth.FacebookAuthProvider.credential(success['access_token']);
      this.loadingProvider.show();
      firebase.auth().currentUser.link(credential)
        .then((success) => {
          this.loadingProvider.hide();
          // Check if emailVerification is enabled, if enabled, check and redirect to verificationPage
          if (Login.emailVerification) {
            if (firebase.auth().currentUser.emailVerified) {
              this.navCtrl.setRoot(Login.homePage);
            } else {
              this.navCtrl.setRoot(Login.verificationPage);
            }
          } else {
            this.navCtrl.setRoot(Login.homePage);
          }
        })
        .catch((error) => {
          //Show error
          this.loadingProvider.hide();
          let code = error["code"];
          this.alertProvider.showErrorMessage(code);
        });
    }, error => { });
  }

  // Shows popup to ask user for Google credential, afterwhich, upgrade the guest account to full account.
  linkGoogle() {
    this.loadingProvider.show();
    this.googlePlus.login({
      'webClientId': Login.googleClientId
    }).then((success) => {
      let credential = firebase.auth.GoogleAuthProvider.credential(success['idToken'], null);
      firebase.auth().currentUser.link(credential)
        .then((success) => {
          this.loadingProvider.hide();
          // Check if emailVerification is enabled, if enabled, check and redirect to verificationPage
          if (Login.emailVerification) {
            if (firebase.auth().currentUser.emailVerified) {
              this.navCtrl.setRoot(Login.homePage);
            } else {
              this.navCtrl.setRoot(Login.verificationPage);
            }
          } else {
            this.navCtrl.setRoot(Login.homePage);
          }
        })
        .catch((error) => {
          // Show error
          this.loadingProvider.hide();
          let code = error["code"];
          this.alertProvider.showErrorMessage(code);
        });
    }, error => { this.loadingProvider.hide(); });
  }

  // Log the user out.
  logout() {
    this.alert = this.alertCtrl.create({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Logout',
          handler: data => { this.logoutProvider.logout().then(res=>{
              this.navCtrl.setRoot(LoginPage)
          }); }
        }
      ]
    }).present();
  }
}
