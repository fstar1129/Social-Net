import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { HomePage } from '../home/home';
import { MessagesPage } from '../messages/messages';
import { GroupsPage } from '../groups/groups';
import { FriendsPage } from '../friends/friends';
import { DataProvider } from '../../providers/data';
import { TimelinePage } from '../timeline/timeline';
import { Badge } from '@ionic-native/badge';

import * as firebase from 'firebase';

@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {
  messages: any = MessagesPage;
  groups: any = GroupsPage;
  friends: any = FriendsPage;
  profile: any = HomePage;
  timeline: any = TimelinePage;
  private unreadMessagesCount: any;
  private friendRequestCount: any;
  private unreadGroupMessagesCount: any;
  private groupList: any;
  private groupsInfo: any;
  private conversationList: any;
  private conversationsInfo: any;
  // TabsPage
  // This is the page where we set our tabs.
  constructor(public navCtrl: NavController, 
    public navParams: NavParams, 
    public dataProvider: DataProvider,
    private badge: Badge) {
  }

  ionViewDidLoad() {
    // debugger;
    // Get friend requests count.
    // document.location.href = 'index.html';
    this.dataProvider.getRequests(firebase.auth().currentUser.uid).subscribe((requests) => {
      if (requests.friendRequests) {
        this.friendRequestCount = requests.friendRequests.length;
      } else {
        this.friendRequestCount = null;
      }
      this.setBadgeCount();
    });

    // Get conversations and add/update if the conversation exists, otherwise delete from list.
    this.dataProvider.getConversations().subscribe((conversationsInfo) => {
      this.unreadMessagesCount = null;
      this.conversationsInfo = null;
      this.conversationList = null;
      if (conversationsInfo.length > 0) {
        this.conversationsInfo = conversationsInfo;
        conversationsInfo.forEach((conversationInfo) => {
          this.dataProvider.getConversation(conversationInfo.conversationId).subscribe((conversation) => {
            if (conversation.$exists()) {
              this.addOrUpdateConversation(conversation);
            }
          });
        });
      }
    });

    this.dataProvider.getGroups().subscribe((groupIds) => {
      if (groupIds.length > 0) {
        this.groupsInfo = groupIds;
        if (this.groupList && this.groupList.length > groupIds.length) {
          // User left/deleted a group, clear the list and add or update each group again.
          this.groupList = null;
        }
        groupIds.forEach((groupId) => {
          this.dataProvider.getGroup(groupId.$key).subscribe((group) => {
            if (group.$exists()) {
              this.addOrUpdateGroup(group);
            }
          });
        });
      } else {
        this.unreadGroupMessagesCount = null;
        this.groupsInfo = null;
        this.groupList = null;
      }
    });
    console.log("AAAAAAAAA");
    console.log(firebase.auth().currentUser.uid);
    console.log("AAAAAAAAA");
  }

  // Add or update conversaion for real-time sync of unreadMessagesCount.
  addOrUpdateConversation(conversation) {
    if (!this.conversationList) {
      this.conversationList = [conversation];
    } else {
      var index = -1;
      for (var i = 0; i < this.conversationList.length; i++) {
        if (this.conversationList[i].$key == conversation.$key) {
          index = i;
        }
      }
      if (index > -1) {
        this.conversationList[index] = conversation;
      } else {
        this.conversationList.push(conversation);
      }
    }
    this.computeUnreadMessagesCount();
  }

  // Compute all conversation's unreadMessages.
  computeUnreadMessagesCount() {
    this.unreadMessagesCount = 0;
    if (this.conversationList) {
      for (var i = 0; i < this.conversationList.length; i++) {
        this.unreadMessagesCount += this.conversationList[i].messages.length - this.conversationsInfo[i].messagesRead;
        if (this.unreadMessagesCount == 0) {
          this.unreadMessagesCount = null;
        }
        this.setBadgeCount();
      }
    }
  }

  getUnreadMessagesCount() {
    if (this.unreadMessagesCount) {
      if (this.unreadMessagesCount > 0) {
        return this.unreadMessagesCount;
      }
    }
    return null;
  }

   // Compute all group's unreadMessages.
  computeUnreadGroupMessagesCount() {
    this.unreadGroupMessagesCount = 0;
    if (this.groupList) {
      for (var i = 0; i < this.groupList.length; i++) {
        if (this.groupList[i].messages) {
          this.unreadGroupMessagesCount += this.groupList[i].messages.length - this.groupsInfo[i].messagesRead;
        }
        if (this.unreadGroupMessagesCount == 0) {
          this.unreadGroupMessagesCount = null;
        }
        this.setBadgeCount();
      }
    }
  }

  getUnreadGroupMessagesCount() {
    if (this.unreadGroupMessagesCount) {
      if (this.unreadGroupMessagesCount > 0) {
        return this.unreadGroupMessagesCount;
      }
    }
    return null;
  }

  // Add or update group
  addOrUpdateGroup(group) {
    if (!this.groupList) {
      this.groupList = [group];
    } else {
      var index = -1;
      for (var i = 0; i < this.groupList.length; i++) {
        if (this.groupList[i].$key == group.$key) {
          index = i;
        }
      }
      if (index > -1) {
        this.groupList[index] = group;
      } else {
        this.groupList.push(group);
      }
    }
    this.computeUnreadGroupMessagesCount();
  }

  // Remove group from list if group is already deleted.
  removeGroup(groupId) {
    if (this.groupList) {
      var index = -1;
      for (var i = 0; i < this.groupList.length; i++) {
        if (this.groupList[i].$key == groupId) {
          index = i;
        }
      }
      if (index > -1) {
        this.groupList.splice(index, 1);
      }

      index = -1;
      for (i = 0; i < this.groupsInfo.length; i++) {
        if (this.groupsInfo[i].$key == groupId) {
          index = i;
        }
      }
      if (index > -1) {
        this.groupsInfo.splice(index, 1);
      }
      this.computeUnreadGroupMessagesCount();
    }
  }

 

  setBadgeCount(){
    let count=0;
    if(this.unreadGroupMessagesCount>0){
      count = +count+this.unreadGroupMessagesCount;
    }
    if(this.unreadMessagesCount>0){
       count = +count+this.unreadMessagesCount;
    }
    if(this.friendRequestCount>0){
      count = +count+this.friendRequestCount
    }
    // if(this.getUnreadMessagesCount()){
    //   count = +count+this.getUnreadMessagesCount()
    // }
    // if(this.getUnreadGroupMessagesCount()){
    //   count= +count+this.getUnreadGroupMessagesCount();
    // }
    this.badge.set(count);
  }
}
