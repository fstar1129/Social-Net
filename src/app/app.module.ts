import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule } from "@angular/core";
import { IonicApp, IonicErrorHandler, IonicModule } from "ionic-angular";
import { SplashScreen } from "@ionic-native/splash-screen";
import { StatusBar } from "@ionic-native/status-bar";
import { Camera } from "@ionic-native/camera";
import { GooglePlus } from "@ionic-native/google-plus";
import { Keyboard } from "@ionic-native/keyboard";
import { Toast } from "@ionic-native/toast";
import { GoogleMaps } from "@ionic-native/google-maps";
import { Geolocation } from "@ionic-native/geolocation";
import { MyApp } from "./app.component";

import { LoginPage } from "../pages/login/login";
import { HomePage } from "../pages/home/home";
import { VerificationPage } from "../pages/verification/verification";
import { TrialPage } from "../pages/trial/trial";
import { TabsPage } from "../pages/tabs/tabs";
import { MessagesPage } from "../pages/messages/messages";
import { GroupsPage } from "../pages/groups/groups";
import { FriendsPage } from "../pages/friends/friends";
import { SearchPeoplePage } from "../pages/search-people/search-people";
import { RequestsPage } from "../pages/requests/requests";
import { UserInfoPage } from "../pages/user-info/user-info";
import { NewMessagePage } from "../pages/new-message/new-message";
import { MessagePage } from "../pages/message/message";
import { NewGroupPage } from "../pages/new-group/new-group";
import { GroupPage } from "../pages/group/group";
import { AddPostPage } from "../pages/add-post/add-post";
import { UpdateContactPage } from "../pages/update-contact/update-contact";
import { TimelinePage } from "../pages/timeline/timeline";
import { GroupInfoPage } from "../pages/group-info/group-info";
import { AddMembersPage } from "../pages/add-members/add-members";
import { ImageModalPage } from "../pages/image-modal/image-modal";
import { LoginProvider } from "../providers/login";
import { LogoutProvider } from "../providers/logout";
import { LoadingProvider } from "../providers/loading";
import { AlertProvider } from "../providers/alert";
import { ImageProvider } from "../providers/image";
import { DataProvider } from "../providers/data";
import { FirebaseProvider } from "../providers/firebase";
import { CountryCodeProvider } from "../providers/country-code";
import { CommentsPage } from "../pages/comments/comments";
import { VideoCallPage } from "../pages/video-call/video-call";
import { UsersPage } from "../pages/users/users";
import { ReportedPostPage } from "../pages/reported-post/reported-post";
// import { AngularFireModule, AuthMethods, AuthProviders } from 'angularfire2';
import { AngularFireModule } from "angularfire2";
import {
  AngularFireDatabaseModule,
  AngularFireDatabase,
  FirebaseListObservable
} from "angularfire2/database";
import { AngularFireAuthModule, AngularFireAuth } from "angularfire2/auth";
import * as firebase from "firebase/app";
// import { GooglePlus } from '@ionic-native/google-plus';
import { NativeAudio } from "@ionic-native/native-audio";
import { AdMobFree, AdMobFreeBannerConfig } from "@ionic-native/admob-free";
import { SocialSharing } from "@ionic-native/social-sharing";
import {
  Contacts,
  Contact,
  ContactField,
  ContactName
} from "@ionic-native/contacts";
import { IonicStorageModule, Storage } from "@ionic/storage";
import { File } from "@ionic-native/file";
import {
  MediaCapture,
  MediaFile,
  CaptureError,
  CaptureImageOptions
} from "@ionic-native/media-capture";
import {
  IonicAudioModule,
  WebAudioProvider,
  CordovaMediaProvider,
  defaultAudioProviderFactory
} from "ionic-audio";
import { InAppBrowser } from "@ionic-native/in-app-browser";

import { Badge } from "@ionic-native/badge";

import { Login } from "../login";

import { FriendPipe } from "../pipes/friend";
import { SearchPipe } from "../pipes/search";
import { ConversationPipe } from "../pipes/conversation";
import { DateFormatPipe } from "../pipes/date";
import { GroupPipe } from "../pipes/group";
import { VideoProvider } from "../providers/video";

export function myCustomAudioProviderFactory() {
  return window.hasOwnProperty("cordova")
    ? new CordovaMediaProvider()
    : new WebAudioProvider();
}

firebase.initializeApp(Login.firebaseConfig);

@NgModule({
  declarations: [
    MyApp,
    LoginPage,
    HomePage,
    VerificationPage,
    TrialPage,
    TabsPage,
    MessagesPage,
    GroupsPage,
    FriendsPage,
    SearchPeoplePage,
    RequestsPage,
    UserInfoPage,
    NewMessagePage,
    MessagePage,
    NewGroupPage,
    GroupPage,
    GroupInfoPage,
    AddMembersPage,
    ImageModalPage,
    FriendPipe,
    ConversationPipe,
    SearchPipe,
    DateFormatPipe,
    GroupPipe,
    TimelinePage,
    AddPostPage,
    CommentsPage,
    VideoCallPage,
    UpdateContactPage,
    ReportedPostPage,
    UsersPage
  ],
  imports: [
    BrowserModule,
    IonicAudioModule.forRoot(defaultAudioProviderFactory),
    IonicModule.forRoot(MyApp, {
      mode: "ios",
      scrollAssist: false,
      autoFocusAssist: false
    }),
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(Login.firebaseConfig),
    AngularFireDatabaseModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LoginPage,
    HomePage,
    VerificationPage,
    TrialPage,
    TabsPage,
    MessagesPage,
    GroupsPage,
    FriendsPage,
    SearchPeoplePage,
    RequestsPage,
    UserInfoPage,
    NewMessagePage,
    MessagePage,
    NewGroupPage,
    GroupPage,
    GroupInfoPage,
    AddMembersPage,
    ImageModalPage,
    TimelinePage,
    AddPostPage,
    CommentsPage,
    VideoCallPage,
    UpdateContactPage,
    ReportedPostPage,
    UsersPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    InAppBrowser,
    Camera,
    MediaCapture,
    File,
    GooglePlus,
    Keyboard,
    Toast,
    CountryCodeProvider,
    GoogleMaps,
    Contacts,
    Geolocation,
    AdMobFree,
    Badge,
    SocialSharing,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    LoginProvider,
    LogoutProvider,
    LoadingProvider,
    AlertProvider,
    ImageProvider,
    DataProvider,
    FirebaseProvider,
    NativeAudio,
    VideoProvider
  ]
})
export class AppModule {}
