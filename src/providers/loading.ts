import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Injectable()
export class LoadingProvider {
  // Loading Provider
  // This is the provider class for most of the loading spinners screens on the app.
  // Set your spinner/loading indicator type here
  // List of Spinners: https://ionicframework.com/docs/v2/api/components/spinner/Spinner/
  private spinner = {
    spinner: 'circles'
  };
  private loading;
  constructor(public loadingController: LoadingController) {
  }

  //Show loading
  show() {
    if (!this.loading) {
      this.loading = this.loadingController.create(this.spinner);
      this.loading.present();
      console.log("show");
    }
  }

  //Hide loading
  hide() {
    if (this.loading) {
      // this.loading.dismiss();
      console.log("hide");
      console.log(this.loading);
      this.loading.dismiss().catch(() => {});
      this.loading = null;
    }
  }
}
