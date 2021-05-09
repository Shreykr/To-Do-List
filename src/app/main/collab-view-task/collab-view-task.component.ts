import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CheckUser } from './../../CheckUser';
import { AppService } from './../../app.service';
import { MainService } from './../../main.service';
import { SocketService } from './../../socket.service';
import { ToastrService } from 'ngx-toastr';
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
  selector: 'app-collab-view-task',
  templateUrl: './collab-view-task.component.html',
  styleUrls: ['./collab-view-task.component.css']
})
export class CollabViewTaskComponent implements OnInit, CheckUser {

  public subscription_1: Subscription;
  public subscription_2: Subscription;

  scrHeight = window.innerHeight;
  scrWidth = window.innerWidth;

  //main values
  public key: any;
  public projectName;
  public collabLeaderId;
  public collabLeaderName;
  public itemName: any;
  public subItemName: any;
  public itemNamesList: any = [];
  public subItemsList: any = [];
  public status: Boolean = false;
  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public toggleMainMessage = 0;
  public flag = 0;
  public authToken: any;
  public userInfo: any;
  public statusMapping: any = {};
  public subTaskMapping: any = {};
  public disconnectedSocket: Boolean;
  public notificationsList: any = [];
  public notificationsMapping: any = {};
  public notifTrackerList: any = [];
  public notificationModalFlag: Boolean = false;
  public toggleUndoButton: Boolean = false;
  public undoObject = {};
  public errorFlag = 0;
  public spinner = true;

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
  itemModalForm = new FormGroup({
    'itemName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9 ]{0,25}$')])
  })

  subItemModalForm = new FormGroup({
    'subItemName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9 ]{0,20}$')])
  })

  editItemModalForm = new FormGroup({
    'editItemName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9 ]{0,25}$')])
  })

  constructor(
    public _route: ActivatedRoute,
    public router: Router,
    public appService: AppService,
    public mainService: MainService,
    public actionService: ActionService,
    public socketService: SocketService,
    public loaderService: LoaderService,
    public toastr: ToastrService
  ) { this.getScreenSize(); }

  ngOnInit(): void {

    // logic for implementing different sidebars depend on screen size.
    if (this.scrWidth <= 890) {
      this.toggle_2 = 1;
      this.flag = 1;
    }
    else {
      this.flag = 0;
      this.toggle_1 = 1;
    }
    this.authToken = Cookie.get('authtoken');
    this.userInfo = this.appService.getUserInfoFromLocalstorage();
    this.projectName = this._route.snapshot.paramMap.get('projectName');
    this.collabLeaderName = Cookie.get('collabLeaderName');
    this.collabLeaderId = this._route.snapshot.paramMap.get('toId');

    // checking the user
    if (this.checkStatus()) {
      //testing socket connection
      this.verifyUserConfirmation();

      // receiving real time notifications to subscribed socket events
      this.receiveRealTimeNotifications();

      this.receiveGroupNotifications();

      // getting all the task lists
      this.getMainItemList();

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
  } //end of check status

  public deleteCookies() {
    Cookie.delete('authtoken');
    Cookie.delete('userId');
    Cookie.delete('collabLeaderId');
    Cookie.delete('projectName');
    Cookie.delete('collabLeaderName');
  }

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
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 7000 })
    })
  }// end of receiveRealTimeNotifications

  // function to receive real time friend group related notifications
  receiveGroupNotifications() {
    this.subscription_2 = this.socketService.receiveGroupNotifications().subscribe((data) => {
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 7000 })
      if (data.refreshItemList === true) {
        this.getMainItemList()
      }
    })
  } // end of receiveGroupNotifications

  // function to navigate to collab home page and delete projectName cookie
  navigateToCollabHomeComponent() {
    Cookie.delete('projectName');
    this.router.navigate(['/collab-home', this.collabLeaderId])
  } // end of navigateToCollabHomeComponent

  // function to navigate to main-home and delete cookies
  navigateToMainHomeComponent() {
    let notificationObject = {
      fromId: this.userInfo.userId,
      toId: this.collabLeaderId,
      type: "Friend collab",
      notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} has disconnected from collab room!`,
      fullName: this.collabLeaderName,
      refreshItemList: false
    }
    this.socketService.disconnectFriend(notificationObject);
    Cookie.delete('projectName');
    Cookie.delete('collabLeaderId');
    Cookie.delete('collabLeaderName');
    this.router.navigate(['/main-home'])
  } // end of navigateToMainHomeComponent

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
        this.router.navigate(['server-error', 500]);
      }
      else if (apiResult.status === 403) {
        this.toggleUndoButton = true;
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of checkActionLoggger

  // function to execute when component first loads
  getMainItemList() {
    this.checkActionLogger()
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.mainService.getItemList(data).subscribe((apiResult) => {
      this.spinner = false;
      if (apiResult.status === 200) {
        this.itemNamesList.splice(0, this.itemNamesList.length)
        this.subItemsList.splice(0, this.subItemsList.length)
        for (let varKey in this.statusMapping) {
          if (this.statusMapping.hasOwnProperty(varKey)) {
            delete this.statusMapping[varKey];
          }
        }
        for (let varKey in this.subTaskMapping) {
          if (this.subTaskMapping.hasOwnProperty(varKey)) {
            delete this.subTaskMapping[varKey];
          }
        }
        for (let i in apiResult.data.projects) {
          for (let j in apiResult.data.projects[i].items) {
            if (apiResult.data.projects[i].name === this.projectName) {
              if (apiResult.data.projects[i].items[j].length === 0) {
                this.toggleMainMessage = 0;
                break;
              }
              else {
                this.toggleMainMessage = 1;
                this.itemNamesList.push(apiResult.data.projects[i].items[j].itemName)
                this.statusMapping[apiResult.data.projects[i].items[j].itemName] = apiResult.data.projects[i].items[j].completed
                if (apiResult.data.projects[i].items[j].sub_items.length !== 0) {
                  for (let subItems of apiResult.data.projects[i].items[j].sub_items) {
                    this.subItemsList.push(subItems);
                  }
                }
              }
            }
            else {
              continue;
            }
            if (this.subItemsList.length !== 0) {
              this.subTaskMapping[apiResult.data.projects[i].items[j].itemName] = apiResult.data.projects[i].items[j].sub_items
            }
            this.subItemsList.splice(0, this.subItemsList.length)
          }
        }
        //this.toastr.success("Tasks Updated", '', { timeOut: 1250 })
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
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of getMainItemList

  // receiving task name in modal.
  itemModalFormSubmit() {
    this.itemName = this.itemModalForm.controls.itemName.value;
    this.destroysItemModal();
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName
    }
    this.mainService.addNewItemToProject(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleMainMessage = 1;
        this.itemNamesList.push(this.itemName)
        for (let i in apiResult.data.projects) {
          for (let j in apiResult.data.projects[i].items) {
            if (apiResult.data.projects[i].items[j].itemName === this.itemName) {
              this.statusMapping[this.itemName] = apiResult.data.projects[i].items[j].completed
            }
          }
        }
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} added a new task with name ${this.itemName} in ${this.projectName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        };
        this.socketService.sendGroupEditsNotification(notificationObject);
        let action = {
          type: "Task Added",
          fromId: this.userInfo.userId,
          collabLeaderId: this.collabLeaderId,
          previousProjectName: this.projectName,
          currentProjectName: this.projectName,
          previousItemName: '',
          currentItemName: this.itemName,
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
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.deleteCookies();
          this.router.navigate(['server-error', 500]);
          this.toastr.error('Some error occured', '', { timeOut: 2000 });
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
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1550 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of itemModalFormSubmit

  // to set the item value before making updates on the item
  getItemName(value) {
    this.itemName = value
  } // end of getItemName

  // function to execute when sub toDo task is added
  subItemModalFormSubmit() {
    let tempSubList = []
    this.subItemName = this.subItemModalForm.controls.subItemName.value;
    if (this.subTaskMapping[this.itemName] !== undefined) {
      for (let i of this.subTaskMapping[this.itemName]) {
        this.subItemsList.push(i)
      }
    }
    tempSubList = [...this.subItemsList]
    this.subItemsList.push(this.subItemName)
    this.destroysItemModal();
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName,
      status: this.statusMapping[this.itemName],
      subItemsList: this.subItemsList
    }
    this.mainService.updateItemInList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        let action = {
          type: "Sub-Task Added",
          fromId: this.userInfo.userId,
          collabLeaderId: this.collabLeaderId,
          previousProjectName: this.projectName,
          currentProjectName: this.projectName,
          previousItemName: this.itemName,
          currentItemName: this.itemName,
          previousStatus: this.statusMapping[this.itemName],
          currentStatus: this.statusMapping[this.itemName],
          previousSubItems: tempSubList,
          currentSubItems: this.subItemsList,
          authToken: this.authToken
        }
        this.actionService.addNewAction(action).subscribe((apiResult) => {
          if (apiResult.status === 200) {
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
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.deleteCookies();
          this.router.navigate(['server-error', 500]);
          this.toastr.error('Some error occured', '', { timeOut: 2000 });
        })
        this.subItemsList.splice(0, this.subItemsList.length);
        delete this.subTaskMapping[this.itemName];
        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} added a new sub-task: ${this.subItemName} in ${this.projectName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        }
        this.socketService.sendGroupEditsNotification(notificationObject);
        this.updateSubItemsInDom();
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
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of subItemModalFormSubmit

  // function to execute when sub items are to be updated on DOM
  updateSubItemsInDom() {
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.mainService.getItemList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        for (let i in apiResult.data.projects) {
          for (let j in apiResult.data.projects[i].items) {
            if (apiResult.data.projects[i].name === this.projectName && apiResult.data.projects[i].items[j].itemName === this.itemName) {
              if (apiResult.data.projects[i].items[j].length === 0) {
                break;
              }
              else {
                if (apiResult.data.projects[i].items[j].sub_items.length !== 0) {
                  this.subTaskMapping[this.itemName] = apiResult.data.projects[i].items[j].sub_items
                }
              }
            }
            else {
              continue;
            }
            this.subItemsList.splice(0, this.subItemsList.length)
          }
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
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of updateSubItemsInDom

  // function to execute when item is marked as Done
  markedAsDone(value) {
    this.itemName = value;
    if (this.subTaskMapping[this.itemName] !== undefined) {
      for (let i of this.subTaskMapping[this.itemName]) {
        this.subItemsList.push(i)
      }
    }
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName,
      status: this.statusMapping[this.itemName],
      subItemsList: this.subItemsList
    }
    this.mainService.markTaskAsDone(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.statusMapping[this.itemName] = true;
        this.toastr.success(apiResult.message, '', { timeOut: 1450 })

        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} marked task: ${this.itemName} as Completed in ${this.projectName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        }
        this.socketService.sendGroupEditsNotification(notificationObject);
        let action = {
          type: "Task Completed",
          fromId: this.userInfo.userId,
          collabLeaderId: this.collabLeaderId,
          previousProjectName: this.projectName,
          currentProjectName: this.projectName,
          previousItemName: this.itemName,
          currentItemName: this.itemName,
          previousStatus: false,
          currentStatus: true,
          previousSubItems: this.subItemsList,
          currentSubItems: this.subItemsList,
          authToken: this.authToken
        }
        this.actionService.addNewAction(action).subscribe((apiResult) => {
          if (apiResult.status === 200) {
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
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.deleteCookies();
          this.router.navigate(['server-error', 500]);
          this.toastr.error('Some error occured', '', { timeOut: 2000 });
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
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1450 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of markedAsDone

  // function to execute to edit the item name
  editItemModalFormSubmit() {
    if (this.subTaskMapping[this.itemName] !== undefined) {
      for (let i of this.subTaskMapping[this.itemName]) {
        this.subItemsList.push(i)
      }
    }
    this.destroysItemModal();
    let newItemName = this.editItemModalForm.controls.editItemName.value
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName,
      newItemName: newItemName,
      status: this.statusMapping[this.itemName],
      subItemsList: this.subItemsList
    }
    this.mainService.editItemList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        let action = {
          type: "Task Edited",
          fromId: this.userInfo.userId,
          collabLeaderId: this.collabLeaderId,
          previousProjectName: this.projectName,
          currentProjectName: this.projectName,
          previousItemName: this.itemName,
          currentItemName: newItemName,
          previousStatus: this.statusMapping[this.itemName],
          currentStatus: this.statusMapping[this.itemName],
          previousSubItems: this.subItemsList,
          currentSubItems: this.subItemsList,
          authToken: this.authToken
        }
        this.actionService.addNewAction(action).subscribe((apiResult) => {
          if (apiResult.status === 200) {
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
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.deleteCookies();
          this.router.navigate(['server-error', 500]);
          this.toastr.error('Some error occured', '', { timeOut: 2000 });
        })
        for (let i in apiResult.data.projects) {
          for (let j in apiResult.data.projects[i].items) {
            if (apiResult.data.projects[i].name === this.projectName && apiResult.data.projects[i].items[j].itemName === newItemName) {
              if (apiResult.data.projects[i].items[j].length === 0) {
                break;
              }
              else {
                delete this.subTaskMapping[this.itemName];
                if (apiResult.data.projects[i].items[j].sub_items.length !== 0) {
                  this.subTaskMapping[newItemName] = apiResult.data.projects[i].items[j].sub_items
                }
                delete this.statusMapping[this.itemName];
                this.statusMapping[apiResult.data.projects[i].items[j].itemName] = apiResult.data.projects[i].items[j].completed
                for (let i in this.itemNamesList) {
                  if (this.itemNamesList[i] === this.itemName) {
                    this.itemNamesList[i] = newItemName;
                  }
                }
              }
            }
            else {
              continue;
            }
            this.subItemsList.splice(0, this.subItemsList.length)
          }
        }
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} renamed a task as ${newItemName} in ${this.projectName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        }
        this.socketService.sendGroupEditsNotification(notificationObject);
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
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of editItemModalFormSubmit

  // function to delete 
  deleteTask(value) {
    this.itemName = value;
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName
    }
    let status = this.statusMapping[this.itemName]
    let tempSubList = []
    if (this.subTaskMapping[this.itemName] !== undefined) {
      tempSubList = [...this.subTaskMapping[this.itemName]]
    }
    this.mainService.deleteTask(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        delete this.statusMapping[this.itemName];
        this.subItemsList.splice(0, this.subItemsList.length)
        delete this.subTaskMapping[this.itemName];
        for (let i in this.itemNamesList) {
          if (this.itemNamesList[i] === this.itemName) {
            this.itemNamesList.splice(i, 1);
            break;
          }
        }
        if (this.itemNamesList.length === 0) {
          this.toggleMainMessage = 0;
        }
        else {
          this.toggleMainMessage = 1;
        }
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })

        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} deleted task: ${this.itemName} in ${this.projectName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        };
        this.socketService.sendGroupEditsNotification(notificationObject);
        let action = {
          type: "Task Deleted",
          fromId: this.userInfo.userId,
          collabLeaderId: this.collabLeaderId,
          previousProjectName: this.projectName,
          currentProjectName: this.projectName,
          previousItemName: this.itemName,
          currentItemName: '',
          previousStatus: status,
          currentStatus: false,
          previousSubItems: tempSubList,
          currentSubItems: '',
          authToken: this.authToken
        }
        this.actionService.addNewAction(action).subscribe((apiResult) => {
          if (apiResult.status === 200) {
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
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.deleteCookies();
          this.router.navigate(['server-error', 500]);
          this.toastr.error('Some error occured', '', { timeOut: 2000 });
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
        this.router.navigate(['server-error', 500]);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.deleteCookies();
      this.router.navigate(['server-error', 500]);
      this.toastr.error('Some error occured', '', { timeOut: 2000 });
    })
  } // end of deleteTask

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
                    refreshItemList: true
                  }
                  this.socketService.sendGroupEditsNotification(notificationObject);
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
              })
              this.getMainItemList();
              this.checkActionLogger();
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else {
                  this.toggleUndoButton = false
                }

              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
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
                collabLeaderId: this.collabLeaderId
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
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              })
              this.getMainItemList();
              this.checkActionLogger();
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else {
                  this.toggleUndoButton = false
                }

              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
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
                collabLeaderId: this.collabLeaderId
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
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              })
              this.getMainItemList();
              this.checkActionLogger();
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else {
                  this.toggleUndoButton = false
                }
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
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
                collabLeaderId: this.collabLeaderId
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
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              })
              this.getMainItemList();
              this.checkActionLogger();
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else {
                  this.toggleUndoButton = false
                }
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
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
                collabLeaderId: this.collabLeaderId
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
                else {
                  if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                    this.toggleUndoButton = true;
                  }
                  else {
                    this.toggleUndoButton = false
                  }
                  this.toastr.error('Undo failed', '', { timeOut: 4000 })
                }
              })
              this.getMainItemList();
              this.checkActionLogger();
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else {
                  this.toggleUndoButton = false
                }
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
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
                    collabLeaderId: this.collabLeaderId
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
                    else {
                      if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                        this.toggleUndoButton = true;
                      }
                      else {
                        this.toggleUndoButton = false
                      }
                      this.toastr.error('Undo failed', '', { timeOut: 4000 })
                    }
                  })
                  this.getMainItemList();
                  this.checkActionLogger();
                }
              })
            }
            else if (apiResult.status === 403) {
              let data3 = {
                authToken: this.authToken,
                fromId: this.userInfo.userId,
                collabLeaderId: this.collabLeaderId
              }
              this.actionService.deleteAction(data3).subscribe((apiResult) => {
                if (apiResult.status === 403 && apiResult.message === "No Action Found") {
                  this.toggleUndoButton = true;
                }
                else {
                  this.toggleUndoButton = false
                }
              })
              this.toastr.error(`Changes done by main user: ${this.collabLeaderName} take precedence and affects undo operation.`, '', { timeOut: 5000 })
            }
          }, (err) => {
            this.toastr.error('Some Error Occured', '', { timeOut: 3000 })
          })
        }
      }
      else if (apiResult.status === 403) {
        this.toastr.error(`No actions of ${this.collabLeaderName}'s friend(s) is left to revert!`, '', { timeOut: 4000 })
        this.toggleUndoButton = true;
      }
    })
  } // end of performUndoOperation

  // user will be logged out
  public logoutUser() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.appService.logoutFunction(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.deleteCookies();
        this.toastr.success(apiResult.message, '', { timeOut: 3550 });
        this.socketService.exitSocket();
        this.router.navigate(['/home']);
      }
      else {
        this.deleteCookies();
        this.socketService.exitSocket();
        //this.toastr.error(apiResult.message, '', { timeOut: 1250 })
        this.router.navigate(['/home'])
      }
    })
  } // end of logoutUser
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
  }
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
  destroysItemModal() {
    destroyModal();
  }
}
