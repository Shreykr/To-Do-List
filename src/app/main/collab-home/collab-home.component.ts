import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CheckUser } from './../../CheckUser';
import { AppService } from './../../app.service';
import { MainService } from './../../main.service';
import { SocketService } from './../../socket.service';
import { ActionService } from 'src/app/action.service';
import * as $ from 'jquery';
import { Subscription } from 'rxjs';
import { LoaderService } from 'src/app/loader.service';


declare const openNavgationBarv1: any;
declare const closeNavigationBarv1: any;
declare const openNavgationBarv2: any;
declare const closeNavigationBarv2: any;
declare const destroyModal: any;

@Component({
  selector: 'app-collab-home',
  templateUrl: './collab-home.component.html',
  styleUrls: ['./collab-home.component.css']
})
export class CollabHomeComponent implements OnInit, CheckUser {

  public subscription_1: Subscription;
  public subscription_2: Subscription;

  scrHeight = window.innerHeight;
  scrWidth = window.innerWidth;

  //main values
  public projectNamesList: any = [];
  public key: any;
  public collabLeaderId;
  public collabLeaderName;
  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public flag = 0;
  public projectValue: any;
  public authToken: any;
  public userInfo: any;
  public toggleMainMessage = 0;
  public allUserList: any = [];
  public searchClick = false;
  public disconnectedSocket: Boolean;
  public userMapping: any = {};
  public toggleUndoButton: Boolean = false;
  public undoObject = {};

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.scrHeight = window.innerHeight;
    this.scrWidth = window.innerWidth;
  }

  //Form group for project name
  projectModalForm = new FormGroup({
    'projectName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9 ]{0,25}$')])
  })

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

  constructor(
    public _route: ActivatedRoute,
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
    this.collabLeaderName = Cookie.get('collabLeaderName');
    this.collabLeaderId = this._route.snapshot.paramMap.get('toId');

    this.destroyAllModal();

    // checking the user
    if (this.checkStatus()) {
      //testing socket connection
      this.verifyUserConfirmation();

      // receiving real time notifications to subscribed socket events
      this.receiveRealTimeNotifications();

      // receiving real time notifications of friend viewing your tasks. All friends will be notified of this activity.
      this.receiveGroupNotifications();

      // getting all the project lists
      this.getMainProjectLists();

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

  public deleteCookies() {
    Cookie.delete('authtoken');
    Cookie.delete('userId');
    Cookie.delete('collabLeaderId');
    Cookie.delete('projectName');
    Cookie.delete('collabLeaderName');
  }

  // fucntion to check the authToken/session of the user
  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      if (Cookie.get('collabLeaderId') === this.collabLeaderId)
        this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  } //end of checkStatus

  //function to verify user (socket connection testing)
  public verifyUserConfirmation: any = () => {
    this.socketService.verifyUser()
      .subscribe((data) => {
        this.disconnectedSocket = false;
        this.socketService.setUser(this.authToken);
      });
  }// end of verifyUserConfirmation

  // function to receive real time notifications
  receiveRealTimeNotifications() {
    this.subscription_1 = this.socketService.receiveRealTimeNotifications(this.userInfo.userId).subscribe((data) => {
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 5000 })
    })
  } // end of receiveRealTimeNotifications

  // function to receive real time friend group related notifications
  receiveGroupNotifications() {
    this.subscription_2 = this.socketService.receiveGroupNotifications().subscribe((data) => {
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 7000 })
      if (data.refreshProjectList === true) {
        this.getMainProjectLists();
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['/server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of receiveGroupNotifications

  // function to check if there are any friend actions logged
  public checkActionLogger() {
    let data = {
      fromId: this.userInfo.userId,
      collabLeaderId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.actionService.getActions(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleUndoButton = false;
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['/server-error', 500]);
      }
      else if (apiResult.status === 403) {
        this.toggleUndoButton = true;
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['/server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of checkActionLoggger

  // function to execute when the friend connects with a user
  getMainProjectLists() {
    this.checkActionLogger()
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.mainService.getProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        if (apiResult.data.projects.length === 0) {
          this.toggleMainMessage = 0;
        }
        else {
          this.toggleMainMessage = 1;
          this.projectNamesList.splice(0, this.projectNamesList.length)
          for (let projectNames of apiResult.data.projects) {
            this.projectNamesList.push(projectNames.name)
          }
        }
        if (apiResult.data.projects.length !== 0) {
          //this.toastr.success(apiResult.message, '', { timeOut: 7550 })
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
        this.router.navigate(['/server-error', 500]);
      }
      else {
        //this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['/server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  }// end of getProjectLists  

  // receiving project name in modal
  mainModalFormSubmit() {
    this.projectValue = this.projectModalForm.controls.projectName.value;
    this.destroyAllModal();
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken,
      projectName: this.projectValue
    }
    this.mainService.addNewProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleMainMessage = 1;
        this.toastr.success(apiResult.message, '', { timeOut: 1550 })
        this.getMainProjectLists();

        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} added a new project with name ${this.projectValue}`,
          fullName: this.collabLeaderName,
          refreshProjectList: true
        };
        this.socketService.sendGroupEditsNotification(notificationObject);
        let action = {
          type: "Project Added",
          fromId: this.userInfo.userId,
          collabLeaderId: this.collabLeaderId,
          previousProjectName: '',
          currentProjectName: this.projectValue,
          previousItemName: '',
          currentItemName: '',
          previousStatus: false,
          currentStatus: false,
          previousSubItems: [],
          currentSubItems: [],
          authToken: this.authToken
        }
        this.actionService.addNewAction(action).subscribe((apiResult) => {
          if (apiResult.status === 200) {
            //this.toastr.success(apiResult.message, '', { timeOut: 1250 })
          }
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.toastr.error("Some Error occured")
        })
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
        this.router.navigate(['/server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['/server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  }// end of mainModalFormSubmit

  // navigate to view task component
  goToViewTaskCollab(projectNameSelected) {
    let data = {
      userId: this.userInfo.userId,
      mainUserId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.mainService.checkForFriendship(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        //this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        Cookie.set('projectName', projectNameSelected)
        this.router.navigate(['/collab-view-task', this.collabLeaderId, projectNameSelected])
      }
      else if (apiResult.status === 404) {
        apiResult.message = "Authentication Token is either invalid or expired!"
        this.toastr.error(apiResult.message, '', { timeOut: 2000 });
        this.deleteCookies()
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.deleteCookies();
        this.router.navigate(['/server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1650 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['/server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  }// end of goToViewTask

  // function to navigate to main-home and delete cookies
  navigateToMainHomeComponent() {
    let notificationObject = {
      fromId: this.userInfo.userId,
      toId: this.collabLeaderId,
      type: "Friend collab",
      notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} has disconnected from collab room!`,
      fullName: this.collabLeaderName,
      refreshProjectList: false
    }
    this.socketService.disconnectFriend(notificationObject);
    Cookie.delete('projectName');
    Cookie.delete('collabLeaderName');
    Cookie.delete('collabLeaderId');
    this.router.navigate(['/main-home'])
  } // end of navigateToMainHomeComponent

  // function to perform the undo opertation based on the type of action retrieved
  public performUndoOperation() {
    let data1 = {
      fromId: this.userInfo.userId,
      collabLeaderId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.actionService.getActions(data1).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleUndoButton = false;
        this.undoObject = apiResult.data
        if (this.undoObject['type'] === "Project Added") {
          let projectData = {
            authToken: this.authToken,
            userId: this.collabLeaderId,
            projectName: this.undoObject['currentProjectName']
          }
          this.mainService.deleteProjectList(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let data2 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data2).subscribe((apiResult) => {
                if (apiResult.status === 200) {
                  let notificationObject = {
                    fromId: this.userInfo.userId,
                    toId: this.collabLeaderId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted the last change done by a friend`,
                    fullName: this.collabLeaderName,
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
                  this.router.navigate(['/server-error', 500]);
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
                this.router.navigate(['/server-error', 500]);

              })
              this.getMainProjectLists();
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
              this.router.navigate(['/server-error', 500]);
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
                  this.router.navigate(['/server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName}, are permanent.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['/server-error', 500]);
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
          })
        }
        else if (this.undoObject['type'] === "Task Added") {
          let projectData = {
            authToken: this.authToken,
            userId: this.collabLeaderId,
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
                    toId: this.collabLeaderId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted the task addition action done by a friend`,
                    fullName: this.collabLeaderName,
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
                  this.router.navigate(['/server-error', 500]);
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
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getMainProjectLists();
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
              this.router.navigate(['/server-error', 500]);
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
                  this.router.navigate(['/server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }

              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} are permanent.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['/server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Task Edited") {
          let projectData = {
            authToken: this.authToken,
            userId: this.collabLeaderId,
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
                    toId: this.collabLeaderId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted the task edited action done by a friend`,
                    fullName: this.collabLeaderName,
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
                  this.router.navigate(['/server-error', 500]);
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
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getMainProjectLists();
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
                  this.router.navigate(['/server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} are permanent.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['/server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Task Completed") {
          let projectData = {
            authToken: this.authToken,
            userId: this.collabLeaderId,
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
                    toId: this.collabLeaderId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted marking task as done action by a friend`,
                    fullName: this.collabLeaderName,
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
                  this.router.navigate(['/server-error', 500]);
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
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getMainProjectLists();
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
              this.router.navigate(['/server-error', 500]);
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
                  this.router.navigate(['/server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} are permanent.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['/server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Sub-Task Added") {
          let projectData = {
            authToken: this.authToken,
            userId: this.collabLeaderId,
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
                    toId: this.collabLeaderId,
                    type: "Friend collab",
                    notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted sub-task addition action done by a friend`,
                    fullName: this.collabLeaderName,
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
                  this.router.navigate(['/server-error', 500]);
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
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.getMainProjectLists();
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
              this.router.navigate(['/server-error', 500]);
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
                  this.router.navigate(['/server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} are permanent.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['/server-error', 500]);
            this.toastr.error('Some error occured', '', { timeOut: 2000 });
          })
        }
        else if (this.undoObject['type'] === "Task Deleted") {
          let projectData = {
            authToken: this.authToken,
            userId: this.collabLeaderId,
            projectName: this.undoObject['currentProjectName'],
            itemName: this.undoObject['previousItemName'],
          }
          this.mainService.addNewItemToProject(projectData).subscribe((apiResult) => {
            if (apiResult.status === 200) {
              let itemData = {
                authToken: this.authToken,
                userId: this.collabLeaderId,
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
                        toId: this.collabLeaderId,
                        type: "Friend collab",
                        notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} reverted task deletion action done by a friend`,
                        fullName: this.collabLeaderName,
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
                      this.router.navigate(['/server-error', 500]);
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
                    this.router.navigate(['/server-error', 500]);
                    this.toastr.error('Some error occured', '', { timeOut: 2000 });
                  })
                  this.getMainProjectLists();
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
                  this.router.navigate(['/server-error', 500]);
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
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
              this.router.navigate(['/server-error', 500]);
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
                  this.router.navigate(['/server-error', 500]);
                }
                else {
                  this.toggleUndoButton = false
                }
              }, (err) => {
                this.deleteCookies();
                this.router.navigate(['/server-error', 500]);
                this.toastr.error('Some error occured', '', { timeOut: 2000 });
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} are permanent.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.deleteCookies();
            this.router.navigate(['/server-error', 500]);
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
        this.router.navigate(['/server-error', 500]);
      }
      else if (apiResult.status === 403) {
        this.toastr.error(`No actions of ${this.userInfo.firstName} ${this.userInfo.lastName}'s friend(s) is left to revert!`, '', { timeOut: 4000 })
        this.toggleUndoButton = true;
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['/server-error', 500]);
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
      else {
        this.deleteCookies();
        this.socketService.exitSocket();
        //this.toastr.error(apiResult.message, '', { timeOut: 1250 })
        this.router.navigate(['/home'])
      }
    })
  }// end of logoutUser

  // logic to change sidebar position based on screen width
  // requires screen refresh after changing to screen size < 750px width
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
  }// end of toggleNav

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
