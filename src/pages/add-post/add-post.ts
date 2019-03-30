import { Component,ElementRef,ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams,  AlertController } from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading';
import { DataProvider } from '../../providers/data';
import {AngularFireDatabase} from 'angularfire2/database';
import * as firebase from 'firebase';
import { FirebaseProvider } from '../../providers/firebase';
import { ImageProvider } from '../../providers/image';
import { AlertProvider } from '../../providers/alert';
import { GoogleMaps ,GoogleMap, LatLng,CameraPosition,MarkerOptions,Marker,GoogleMapsEvent} from '@ionic-native/google-maps';
import { Geolocation } from '@ionic-native/geolocation';
declare var google:any;

/**
 * Generated class for the AddPostPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-add-post',
  templateUrl: 'add-post.html',
})
export class AddPostPage {
  private user: any;
  public postText ;
  public alert;
  public image;
  public location;
  @ViewChild('map') mapElement: ElementRef;
  map: any;

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public loadingProvider: LoadingProvider,
    public dataProvider: DataProvider,
    public angularDb:AngularFireDatabase,
    public firebaseProvider: FirebaseProvider,
    public alertCtrl:AlertController,
    public imageProvider:ImageProvider,
    public alertProvider:AlertProvider,
    private googleMaps: GoogleMaps,
    private geolocation: Geolocation) {
  }

  ionViewDidLoad() {
    // Observe the userData on database to be used by our markup html.
    // Whenever the userData on the database is updated, it will automatically reflect on our user variable.
    this.dataProvider.getCurrentUser().subscribe((user) => {
      this.loadingProvider.hide();
      this.user = user;
    });
  }

  post(){
    if(this.image){
      this.loadingProvider.show();
      this.imageProvider.uploadPostImage(this.image).then((url)=>{
        // ======= push new post in 'timeline' ====
        this.angularDb.list('timeline').push({
          dateCreated: new Date().toString(),
          postBy:firebase.auth().currentUser.uid,
          postText:this.postText,
          image:url
        }).then((success)=>{
          this.postText = '';
          let timelineId = success.key;
          this.firebaseProvider.timeline(timelineId);
          this.alertProvider.showToast('Add post successfully ..');
          this.loadingProvider.hide();
          this.navCtrl.pop();

        })
      })
    }else if(this.location){
      this.loadingProvider.show();
      // ======= push new post in 'timeline' ====
      this.angularDb.list('timeline').push({
        dateCreated: new Date().toString(),
        postBy:firebase.auth().currentUser.uid,
        postText:this.postText,
        location:this.location
      }).then((success)=>{
        this.postText = '';
        let timelineId = success.key;
        this.firebaseProvider.timeline(timelineId);
        this.alertProvider.showToast('Add post successfully ..');
        this.loadingProvider.hide();
        this.navCtrl.pop();

      })
    }else{
      this.loadingProvider.show();
      // ======= push new post in 'timeline' ====
      this.angularDb.list('timeline').push({
        dateCreated: new Date().toString(),
        postBy:firebase.auth().currentUser.uid,
        postText:this.postText,
      }).then((success)=>{
        this.postText = '';
        let timelineId = success.key;
        this.firebaseProvider.timeline(timelineId);
        this.alertProvider.showToast('Add post successfully ..')
        this.loadingProvider.hide();
        this.navCtrl.pop();
      })
    }
  }
  imageShare(){
    this.imageProvider.setImage().then((url)=>{
      this.image = url;
    })
  }
  locationShare(){
    this.loadingProvider.show();
    this.geolocation.getCurrentPosition().then((position) => {

     let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

     let mapOptions = {
       center: latLng,
       zoom: 15,
       mapTypeId: google.maps.MapTypeId.ROADMAP
     }
     this.location = JSON.stringify({lat:position.coords.latitude,long:position.coords.longitude})
     this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
     let marker = new google.maps.Marker({
        map: this.map,
        animation: google.maps.Animation.DROP,
        position: this.map.getCenter()
      });
       this.loadingProvider.hide();
   }, (err) => {
   });
  }
}
