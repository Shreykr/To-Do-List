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
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Subscription } from 'rxjs';
import { ActionService } from 'src/app/action.service';

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
export class CollabViewTaskComponent implements OnInit {

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
    private location: Location,
    public appService: AppService,
    public mainService: MainService,
    public actionService: ActionService,
    public socketService: SocketService,
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
    this.projectName = this._route.snapshot.paramMap.get('projectName');
    this.collabLeaderName = Cookie.get('collabLeaderName');
    this.collabLeaderId = this._route.snapshot.paramMap.get('toId');

    // checking the user
    this.checkStatus();

    //testing socket connection
    this.verifyUserConfirmation();

    //dummy test function
    this.connected();

    // receiving real time notifications to subscribed socket events
    this.receiveRealTimeNotifications();

    this.receiveGroupNotifications();

    // getting all the task lists
    this.getMainItemList();
  }

  ngOnDestroy() {
    this.subscription_1.unsubscribe();
    this.subscription_2.unsubscribe();
  }

  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  } //end of check status

  //function to verify user (socket connection testing)
  public verifyUserConfirmation: any = () => {
    console.log("verify")
    this.socketService.verifyUser()
      .subscribe((data) => {
        this.disconnectedSocket = false;
        this.socketService.setUser(this.authToken);
      });
  }// end of verifyUserConfirmation

  //dummy test function
  public connected: any = () => {
    this.socketService.connected().subscribe((data) => {
    })
  }// end of connected

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

  public goToMainHome() {
    this.location.back();
  }

  // function to execute when component first loads
  getMainItemList() {
    let data = {
      userId: this.collabLeaderId,
      authToken: this.authToken
    }
    this.mainService.getItemList(data).subscribe((apiResult) => {
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
        console.log(apiResult)
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
      } else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

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
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} added a new task with name ${this.itemName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        };

        this.socketService.sendGroupEditsNotification(notificationObject);

        let action = {
          type: "Task Addition",
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
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.toastr.error("Some Error occured")
        })
      } else {
        this.toastr.error(apiResult.message, '', { timeOut: 1550 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  } // end of itemModalFormSubmit

  // to set the item value before making updates on the item
  getItemName(value) {
    this.itemName = value
  } // end of getItemName

  // // function to execute when sub toDo task is added
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
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.toastr.error("Some Error occured")
        })

        this.subItemsList.splice(0, this.subItemsList.length);
        delete this.subTaskMapping[this.itemName];

        let notificationObject = {
          fromId: this.userInfo.userId,
          toId: this.collabLeaderId,
          type: "Friend collab",
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} added a new sub-task: ${this.subItemName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        }
        this.socketService.sendGroupEditsNotification(notificationObject);
        this.updateSubItemsInDom();
      } else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  } // end of subItemModalFormSubmit

  // // function to execute when sub items are to be updated on DOM
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
            console.log(this.subTaskMapping)
            this.subItemsList.splice(0, this.subItemsList.length)
          }
        }
      } else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  } // end of updateSubItemsInDom

  // // function to execute when item is marked as Done
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
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} marked task: ${this.itemName} as Completed`,
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
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.toastr.error("Some Error occured")
        })
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1450 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  } // end of markedAsDone

  // // function to execute to edit the item name
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
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.toastr.error("Some Error occured")
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
                  console.log(this.itemName)
                  console.log(this.itemNamesList)
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
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} renamed a task as ${newItemName}`,
          fullName: this.collabLeaderName,
          refreshItemList: true
        }
        this.socketService.sendGroupEditsNotification(notificationObject);
      } else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  } // end of editItemModalFormSubmit

  // // function to delete 
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
    tempSubList = [...this.subTaskMapping[this.itemName]]
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
          notificationMessage: `${this.userInfo.firstName} ${this.userInfo.lastName} deleted task: ${this.itemName}`,
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
          else {
            this.toastr.error(apiResult.message, '', { timeOut: 1550 })
          }
        }, (err) => {
          this.toastr.error("Some Error occured")
        })

      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some error occured", '', { timeOut: 1250 })
    })
  }

  // user will be logged out
  logoutUser() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.appService.logoutFunction(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        Cookie.delete('authtoken');
        Cookie.delete('userId');
        Cookie.delete('collabLeaderId');
        Cookie.delete('projectName')
        Cookie.delete('collabLeaderName')
        this.router.navigate(['/']);
        setTimeout(() => {
          this.toastr.success(apiResult.message, '', { timeOut: 3550 })
        }, 2000);
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    })
  }

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
