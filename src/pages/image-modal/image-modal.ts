import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';

@Component({
  selector: 'page-image-modal',
  templateUrl: 'image-modal.html'
})
export class ImageModalPage {
  // ImageModalPage
  // This is the page that pops up when the user tapped on an image on product view.
  // product.html.
  private image;
  constructor(public navCtrl: NavController, public navParams: NavParams) { }

  ionViewDidLoad() {
    this.image = this.navParams.get('img');
  }

  close() {
    this.navCtrl.pop();
  }

}
