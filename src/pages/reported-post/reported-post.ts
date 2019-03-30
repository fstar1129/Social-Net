import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { DataProvider } from '../../providers/data';
import { LoadingProvider } from '../../providers/loading';

/**
 * Generated class for the ReportedPostPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-reported-post',
  templateUrl: 'reported-post.html',
})
export class ReportedPostPage {
  reportedPost = []
  constructor(public navCtrl: NavController, 
    public navParams: NavParams,
    public dataProvider: DataProvider, 
    public loadingProvider: LoadingProvider,  

    public actionSheetCtrl: ActionSheetController,
  ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ReportedPostPage');
    this.loadingProvider.show();    
    this.getReportedPost()
  }

  reportPost(item) {
    let actionSheet = this.actionSheetCtrl.create({
      title: "Reported Post",
      buttons: [
        {
          text: 'Delete post',
          role: 'destructive',
          handler: () => {
            console.log(" report Post ", item);
            this.dataProvider.removePost(item)
          }
        },
        {
          text: 'Ignore Post',
          role: 'destructive',
          handler: () => {
            console.log('Cancel clicked', item);
          
            this.dataProvider.ignorePost(item)
          }
        },
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });

    actionSheet.present();
  }


  getReportedPost(){
    this.dataProvider.getAllReportedPost().subscribe((post) => {
      this.loadingProvider.hide();
      this.reportedPost = post;
    })
  }

}
