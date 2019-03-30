import { Component } from '@angular/core';
import { NavController, NavParams, App } from 'ionic-angular';
import { NewGroupPage } from '../new-group/new-group';
import { DataProvider } from '../../providers/data';
import { LoadingProvider } from '../../providers/loading';
import { GroupPage } from '../group/group';

@Component({
  selector: 'page-groups',
  templateUrl: 'groups.html'
})
export class GroupsPage {
  private groups: any;
  private searchGroup: any;
  private updateDateTime: any;
  // GroupsPage
  // This is the page where the user can add, view and search for groups.
  constructor(public navCtrl: NavController, public navParams: NavParams, public app: App, public dataProvider: DataProvider, public loadingProvider: LoadingProvider) { }

  ionViewDidLoad() {
    // Initialize
    this.searchGroup = '';
    this.loadingProvider.show();

    // Get groups
    this.dataProvider.getGroups().subscribe((groupIds) => {
      if (groupIds.length > 0) {
        if(this.groups && this.groups.length > groupIds.length) {
          // User left/deleted a group, clear the list and add or update each group again.
          this.groups = [];
        }
        groupIds.forEach((groupId) => {
          this.dataProvider.getGroup(groupId.$key).subscribe((group) => {
            if (group.$exists()) {
              if(group.messages){
                // Get group's unreadMessagesCount
                group.unreadMessagesCount = group.messages.length - groupId.messagesRead
                // Get group's last active date
                group.date = group.messages[group.messages.length - 1].date;
              }
              this.addOrUpdateGroup(group);
            }
          });
        });
        this.loadingProvider.hide();
      } else {
        this.groups = [];
        this.loadingProvider.hide();
      }
    });

    // Update groups' last active date time elapsed every minute based on Moment.js.
    var that = this;
    if (!that.updateDateTime) {
      that.updateDateTime = setInterval(function() {
        if (that.groups) {
          that.groups.forEach((group) => {
            let date = group.date;
            group.date = new Date(date);
          });
        }
      }, 60000);
    }
  }

  // Add or update group for real-time sync based on our observer.
  addOrUpdateGroup(group) {
    if (!this.groups) {
      this.groups = [group];
    } else {
      var index = -1;
      for (var i = 0; i < this.groups.length; i++) {
        if (this.groups[i].$key == group.$key) {
          index = i;
        }
      }
      if (index > -1) {
        this.groups[index] = group;
      } else {
        this.groups.push(group);
      }
    }
  }

  // Remove group, because group has already been deleted.
  // removeGroup(group) {
  //   if (this.groups) {
  //     var index = -1;
  //     for (var i = 0; i < this.groups.length; i++) {
  //       if (this.groups[i].$key == group.$key) {
  //         index = i;
  //       }
  //     }
  //     if (index > -1) {
  //       this.groups.splice(index, 1);
  //     }
  //   }
  // }

  // New Group.
  newGroup() {
    this.app.getRootNav().push(NewGroupPage);
  }

  // Open Group Chat.
  viewGroup(groupId) {
    this.app.getRootNav().push(GroupPage, { groupId: groupId });
  }

  // Return class based if group has unreadMessages or not.
  hasUnreadMessages(group) {
    if (group.unreadMessagesCount > 0) {
      return 'group bold';
    } else
      return 'group';
  }
}
