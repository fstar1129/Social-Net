This is a clone of facebook for [Ionic](http://ionicframework.com/docs/) projects.

### With the Ionic CLI:

Take the name after `ionic2-starter-`, and that is the name of the template to be used when using the `ionic start` command below:

```bash
$ sudo npm install -g ionic cordova
$ ionic start myBlank blank
```

Then, to run it, cd into `myBlank` and run:

```bash
$ ionic cordova platform add ios
$ ionic cordova run ios
```

## ----------------------------------------------------------------------

## ----------------------------------------------------------------------

## ---------------------- HOW TO RUN CODE -------------------------------

## ----------------------------------------------------------------------

## ----------------------------------------------------------------------

PLEAE FOLLOW BELOW INSTRATIONS

1. Download code and unzip it
2. Go to root folder
3. Make sure ionic and node install in your mechine
4. CHANGE FIREBASE KEY, GOOGLE KEY, AND FACEBOOK KEY in login.ts file
5. Then
   ```
   $ npm install
   $ ionic cordova platform add ios
   $ ionic cordova platform add android
   $ ionic cordova run ios / ionic cordova run android
   ```

/// socialapp Project

### Install google-plus plugin

ionic cordova plugin add https://github.com/EddyVerbruggen/cordova-plugin-googleplus --save --variable REVERSED_CLIENT_ID=com.googleusercontent.apps.1040008853766-j1misvip5jil3580hlqft1h4463t0b2t

### Install geolocation plugin

ionic cordova plugin add cordova-plugin-googlemaps --variable API_KEY_FOR_ANDROID="AIzaSyAUk4oQOgQyB86OdcfADVTSE6H3QcQPLyM " --variable API_KEY_FOR_IOS="AIzaSyAqy8j9W2qYSsLg-rzk0Bg2UdBvFZJVeYw" --save

npm install --save @ionic-native/google-maps

### Get Current location

ionic cordova plugin add cordova-plugin-geolocation

$ npm install --save @ionic-native/geolocation

### Native audio plugin

$ ionic cordova plugin add cordova-plugin-nativeaudio
$ npm install --save @ionic-native/native-audio

### install Native Audio

cordova plugin add cordova-plugin-console
cordova plugin add cordova-custom-config
cordova plugin add cordova-plugin-device
cordova plugin add cordova-plugin-iosrtc
cordova plugin add cordova-plugin-media
cordova plugin add android-camera-permission
cordova plugin add cordova-plugin-android-permissions@0.10.0
cordova plugin add https://github.com/alongubkin/audiotoggle.git
cordova plugin add cordova-plugin-audioinput

For iOS only:
cordova plugin add cordova-plugin-iosrtc

For Android only:
cordova plugin add cordova-plugin-crosswalk-webview
cordova plugin add android-camera-permission
cordova plugin add cordova-plugin-android-permissions@0.10.0
cordova plugin add https://github.com/alongubkin/audiotoggle.git
cordova plugin add cordova-plugin-audioinput

# Install plugin Adb mod

$ ionic cordova plugin add cordova-plugin-admob-free
$ npm install --save @ionic-native/admob-free

## Install Social Sharing

$ ionic cordova plugin add cordova-plugin-x-socialsharing
$ npm install --save @ionic-native/social-sharing
Substitute ios for android if not on a Mac.

## Badge installl

$ ionic cordova plugin add cordova-plugin-badge
$ npm install --save @ionic-native/badge

3. Add string in strings.xml file

   <string name="fb_app_id">814520985371944</string>
   <string name="fb_app_name">social app in ionic 3</string>
   <string name="accountkit_token">f9ad6dac276bc6d9b5fc9e075ee4e048</string>

- APK Release steps:
  1.Change android version code
  2. cordova build --release android
     3.go to apk folder of project cd platforms/android/build/outputs/apk
     4>>(if .keystore does not exist) > keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

5. jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore G:/IonicProject/communicaters/communicaters.keystore G:/IonicProject/communicaters/platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk alias_name (passcode: 123456) ( go to C:\Program Files\Java\jdk1.8.0_112\bin)

zipalign -v 4 G:/IonicProject/Communicaters/platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk G:/IonicProject/Communicaters/communicatersv4.apk ( go to C:\Android\sdk\build-tools\23.0.3)

// get sha1 from keystore

6. keytool -list -v -keystore G:/IonicProject/communicaters/communicaters.keystore -alias alias_name -storepass 123456 -keypass 123456

MAc

1. ionic cordova build --release android
2. keytool -genkey -v -keystore communicaters.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000 ( First time)
3. jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore communicaters.keystore platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk alias_name
4. /Users/testing/Library/Android/sdk/build-tools/27.0.3/zipalign -v 4 platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk CommunicaterV17.apk

---

Todo

1. Admob == done
2. Share message == done
3. Badge count == done
4. Access phone contact == done
5. Admin Can Add other people == done
6. Admin can assign as admin to other member == remaining
7. audio recording == remaining
8. offline calling == remaining
