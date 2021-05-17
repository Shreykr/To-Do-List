import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CheckUser } from './../../CheckUser';
import { AppService } from './../../app.service';
import { MainService } from './../../main.service';
import { SocketService } from './../../socket.service';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { ActionService } from 'src/app/action.service';
import { LoaderService } from 'src/app/loader.service';

declare const openNavgationBarv1: any;
declare const closeNavigationBarv1: any;
declare const openNavgationBarv2: any;
declare const closeNavigationBarv2: any;
declare const destroyModal: any;
@Component({
  selector: 'app-main-home',
  templateUrl: './main-home.component.html',
  styleUrls: ['./main-home.component.css']
})

export class MainHomeComponent implements OnInit, OnDestroy, CheckUser {

  public subscription_1: Subscription;
  public subscription_2: Subscription;

  scrHeight = window.innerHeight;
  scrWidth = window.innerWidth;

  //main values
  public projectNamesList: any = [];
  public key: any;
  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public flag = 0;
  public errorFlag = 0;
  public projectValue: any;
  public authToken: any;
  public userInfo: any;
  public toggleMainMessage = 0;
  public allUserList: any = [];
  public searchClick = false;
  public disconnectedSocket: Boolean;
  public userMapping: any = {};
  public notificationsList: any = [];
  public notificationsMapping: any = {};
  public notifTrackerList: any = [];
  public notificationModalFlag: Boolean = false;
  public friendsModalFlag: Boolean = false;
  public friendsIdList: any = [];
  public friendsIdMapping: any = [];
  public toggleUndoButton: Boolean = false;
  public undoObject = {};
  public spinner = true;
  public friendId: any;
  public projectName: any;

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.scrHeight = window.innerHeight;
    this.scrWidth = window.innerWidth;
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.key = event.keyCode;
    if (this.key === 27) {
      this.toggleNav();
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleUndoEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 'z') {
      this.performUndoOperation();
    }
    this.handleKeyboardEvent(event)
  }

  //Form group for project name
  projectModalForm = new FormGroup({
    'projectName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9 ]{0,25}$')])
  })

  constructor(
    public router: Router,
    public appService: AppService,
    public mainService: MainService,
    public socketService: SocketService,
    public actionService: ActionService,
    public loaderService: LoaderService,
    public toastr: ToastrService
  ) { this.getScreenSize(); }

  ngOnInit(): void {
    // logic for implementing different sidebars depend on screen size.
    if (this.scrWidth <= 750) {
      this.toggle_2 = 1;
      this.flag = 1;
    }
    else {
      this.flag = 0;
      this.toggle_1 = 1;
    }
    this.authToken = Cookie.get('authtoken');
    this.userInfo = this.appService.getUserInfoFromLocalstorage();

    // checking the user
    if (this.checkStatus()) {

      this.connectToSocket();

      //testing socket connection
      this.verifyUserConfirmation();

      // receiving real time notifications to subscribed socket events
      this.receiveRealTimeNotifications();

      // receiving real time notifications of friend viewing your tasks. All friends will be notified of this activity.
      this.receiveGroupNotifications();

      // getting all the project lists
      this.getProjectLists()

      //check if there are any friend actions logged
      this.checkActionLogger();
    }
  }

  ngOnDestroy() {
    if (this.checkStatus()) {
      this.subscription_1.unsubscribe();
      this.subscription_2.unsubscribe();
    }
  }
  // function to delete all cookies possibly present
  public deleteCookies() {
    Cookie.delete('authtoken');
    Cookie.delete('userId');
    Cookie.delete('collabLeaderId');
    Cookie.delete('projectName');
    Cookie.delete('collabLeaderName');
  } // end of deleteCookies

  // fucntion to check the authToken/session of the user
  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      if (this.errorFlag === 0) {
        this.toastr.error('Invalid/missing auth token. Login again');
        this.errorFlag = 1;
        this.deleteCookies();
        this.router.navigate(['/not-found']);
        return false;
      }
    } else {
      return true;
    }
  } //end of checkStatus

  public connectToSocket: any = () => {
    this.socketService.startConnection()
      .subscribe(() => {
      });
  }
  //function to verify user (socket connection testing)
  public verifyUserConfirmation: any = () => {
    this.socketService.verifyUser()
      .subscribe((data) => {
        this.socketService.setUser(this.authToken);
      });
  } // end of verifyUserConfirmation

  //fucntion to send friend request notification to the recipient
  sendFriendRequest(toId) {
    this.destroyAllModal();
    //constructing the notification object
    let notificationObject = {
      fromId: this.userInfo.userId,
      toId: toId,
      type: 'Friend Request',
      notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} is requesting to add you as their friend`,
      authToken: this.authToken
    }
    this.mainService.checkFriend(notificationObject).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.mainService.verifyNotification(notificationObject).subscribe((apiResult) => {
          if (apiResult.status === 200) {
            this.socketService.sendRequestNotification(notificationObject);
            this.toastr.success("Request sent", '', { timeOut: 2000 });
          }
          else if (apiResult.status === 404) {
            apiResult.message = "Authentication Token is either invalid or expired!"
            this.toastr.error(apiResult.message);
            this.deleteCookies()
            this.router.navigate(['not-found']);
          }
          else if (apiResult.status === 500) {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
          }
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 2250 });
          }
        }, (err) => {
          this.deleteCookies();
          this.router.navigate(['server-error', 500]);
          this.toastr.error('Some error occured', '', { timeOut: 2250 })
        })
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message);
        this.deleteCookies();
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 2250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2250 })
    })
  } // end of sendFriendRequest

  // function to receive real time notifications
  receiveRealTimeNotifications() {
    this.subscription_2 = this.socketService.receiveRealTimeNotifications(this.userInfo.userId).subscribe((data) => {
      if (data.type === "Friend Removal") {
        delete this.friendsIdMapping[data.fromId];
      }
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 7000 });
    })
  } // end of receiveRealTimeNotifications

  // function to receive real time friend group related notifications
  receiveGroupNotifications() {
    this.subscription_1 = this.socketService.receiveGroupNotifications().subscribe((data) => {
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 7000 })
      if (data.refreshProjectList === true) {
        this.getProjectLists();
      }
    })
  } // end of receiveGroupConnectionsNotifications

  //function to get all  the notifications from the db
  getAllNotifications() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.mainService.getAllUserNotifications(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.notificationModalFlag = true;
        this.notificationsList.splice(0, this.notificationsList.length)
        this.notifTrackerList.splice(0, this.notifTrackerList.length)
        //this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        for (let notifs of apiResult.data) {
          if (notifs.type === "Friend Request" && !this.notifTrackerList.includes(notifs.createdOn)) {
            this.notificationsList.push(notifs)
            this.notifTrackerList.push(notifs.createdOn)
            this.notificationsMapping[notifs.notificationMessage] = true
          }
          else if (!this.notifTrackerList.includes(notifs.createdOn)) {
            this.notifTrackerList.push(notifs.createdOn)
            this.notificationsList.push(notifs)
            this.notificationsMapping[notifs.notificationMessage] = false
          }
        }
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message);
        this.deleteCookies();
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.notificationModalFlag = false;
        //this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error("Some error occured", '', { timeOut: 2000 })
    })
  } // end of getAllNotifications

  // function to add friend and send the notification to the added friend
  addFriend(toId) {
    this.destroyAllModal();
    //constructing the notification object
    let notificationObject = {
      fromId: this.userInfo.userId,
      toId: toId,
      type: 'Friend Request Acceptance',
      notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} has added you as their friend`,
      authToken: this.authToken
    }
    this.mainService.verifyNotification(notificationObject).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.mainService.addFriend(notificationObject).subscribe((apiResult) => {
          if (apiResult.status === 200) {
            this.toastr.success(apiResult.message, '', { timeOut: 2250 })
            this.socketService.sendFriendAcceptNotification(notificationObject);
          }
          else if (apiResult.status === 404) {
            apiResult.message = "Authentication Token is either invalid or expired!"
            this.toastr.error(apiResult.message);
            this.deleteCookies();
            this.router.navigate(['not-found']);
          }
          else if (apiResult.status === 500) {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
          }
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 2250 })
          }
        }, (err) => {
          this.deleteCookies();
          this.toastr.error('Some error occured', '', { timeOut: 2250 })
        })
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message);
        this.deleteCookies();
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 2250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some Error occured', '', { timeOut: 2000 });
    })
  }// end of addFriend  

  // function to get friend names to display on friends modal
  getAllFriendsOfUser() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.friendsIdMapping.splice(0, this.friendsIdMapping.length)
    this.friendsIdList.splice(0, this.friendsIdList.length)
    this.mainService.getUserFriendList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        for (let i of apiResult.data['friendsList']) {
          if (!this.friendsIdList.includes(i['userId'])) {
            this.friendsIdList.push(i['userId'])
          }
        }
        for (let j of this.friendsIdList) {
          let data = {
            userId: j,
            authToken: this.authToken
          }
          this.appService.getUserName(data).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let fullName = apiResult.data[0]['firstName'] + " " + (apiResult.data[0]['lastName']).trim()
              this.friendsIdMapping.push({ userId: j, fullName: fullName })
            }
            else if (apiResult.status === 404) {
              apiResult.message = "Authentication Token is either invalid or expired!"
              this.toastr.error(apiResult.message, '', { timeOut: 2000 });
              this.deleteCookies()
              this.router.navigate(['not-found']);
            }
            else if (apiResult.status === 500) {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
            }
            else {
              this.toastr.error('Details not found', '', { timeOut: 2000 });
            }
          },
            (err) => {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
              this.toastr.error('Some Error occured', '', { timeOut: 2000 });
            })
        }
        this.friendsModalFlag = true;
        //this.toastr.success(apiResult.message, '', { timeOut: 1250 })
      }
      else if (apiResult.status === 404) {
        this.toastr.error(apiResult.message);
        this.deleteCookies();
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.friendsModalFlag = false;
        //this.toastr.error(apiResult.message, '', { timeOut: 2250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some Error occured', '', { timeOut: 2000 });
    })
  }// end of getAllFriendsOfUser

  //function to send a notification and navigate to friend's projects
  connectWithFriend(toId, fullName) {
    let notificationObject = {
      fromId: this.userInfo.userId,
      toId: toId,
      type: 'Project Edit',
      notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} has connected to ${fullName}'s toDo`,
      fullName: fullName
    }
    let data = {
      userId: this.userInfo.userId,
      mainUserId: toId,
      authToken: this.authToken
    }
    this.mainService.checkForFriendship(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        //this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        this.socketService.sendConnectionStatusNotification(notificationObject)
        Cookie.set('collabLeaderId', toId)
        Cookie.set('collabLeaderName', fullName)
        this.router.navigate(['/collab-home', toId])
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message);
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of connectWithFriend

  updateFriendForRemoval(friendId) {
    this.friendId = friendId
  } // end of updateFriendForRemoval

  updateProjectName(projectName) {
    this.projectName = projectName;
  } // end of updateProjectName

  removeFriend() {
    let data = {
      mainId: this.userInfo.userId,
      friendId: this.friendId,
      authToken: this.authToken
    }
    this.mainService.removeFriend(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message, '', { timeOut: 2000 });
        delete this.friendsIdMapping[this.friendId];
        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.friendId,
          type: 'Friend Block',
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} has unfriended you.`
        }
        this.socketService.sendFriendRemovalNotification(notificationObject);
      } else if (apiResult.status === 404) {
        this.toastr.error(apiResult.message);
        this.deleteCookies();
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.friendsModalFlag = false;
        //this.toastr.error(apiResult.message, '', { timeOut: 2250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some Error occured', '', { timeOut: 2000 });
    })
  } // end of removeFriend

  // function to check if there are any friend actions logged
  public checkActionLogger() {
    let data = {
      fromId: this.userInfo.userId,
      collabLeaderId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.actionService.getActions(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleUndoButton = false;
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        //this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else if (apiResult.status === 403) {
        this.toggleUndoButton = true;
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some Error Occured', '', { timeOut: 2000 })
    })
  } // end of checkActionLoggger

  // function to execute when create project is selected and submitted.
  getProjectLists() {
    this.checkActionLogger()
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.mainService.getProjectList(data).subscribe((apiResult) => {
      this.spinner = false;
      if (apiResult.status === 200) {
        this.projectNamesList.splice(0, this.projectNamesList.length)
        if (apiResult.data.projects.length === 0) {
          this.toggleMainMessage = 0;
        }
        else {
          this.toggleMainMessage = 1;
          for (let projectNames of apiResult.data.projects) {
            this.projectNamesList.push(projectNames.name)
          }
        }
        if (apiResult.data.projects.length !== 0) {
          this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        }
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else if (apiResult.status === 403) {
        this.toggleMainMessage = 0;
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      // this.deleteCookies();
      // this.router.navigate(['server-error', 500]);
      this.toastr.error("Some Error Occured", '', { timeOut: 1250 });
    })
  } // end of getProjectLists

  // receiving project name in modal.
  mainModalFormSubmit() {
    this.projectValue = this.projectModalForm.controls.projectName.value;
    this.destroyAllModal();
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectValue
    }
    this.mainService.addNewProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleMainMessage = 1;
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        this.projectNamesList.push(this.projectValue)
        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.userInfo.userId,
          type: "toDo Owner action",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} added a new project with name ${this.projectValue}`,
          fullName: `${this.userInfo.firstName} ${this.userInfo.lastName}`,
          refreshProjectList: true
        };

        this.socketService.sendGroupEditsNotification(notificationObject);
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        //this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error("Some Error Occured");
    })
  } // end of mainModalFormSubmit

  deleteProject() {
    this.destroyAllModal();
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectName
    }
    this.mainService.deleteProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleMainMessage = 1;
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        this.projectNamesList = this.projectNamesList.filter(item => item !== this.projectName)
        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.userInfo.userId,
          type: "toDo Owner action",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} deleted a project with name ${this.projectName}`,
          fullName: `${this.userInfo.firstName} ${this.userInfo.lastName}`,
          refreshProjectList: true
        };

        this.socketService.sendGroupEditsNotification(notificationObject);
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        //this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error("Some Error Occured");
    })
  } // end of deleteProject

  // navigate to view task component
  goToViewTask(projectNameSelected) {
    this.router.navigate(['/view-task', projectNameSelected])
  }// end of goToViewTask

  //function to get all the users
  public getAllUsers() {
    let data = {
      authToken: this.authToken
    }
    this.appService.getSpecificUsersDetails(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        var tempList = []
        for (let i of apiResult.data) {
          if (i.userId !== this.userInfo.userId) {
            tempList.push(i)
            this.allUserList = [...new Set(tempList)]
          }
        }
        //this.toastr.success(apiResult.message, '', { timeOut: 1250 })
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 1250 })
    })
  }// end of getAllUsers

  // function to perform the undo opertation based on the type of action retrieved
  public performUndoOperation() {
    let data1 = {
      fromId: this.userInfo.userId,
      collabLeaderId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.actionService.getActions(data1).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleUndoButton = false;
        this.undoObject = apiResult.data
        if (this.undoObject['type'] === "Project Added") {
          let projectData = {
            authToken: this.authToken,
            userId: this.userInfo.userId,
            projectName: this.undoObject['currentProjectName']
          }
          this.mainService.deleteProjectList(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let data2 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data2).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let notificationObject = {
                    fromId: this.userInfo.userId,
                    toId: this.userInfo.userId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted the last change done by a friend`,
                    fullName: this.userInfo.firstName + " " + this.userInfo.lastName,
                    refreshProjectList: true
                  }
                  this.socketService.sendGroupEditsNotification(notificationObject);
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false;
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);

              })
              this.getProjectLists();
              this.checkActionLogger();
            }
            else if (apiResult.status === 404) {
              apiResult.message = "Authentication Token is either invalid or expired!"
              this.toastr.error(apiResult.message, '', { timeOut: 2000 });
              this.deleteCookies()
              this.router.navigate(['not-found']);
            }
            else if (apiResult.status === 500) {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.userInfo.firstName} ${this.userInfo.lastName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
          })
        }
        else if (this.undoObject['type'] === "Task Added") {
          let projectData = {
            authToken: this.authToken,
            userId: this.userInfo.userId,
            projectName: this.undoObject['currentProjectName'],
            itemName: this.undoObject['currentItemName']
          }
          this.mainService.deleteTask(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let data2 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data2).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let notificationObject = {
                    fromId: this.userInfo.userId,
                    toId: this.userInfo.userId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted the task addition action done by a friend`,
                    fullName: this.userInfo.firstName + " " + this.userInfo.lastName,
                    refreshItemList: true
                  }
                  this.socketService.sendGroupEditsNotification(notificationObject);
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies();
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getProjectLists();
              this.checkActionLogger();
            }
            else if (apiResult.status === 404) {
              apiResult.message = "Authentication Token is either invalid or expired!"
              this.toastr.error(apiResult.message, '', { timeOut: 2000 });
              this.deleteCookies()
              this.router.navigate(['not-found']);
            }
            else if (apiResult.status === 500) {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }

              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.userInfo.firstName} ${this.userInfo.lastName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Task Edited") {
          let projectData = {
            authToken: this.authToken,
            userId: this.userInfo.userId,
            projectName: this.undoObject['currentProjectName'],
            itemName: this.undoObject['currentItemName'],
            newItemName: this.undoObject['previousItemName'],
            status: this.undoObject['currentStatus'],
            subItemsList: this.undoObject['currentSubItems']
          }
          this.mainService.editItemList(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let data2 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data2).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let notificationObject = {
                    fromId: this.userInfo.userId,
                    toId: this.userInfo.userId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted the task edited action done by a friend`,
                    fullName: this.userInfo.firstName + " " + this.userInfo.lastName,
                    refreshItemList: true
                  }
                  this.socketService.sendGroupEditsNotification(notificationObject);
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getProjectLists();
              this.checkActionLogger();
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.userInfo.firstName} ${this.userInfo.lastName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Task Completed") {
          let projectData = {
            authToken: this.authToken,
            userId: this.userInfo.userId,
            projectName: this.undoObject['currentProjectName'],
            itemName: this.undoObject['currentItemName'],
            status: this.undoObject['currentStatus'],
            subItemsList: this.undoObject['currentSubItems']
          }
          this.mainService.markTaskAsDone(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let data2 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data2).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let notificationObject = {
                    fromId: this.userInfo.userId,
                    toId: this.userInfo.userId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted marking task as done action by a friend`,
                    fullName: this.userInfo.firstName + " " + this.userInfo.lastName,
                    refreshItemList: true
                  }
                  this.socketService.sendGroupEditsNotification(notificationObject);
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getProjectLists();
              this.checkActionLogger();
            }
            else if (apiResult.status === 404) {
              apiResult.message = "Authentication Token is either invalid or expired!"
              this.toastr.error(apiResult.message, '', { timeOut: 2000 });
              this.deleteCookies()
              this.router.navigate(['not-found']);
            }
            else if (apiResult.status === 500) {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.userInfo.firstName} ${this.userInfo.lastName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Sub-Task Added") {
          let projectData = {
            authToken: this.authToken,
            userId: this.userInfo.userId,
            projectName: this.undoObject['currentProjectName'],
            itemName: this.undoObject['currentItemName'],
            status: this.undoObject['currentStatus'],
            subItemsList: this.undoObject['previousSubItems']
          }
          this.mainService.updateItemInList(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let data2 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data2).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let notificationObject = {
                    fromId: this.userInfo.userId,
                    toId: this.userInfo.userId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted sub-task addition action done by a friend`,
                    fullName: this.userInfo.firstName + " " + this.userInfo.lastName,
                    refreshItemList: true
                  }
                  this.socketService.sendGroupEditsNotification(notificationObject);
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getProjectLists();
              this.checkActionLogger();
            }
            else if (apiResult.status === 404) {
              apiResult.message = "Authentication Token is either invalid or expired!"
              this.toastr.error(apiResult.message, '', { timeOut: 2000 });
              this.deleteCookies()
              this.router.navigate(['not-found']);
            }
            else if (apiResult.status === 500) {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.userInfo.firstName} ${this.userInfo.lastName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Task Deleted") {
          let projectData = {
            authToken: this.authToken,
            userId: this.userInfo.userId,
            projectName: this.undoObject['currentProjectName'],
            itemName: this.undoObject['previousItemName'],
          }
          this.mainService.addNewItemToProject(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let itemData = {
                authToken: this.authToken,
                userId: this.userInfo.userId,
                projectName: this.undoObject['currentProjectName'],
                itemName: this.undoObject['previousItemName'],
                status: this.undoObject['previousStatus'],
                subItemsList: this.undoObject['previousSubItems']
              }
              this.mainService.updateItemInList(itemData).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let data2 = {
                    authToken: this.authToken,
                    fromId: this.userInfo.userId,
                    collabLeaderId: this.userInfo.userId
                  }
                  this.actionService.deleteAction(data2).subscribe((apiResult) => {
                    if (apiResult.status === 200) {
                      let notificationObject = {
                        fromId: this.userInfo.userId,
                        toId: this.userInfo.userId,
                        type: "Friend collab",
                        notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted task deletion action done by a friend`,
                        fullName: this.userInfo.firstName + " " + this.userInfo.lastName,
                        refreshItemList: true
                      }
                      this.socketService.sendGroupEditsNotification(notificationObject);
                    }
                    else if (apiResult.status === 404) {
                      apiResult.message = "Authentication Token is either invalid or expired!"
                      this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                      this.deleteCookies()
                      this.router.navigate(['not-found']);
                    }
                    else if (apiResult.status === 500) {
                      this.deleteCookies();
                      this.router.navigate(['server-error', 500]);
                    }
                    else {
                      if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                        this.toggleUndoButton = true;
                      }
                      else {
                        this.toggleUndoButton = false
                      }
                      this.toastr.error('Undo failed', '', { timeOut: 4000 })
                    }
                  }, (err) => {
                    this.deleteCookies();
                    this.router.navigate(['server-error', 500]);
                    this.toastr.error('Some error occured', '', { timeOut: 2000 });
                  })
                  this.getProjectLists();
                  this.checkActionLogger();
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
            }
            else if (apiResult.status === 404) {
              apiResult.message = "Authentication Token is either invalid or expired!"
              this.toastr.error(apiResult.message, '', { timeOut: 2000 });
              this.deleteCookies()
              this.router.navigate(['not-found']);
            }
            else if (apiResult.status === 500) {
              this.deleteCookies();
              this.router.navigate(['server-error', 500]);
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.userInfo.userId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else if (apiResult.status === 404) {
                  apiResult.message = "Authentication Token is either invalid or expired!"
                  this.toastr.error(apiResult.message, '', { timeOut: 2000 });
                  this.deleteCookies()
                  this.router.navigate(['not-found']);
                }
                else if (apiResult.status === 500) {
                  this.deleteCookies();
                  this.router.navigate(['server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.userInfo.firstName} ${this.userInfo.lastName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['server-error', 500]);
      }
      else if (apiResult.status === 403) {
        this.toastr.error(`No actions of ${this.userInfo.firstName} ${this.userInfo.lastName}'s friend(s) is left to revert!`, '', { timeOut: 4000 })
        this.toggleUndoButton = true;
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of performUndoOperation

  // user will be logged out
  public logoutUser() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    } // end of logoutUser
    this.appService.logoutFunction(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.deleteCookies();
        this.socketService.exitSocket();
        this.toastr.success(apiResult.message, '', { timeOut: 1250 });
        this.router.navigate(['/home']);
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['/not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['/server-error', 500]);
      }
      else {
        this.deleteCookies();
        this.socketService.exitSocket();
        //this.toastr.error(apiResult.message, '', { timeOut: 1250 })
        this.router.navigate(['/home']);
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  }  // end of logoutUser

  // logic to change sidebar position based on screen width
  // requires screen refresh after changing screen sizes < 750px
  toggleNav() {
    if (this.toggle_1 === 1 && this.flag === 0) {
      this.closeNav_1();
      this.toggle_1 = 0;
    }
    else if (this.toggle_2 === 1 && this.flag === 1) {
      this.openNav_2();
      this.toggle_2 = 0;
    }
    else if (this.toggle_1 === 0 && this.flag === 0) {
      this.openNav_1();
      this.toggle_1 = 1;
    }
    else if (this.toggle_2 === 0 && this.flag === 1) {
      this.closeNav_2();
      this.toggle_2 = 1;
    }
  } // end of toggleNav
  openNav_1() {
    openNavgationBarv1();
  }
  closeNav_1() {
    closeNavigationBarv1();
  }
  openNav_2() {
    openNavgationBarv2(this.scrWidth, this.scrHeight);
  }
  closeNav_2() {
    closeNavigationBarv2();
  }
  destroyAllModal() {
    destroyModal();
  }
}
