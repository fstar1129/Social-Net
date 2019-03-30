import { Injectable } from '@angular/core';
import { App } from 'ionic-angular';

import { LoadingProvider } from './loading';
import { DataProvider } from './data';
import * as firebase from 'firebase';

@Injectable()
export class LogoutProvider {
  // Logout Provider
  // This is the provider class for logging out.
  // Before logout function can be used it's important to set the app to the Provider
  // by calling setApp(app) in the constructor of the controller that needs the logout functionality.
  constructor(public app: App,
    public loadingProvider: LoadingProvider,
    public dataProvider: DataProvider) {
  }

  // Hooks the app to this provider, this is needed to clear the navigation views when logging out.
  setApp(app) {
    this.app = app;
  }

  // Logs the user out on Firebase, and clear navigation stacks.
  // It's important to call setApp(app) on the constructor of the controller that calls this function.
  logout() {
    return new Promise((resolve,reject)=>{
      this.loadingProvider.show();
      // Sign the user out on Firebase
      firebase.auth().signOut().then((success) => {
        // Clear navigation stacks
        this.app.getRootNav().popToRoot().then(() => {
          this.loadingProvider.hide();
          resolve(true)
          // Restart the entire app
          //document.location.href = 'index.html';
        });
      });

    })
  }

}
