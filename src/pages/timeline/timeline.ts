import { Component } from "@angular/core";
import {
  IonicPage,
  NavController,
  NavParams,
  ModalController,
  Platform,
  AlertController,
  ActionSheetController
} from "ionic-angular";
import { AddPostPage } from "../add-post/add-post";
import { LoadingProvider } from "../../providers/loading";
import { DataProvider } from "../../providers/data";
import { AngularFireDatabase } from "angularfire2/database";
import * as firebase from "firebase";
import { FirebaseProvider } from "../../providers/firebase";
import * as _ from "lodash";
import { CommentsPage } from "../comments/comments";
import { ImageModalPage } from "../image-modal/image-modal";
import { AlertProvider } from "../../providers/alert";
import { HomePage } from "../home/home";
import { UpdateContactPage } from "../update-contact/update-contact";
import { LoginPage } from "../login/login";
import { LogoutProvider } from "../../providers/logout";
declare var AccountKitPlugin: any;

/**
 * Generated class for the TimelinePage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: "page-timeline",
  templateUrl: "timeline.html"
})
export class TimelinePage {
  private user: any;
  public timelineData: any;
  public friendsList: any;
  isFirstTime;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public loadingProvider: LoadingProvider,
    public angularDb: AngularFireDatabase,
    public dataProvider: DataProvider,
    public firebaseProvider: FirebaseProvider,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public actionSheetCtrl: ActionSheetController,
    public alertProvider: AlertProvider,
    public logoutProvider: LogoutProvider,
    public platform: Platform
  ) {
    this.platform.ready().then(() => {
      this.platform.pause.subscribe(() => {
        this.isFirstTime = false;
        if (this.user.userId) {
          // Update userData on Database.
          this.angularDb
            .object("/accounts/" + this.user.userId)
            .update({
              isOnline: false
            })
            .then(success => {})
            .catch(error => {
              //this.alertProvider.showErrorMessage('profile/error-update-profile');
            });
        }
      });

      this.platform.resume.subscribe(() => {
        this.isFirstTime = false;
        if (this.user.userId) {
          // Update userData on Database.
          this.angularDb
            .object("/accounts/" + this.user.userId)
            .update({
              isOnline: true
            })
            .then(success => {})
            .catch(error => {
              //this.alertProvider.showErrorMessage('profile/error-update-profile');
            });
        }
      });

      this.dataProvider.getData("userData").then(data => {
        if (data.phoneNumber == "") {
          let modal = this.modalCtrl.create(UpdateContactPage, {
            userData: data
          });
          modal.present();
        }
      });
    });
  }

  ionViewDidLoad() {
    this.isFirstTime = true;
    this.getTimeline();
    this.dataProvider.getCurrentUser().subscribe(user => {
      console.log("==user", user.isBlock);
      if (user.isBlock) {
        this.logoutProvider.logout().then(res => {
          this.dataProvider.clearData();
          AccountKitPlugin.logout();
          this.navCtrl.parent.parent.setRoot(LoginPage);
          this.alertProvider.showToast("You are temporary blocked.");
        });
      }
    });
  }

  getTimeline() {
    // Observe the userData on database to be used by our markup html.
    // Whenever the userData on the database is updated, it will automatically reflect on our user variable.
    this.loadingProvider.show();
    //this.createUserData();

    let userData = this.dataProvider.getCurrentUser().subscribe(user => {
      this.user = <any>user;
      console.log("timline user", this.user);
      this.dataProvider.getContact().then(data => {
        // if (data && this.user.phoneNumber != "") {
        //   this.dataProvider.setContactWithCountryCode(this.user.countryCode);
        // }
      });
      this.dataProvider.setData("userData", this.user);
      userData.unsubscribe();

      //  Update userData on Database.
    });

    // Get Friend  List
    this.dataProvider.getFriends().subscribe(friends => {
      // Get timeline by user
      this.dataProvider.getTimelinePost().subscribe(post => {
        this.loadingProvider.hide();

        if (this.timelineData) {
          let timeline = post[post.length - 1];
          let tempData = <any>{};
          tempData = timeline;

          let friendIndex = _.findKey(friends, data => {
            let _tempData = <any>data;
            return _tempData.$value == timeline.postBy;
          });
          if (
            friendIndex ||
            timeline.postBy == firebase.auth().currentUser.uid
          ) {
            this.dataProvider.getUser(timeline.postBy).subscribe(user => {
              tempData.avatar = user.img;
              tempData.name = user.name;
            });

            // Check Locaion

            if (timeline.location) {
              let tempLocaion = JSON.parse(timeline.location);
              tempData.lat = tempLocaion.lat;
              tempData.long = tempLocaion.long;
              // tempData.location="https://maps.googleapis.com/maps/api/staticmap?&zoom=13&size=500x200&maptype=roadmap&markers=color:red|label:S|"+tempLocaion.lat+","+tempLocaion.long+"&key=AIzaSyAt0edUAx4S2d7z8wh1Xe04yE9Xml1ZLPY"
              tempData.location =
                "https://maps.googleapis.com/maps/api/staticmap?&zoom=13&size=500x200&maptype=roadmap&markers=color:red|label:S|40.702147,-74.015794&key=AIzaSyAt0edUAx4S2d7z8wh1Xe04yE9Xml1ZLPY";
            }

            //  ===== check like and commnets ===
            this.dataProvider.getLike(tempData.$key).subscribe(likes => {
              tempData.likes = likes.length;

              let isLike = _.findKey(likes, like => {
                let _tempLike = <any>like;
                return _tempLike.$value == firebase.auth().currentUser.uid;
              });

              if (isLike) {
                tempData.isLike = true;
              } else {
                tempData.isLike = false;
              }
            });

            //  ===== check dilike
            this.dataProvider.getdisLike(tempData.$key).subscribe(dislikes => {
              tempData.dislikes = dislikes.length;
              // Check post like or not

              let isdisLike = _.findKey(dislikes, dislike => {
                let _tempLike = <any>dislike;
                return _tempLike.$value == firebase.auth().currentUser.uid;
              });

              if (isdisLike) {
                tempData.isdisLike = true;
              } else {
                tempData.isdisLike = false;
              }
            });

            //  ===== check commnets
            this.dataProvider.getComments(tempData.$key).subscribe(comments => {
              tempData.comments = comments.length;
              // Check post like or not

              let isComments = _.findKey(comments, comment => {
                let _tempComment = <any>comment;
                return (
                  _tempComment.commentBy == firebase.auth().currentUser.uid
                );
              });

              if (isComments) {
                tempData.isComment = true;
              } else {
                tempData.isComment = false;
              }
            });

            // this.addOrUpdateTimeline(tempData)
            this.timelineData.unshift(tempData);
          }
        } else {
          this.timelineData = [];
          post.forEach(data => {
            this.dataProvider.getTimeline(data.$key).subscribe(timeline => {
              if (timeline.$exists()) {
                let tempData = <any>{};
                tempData = timeline;
                let friendIndex = _.findKey(friends, data => {
                  let _tempData = <any>data;
                  return _tempData.$value == timeline.postBy;
                });
                if (
                  friendIndex ||
                  timeline.postBy == firebase.auth().currentUser.uid
                ) {
                  this.dataProvider.getUser(timeline.postBy).subscribe(user => {
                    tempData.avatar = user.img;
                    tempData.name = user.name;
                  });

                  // Check Location
                  if (timeline.location) {
                    let tempLocaion = JSON.parse(timeline.location);
                    tempData.lat = tempLocaion.lat;
                    tempData.long = tempLocaion.long;
                    tempData.location =
                      "https://maps.googleapis.com/maps/api/staticmap?&zoom=13&size=500x300&maptype=roadmap&markers=color:red|label:S|" +
                      tempLocaion.lat +
                      "," +
                      tempLocaion.long;
                  }

                  //  ===== check like
                  this.dataProvider.getLike(tempData.$key).subscribe(likes => {
                    tempData.likes = likes.length;
                    // Check post like or not

                    let isLike = _.findKey(likes, like => {
                      let _tempLike = <any>like;
                      return (
                        _tempLike.$value == firebase.auth().currentUser.uid
                      );
                    });

                    if (isLike) {
                      tempData.isLike = true;
                    } else {
                      tempData.isLike = false;
                    }
                  });

                  //  ===== check dilike
                  this.dataProvider
                    .getdisLike(tempData.$key)
                    .subscribe(dislikes => {
                      tempData.dislikes = dislikes.length;
                      // Check post like or not

                      let isdisLike = _.findKey(dislikes, dislike => {
                        let _tempLike = <any>dislike;
                        return (
                          _tempLike.$value == firebase.auth().currentUser.uid
                        );
                      });

                      if (isdisLike) {
                        tempData.isdisLike = true;
                      } else {
                        tempData.isdisLike = false;
                      }
                    });

                  //  ===== check commnets
                  this.dataProvider
                    .getComments(tempData.$key)
                    .subscribe(comments => {
                      tempData.comments = comments.length;
                      // Check post like or not

                      let isComments = _.findKey(comments, comment => {
                        let _tempComment = <any>comment;
                        return (
                          _tempComment.commentBy ==
                          firebase.auth().currentUser.uid
                        );
                      });

                      if (isComments) {
                        tempData.isComment = true;
                      } else {
                        tempData.isComment = false;
                      }
                    });

                  // this.addOrUpdateTimeline(tempData)
                  this.timelineData.unshift(tempData);
                }
              }
            });
          });
        }
      });
    });
    // ====== user post time line
    // this.dataProvider.getTimelines().subscribe((timelineIds)=>{
    //   if(timelineIds.length>0){
    //     this.loadingProvider.hide();
    //       this.timelineData = []
    //       timelineIds.forEach((timelineId)=>{
    //           this.dataProvider.getTimeline(timelineId.$value).subscribe((timeline)=>{
    //             if(timeline.$exists()){
    //               let tempData = <any>{};
    //               tempData = timeline;
    //               this.dataProvider.getUser(timeline.postBy).subscribe((user) => {
    //                 tempData.avatar = user.img;
    //                 tempData.name = user.name
    //               });
    //               // this.addOrUpdateTimeline(tempData)
    //               this.timelineData.unshift(tempData);
    //             }
    //           })
    //       })
    //   } else {
    //     this.timelineData = [];
    //     this.loadingProvider.hide();
    //   }
    // })

    // get all time line
  }

  // report to admin
  reportPost(item) {
    let actionSheet = this.actionSheetCtrl.create({
      title: "Report post to admin",
      buttons: [
        {
          text: "Report",
          role: "destructive",
          handler: () => {
            console.log(" report Post ", item);
            this.loadingProvider.show();
            this.firebaseProvider.reportPost(item, this.user).then(
              res => {
                this.loadingProvider.hide();
                this.alertProvider.showToast("Post reported successfully");
              },
              err => {
                this.loadingProvider.hide();
              }
            );
          }
        },
        {
          text: "Cancel",
          role: "cancel",
          handler: () => {
            console.log("Cancel clicked");
          }
        }
      ]
    });

    actionSheet.present();
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
            name = "ionSocial User";
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
            phoneNumber: ""
          };
          // Insert data on our database using AngularFire.
          this.angularDb
            .object("/accounts/" + userId)
            .set(tempData)
            .then(() => {
              this.loadingProvider.hide();
              //this.videoProvider.InitializingRTC(tempData);
              // if(!tempData.phonenumber){
              //     let alert = this.alertCtrl.create({
              //       title: 'Update your phone number',
              //       message: 'Please add your contact number',
              //       buttons: [
              //         {
              //           text: 'No'
              //         },
              //         {
              //           text: 'Yes',
              //           handler: data => {
              //                this.navCtrl.setRoot(HomePage);
              //           }
              //         }]
              //       }).present()
              // }
            });
        } else {
          //  if(this.user.phonenumber){
          //      this.alertCtrl.create({
          //       title: 'Update your phone number',
          //       message: 'Please add your contact number',
          //       buttons: [
          //         {
          //           text: 'No'
          //         },
          //         {
          //           text: 'Yes',
          //           handler: data => {
          //                this.navCtrl.setRoot(HomePage);
          //           }
          //         }]
          //       }).present()
          // }
          let isDt = true;
          if (isDt) {
            isDt = false;
            if (this.isFirstTime) {
              setTimeout(() => {
                //this.videoProvider.InitializingRTC(this.user);

                this.angularDb
                  .object("/accounts/" + this.user.userId)
                  .update({
                    isOnline: true
                  })
                  .then(success => {})
                  .catch(error => {});
              }, 500);
            }
          }

          // let isDt = true;
          // this.dataProvider.getCurrentUser().subscribe((user) => {
          //   this.user = <any>user;
          //   if(isDt){
          //      isDt = false;
          //      if(this.isFirstTime){
          //         setTimeout(()=>{
          //             this.videoProvider.InitializingRTC(this.user);
          //             this.angularDb.object('/accounts/' + this.user.userId).update({
          //               isOnline: true
          //             }).then((success) => {

          //             }).catch((error) => {
          //               //this.alertProvider.showErrorMessage('profile/error-update-profile');
          //             });
          //         },500)

          //       }
          //   }
          // });
        }
      });
  }

  // Add or update timeline data for real-time sync.
  addOrUpdateTimeline(timeline) {
    if (!this.timelineData) {
      this.timelineData = [timeline];
    } else {
      var index = -1;
      for (var i = 0; i < this.timelineData.length; i++) {
        if (this.timelineData[i].$key == timeline.$key) {
          index = i;
        }
      }
      if (index > -1) {
        this.timelineData[index] = timeline;
      } else {
        this.timelineData.unshift(timeline);
      }
    }
  }

  addPost() {
    this.navCtrl.push(AddPostPage);
  }

  likePost(post) {
    this.firebaseProvider.likePost(post.$key);
  }

  delikePost(post) {
    this.firebaseProvider.delikePost(post.$key);
  }

  disikePost(post) {
    this.firebaseProvider.dislikePost(post.$key);
  }
  dedislikePost(post) {
    this.firebaseProvider.dedislikePost(post.$key);
  }

  commentPost(post) {
    let modal = this.modalCtrl.create(CommentsPage, { postKey: post.$key });
    modal.present();
  }

  openMap(lat, long) {
    window.open(
      "http://maps.google.com/maps?q=" + lat + "," + long,
      "_system",
      "location=yes"
    );
  }

  // Enlarge image messages.
  enlargeImage(img) {
    let imageModal = this.modalCtrl.create(ImageModalPage, { img: img });
    imageModal.present();
  }
}
