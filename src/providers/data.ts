import { Injectable } from "@angular/core";
import { AngularFireDatabase } from "angularfire2/database";
import * as firebase from "firebase";
import {
  Contacts,
  Contact,
  ContactField,
  ContactName
} from "@ionic-native/contacts";
import { Storage } from "@ionic/storage";
import async from "async";
import _ from 'lodash';

@Injectable()
export class DataProvider {
  // Data Provider
  // This is the provider class for most of the Firebase observables in the app.
  webRTCClient;
  incomingCallId;
  userContactsList = [];
  userOnlyContacts = [];
  exitsUserList = [];
  inviteUserList = [];
  userContactsListWithCountryCode = [];
  isContactGet = false;
  countryCode = "+1";
  constructor(
    public angularDb: AngularFireDatabase,
    private contacts: Contacts,
    private storage: Storage,
  ) {
  }

  // set webRTCClient
  setWebRTCClient(val) {
    this.webRTCClient = val;
  }

  // get webRTCClient
  getwebRTCClient() {
    return this.webRTCClient;
  }

  // set Incoming Call id
  setIncomingCallId(id) {
    this.incomingCallId = id;
  }

  // get incoming call id
  getIncomingCallid() {
    return this.incomingCallId;
  }

  // Get all users
  getUsers() {
    return this.angularDb.list("/accounts", {
      query: {
        orderByChild: "name"
      }
    });
  }

  // Get user with username
  getUserWithUsername(username) {
    return this.angularDb.list("/accounts", {
      query: {
        orderByChild: "username",
        equalTo: username
      }
    });
  }

  // Get user with phonenumber
  getUserWithPhonenumber(phoneNumber) {
    return this.angularDb.list("/accounts", {
      query: {
        orderByChild: "phoneNumber",
        equalTo: phoneNumber
      }
    });
  }

  // Get logged in user data
  getCurrentUser() {
    return this.angularDb.object(
      "/accounts/" + firebase.auth().currentUser.uid
    );
  }

  // Get user by their userId
  getUser(userId) {
    return this.angularDb.object("/accounts/" + userId);
  }

 
  // Get requests given the userId.
  getRequests(userId) {
    return this.angularDb.object("/requests/" + userId);
  }

  // Get friend requests given the userId.
  getFriendRequests(userId) {
    return this.angularDb.list("/requests", {
      query: {
        orderByChild: "receiver",
        equalTo: userId
      }
    });
  }

  // Get conversation given the conversationId.
  getConversation(conversationId) {
    return this.angularDb.object("/conversations/" + conversationId);
  }

  // Get conversations of the current logged in user.
  getConversations() {
    return this.angularDb.list(
      "/accounts/" + firebase.auth().currentUser.uid + "/conversations"
    );
  }

  // Get messages of the conversation given the Id.
  getConversationMessages(conversationId) {
    return this.angularDb.object(
      "/conversations/" + conversationId + "/messages"
    );
  }

  // Get messages of the group given the Id.
  getGroupMessages(groupId) {
    return this.angularDb.object("/groups/" + groupId + "/messages");
  }

  // Get groups of the logged in user.
  getGroups() {
    return this.angularDb.list(
      "/accounts/" + firebase.auth().currentUser.uid + "/groups"
    );
  }

  // Get group info given the groupId.
  getGroup(groupId) {
    return this.angularDb.object("/groups/" + groupId);
  }

  // Get Timeline of user
  getTimelines() {
    return this.angularDb.list(
      "/accounts/" + firebase.auth().currentUser.uid + "/timeline"
    );
  }

  // Get Timeline by user id
  getTimelineByUid(id) {
    return this.angularDb.object(
      "/accounts/" + id + "/timeline"
    );
  }

  // Get Timeline post
  getTimelinePost() {
    return this.angularDb.list("/timeline");
  }

  getAllReportedPost() {
    return this.angularDb.list("/reportPost");

  }

  // Get time line by id
  getTimeline(timelineId) {
    return this.angularDb.object("/timeline/" + timelineId);
  }

  // Get Friend List
  getFriends() {
    return this.angularDb.list(
      "/accounts/" + firebase.auth().currentUser.uid + "/friends"
    );
  }

  // Get comments list
  getComments(postId) {
    return this.angularDb.list("/comments/" + postId);
  }

  // Get likes
  getLike(postId) {
    return this.angularDb.list("/likes/" + postId);
  }

  postLike(postId) {
    return this.angularDb.object("/likes/" + postId);
  }

  // Get likes
  getdisLike(postId) {
    return this.angularDb.list("/dislikes/" + postId);
  }

  postdisLike(postId) {
    return this.angularDb.object("/dislikes/" + postId);
  }
  // post Comments
  postComments(postId) {
    return this.angularDb.object("/comments/" + postId);
  }

  // report post to admin
  getReportPost(postId) {
    console.log("postId", postId)
    return this.angularDb.object("/reportPost/" + postId);
  }

  // read contact
  getContact() {
    return new Promise((resolve, reject) => {
      if (!this.isContactGet) {
        this.contacts.find(["*"], {}).then(
          contacts => {
            this.userContactsList = [];
            this.isContactGet = true;
            // this.contactlist = data
            for (let i = 0; i < contacts.length; i++) {
              if (contacts[i].phoneNumbers) {
                // for(let j = 0; j < contacts[i].phoneNumbers.length; j++) {
                if (
                  contacts[i].phoneNumbers[0].value.toString().charAt(0) ==
                  "*" ||
                  contacts[i].phoneNumbers[0].value.toString().charAt(0) == "#"
                ) {
                } else {
                  let user = {
                    name: this.getNameFromContact(
                      contacts[i],
                      contacts[i].phoneNumbers[0].value.toString()
                    ),
                    phoneNumber: contacts[i].phoneNumbers[0].value.toString()
                  };
                  this.userOnlyContacts.push(
                    contacts[i].phoneNumbers[0].value.toString()
                  );
                  this.userContactsList.push(user);
                }
                // }
              }
            }
            resolve(this.userOnlyContacts);
            this.isContactGet = false;
          },
          err => {
            reject(err);
          }
        );
      } else {
        resolve(this.userContactsList);
      }
    });
  }

  getNameFromContact(contact, number) {
    if (contact.name) {
      if (contact.name.formatted) {
        return contact.name.formatted;
      } else {
        return number;
      }
    } else {
      return number;
    }
  }

  setContactWithCountryCode(countryCode) {
    this.countryCode = countryCode;
    return new Promise((resolve, reject) => {
      async.map(
        this.userContactsList,
        (item, CB) => {
          this.checkContact(item, CB);
        },
        (err, results) => {
          // results is now an array of stats for each file
          if (err) {
            reject(false)
          } else {
            let contact = results;
            resolve(contact)
          }
        }
      );
    });
  }

  checkContact(item, callback) {
    let temp = item.phoneNumber.trim();
    temp = temp.split(")").join("");
    temp = temp.split("(").join("");
    temp = temp.split(" ").join("");
    temp = temp.replace(/\s/g, "");
    temp = temp.split("-").join("");
    if (temp.charAt(0) == "+") {
    } else if (temp.charAt(0) == "0" && temp.charAt(1) == "0") {
      let _tempConatct = "+" + temp.substr(2);
      item["phoneNumber"] = _tempConatct;
    } else if (temp.charAt(0) == "0") {
      let _tempConatct = this.countryCode + temp.substr(1);
      item["phoneNumber"] = _tempConatct;
    } else {
      let numberWithCountryCode = this.countryCode + temp;
      item["phoneNumber"] = numberWithCountryCode;
    }
    this.getUserWithPhonenumber(item.phoneNumber).subscribe(data => {
      if (data.length > 0) {
        item["isUser"] = "1";
      } else {
        item["isUser"] = "0";
      }
    });
    callback(null, item);
  }

  // setContactWithCountryCode(countryCode) {
  //   // this.userContactsListWithCountryCode = [];
  //   return new Promise((resolve, reject) => {
  //     for (let i = 0; i < this.userContactsList.length; i++) {
  //       let temp = this.userContactsList[i].phoneNumber;
  //       temp = temp.split(")").join("");
  //       temp = temp.split("(").join("");
  //       temp = temp.split(" ").join("");
  //       temp = temp.replace(/\s/g, "");
  //       temp = temp.split("-").join("");

  //       if (temp.charAt(0) == "+") {
  //       } else if (temp.charAt(0) == "0" && temp.charAt(1) == "0") {
  //         let _tempConatct = "+" + temp.substr(2);
  //         this.userContactsList[i].phoneNumber = _tempConatct;
  //       } else if (temp.charAt(0) == "0") {
  //         let _tempConatct = countryCode + temp.substr(1);
  //         this.userContactsList[i].phoneNumber = _tempConatct;
  //       } else {
  //         let numberWithCountryCode = countryCode + temp;
  //         this.userContactsList[i].phoneNumber = numberWithCountryCode;
  //       }
  //     }
  //     resolve(this.userContactsList);
  //     this.checkUserExitsOrNot(this.userContactsList);
  //  
  //   });
  // }

  setData(key, val) {
    this.storage.set(key, val);
  }

  getData(key) {
    return this.storage.get(key).then(val => {
      return val;
    });
  }

  clearData() {
    this.storage.clear();
  }

  checkUserExitsOrNot(userContactsList) {
    this.exitsUserList = [];
    this.inviteUserList = [];
    userContactsList.forEach(contacts => {
      this.getUserWithPhonenumber(contacts.phoneNumber).subscribe(data => {
        if (data.length > 0) {
          this.exitsUserList.push(userContactsList);
        } else {
          this.inviteUserList.push(userContactsList);
        }
      });
    });
  }

  removePost(post) {
    this.getUser(post.postBy).take(1).subscribe((account) => {
      console.log("before timeline", timeline)
      var timeline = account.timeline;

      _.remove(timeline, (n) => {
        return n == post.$key
      });
      console.log("after timeline", timeline)
      // Add both users as friends.
      this.getUser(post.postBy).update({
        timeline: timeline
      }).then((success) => {

        /**
         * Remove post from time line
        //  */
        this.getTimeline(post.$key).remove().then((success) => {
          this.angularDb.object('/reportPost/' + post.$key).remove();
        }).catch((error) => {
        })
      })
    })
  }

  ignorePost(post){
    console.log("ingnore post ", post)
      this.angularDb.object('/reportPost/' + post.$key).remove()
  }

  unFriend(userId){
    /**
     * Remove friend id from friend account
     */
    this.getUser(userId).take(1).subscribe((account) => {
      var friends = account.friends;
      console.log("==friend List before", friends)
      if(friends){
        _.remove(friends, (n) => {
          return n == firebase.auth().currentUser.uid
        });
        this.getUser(userId).update({
          friends: friends
        }).then((success) => {
        })
      }
      console.log("==friend List after", friends)
      
    })
   /**
    * Remove friend id from login user account
    */
    this.getUser(firebase.auth().currentUser.uid).take(1).subscribe((account) => {
      var friends = account.friends;
      console.log("==user List before", friends)
      if(friends){
        _.remove(friends, (n) => {
          return n == userId
        });
        this.getUser(firebase.auth().currentUser.uid).update({
          friends: friends
        }).then((success) => {
        })
      }
      console.log("==user List after", friends)
      
    })
  }
}
