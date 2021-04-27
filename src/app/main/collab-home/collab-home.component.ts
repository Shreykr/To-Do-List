import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CheckUser } from './../../CheckUser';
import { AppService } from './../../app.service';
import { MainService } from './../../main.service';
import { SocketService } from './../../socket.service';
import * as $ from 'jquery';

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
export class CollabHomeComponent implements OnInit {

  scrHeight = window.innerHeight;
  scrWidth = window.innerWidth;

  //main values
  public projectNamesList: any = [];
  public key: any;
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
  public notificationsList: any = [];
  public notificationsMapping: any = {};
  public notifTrackerList: any = [];
  public notificationModalFlag: Boolean = false;
  public friendsModalFlag: Boolean = false;
  public friendsIdList: any = [];
  //public friendsNameList: any = [];
  public friendsIdMapping: any = [];

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

  constructor(
    public router: Router,
    public appService: AppService,
    public mainService: MainService,
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

    // checking the user
    this.checkStatus();

    //testing socket connection
    this.verifyUserConfirmation();

    //dummy test function
    this.connected();

    // receiving real time notifications to subscribed socket events
    this.receiveRealTimeNotifications();

    // receiving real time notifications of friend viewing your tasks. All friends will be notified of this activity.
    this.receiveGroupConnectionsNotifications();

    // getting all the project lists
    this.getProjectLists()
  }

  // fucntion to check the authToken/session of the user
  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  } //end of checkStatus

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
      console.log(data)
    })
  }// end of getProjectLists  

  // function to receive real time notifications
  receiveRealTimeNotifications() {
    this.socketService.receiveRealTimeNotifications(this.userInfo.userId).subscribe((data) => {
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 4000 })
    })
  } // end of receiveRealTimeNotifications

  // function to receive real time friend group related notifications
  receiveGroupConnectionsNotifications() {
    this.socketService.receiveGroupConnectionsNotifications().subscribe((data) => {
      this.toastr.info(`${data.notificationMessage}`, '', { timeOut: 6000 })
    })
  } // end of receiveGroupConnectionsNotifications

  // function to execute when create project is selected and submitted.
  getProjectLists() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.mainService.getProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
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
      } else {
        //this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured", '', { timeOut: 1250 });
    })
  }// end of getProjectLists

  // receiving project name in modal.
  mainModalFormSubmit() {
    this.projectValue = this.projectModalForm.controls.projectName.value;
    this.destroysProfileModal();

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
      } else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }// end of mainModalFormSubmit

  // navigate to view task component
  goToViewTask(projectNameSelected) {
    this.router.navigate(['/view-task', projectNameSelected])
  }// end of goToViewTask  

  // user will be logged out
  logoutUser() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.appService.logoutFunction(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        Cookie.delete('authtoken');
        this.router.navigate(['/']);
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    })
  }// end of logoutUser

  // logic to change sidebar position based on screen width
  // requires screen refresh after changing to screen size < 750px width.
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
  destroysProfileModal() {
    destroyModal();
  }
  destroysSearchModal() {
    destroyModal();
  }
  destroysNotifModal() {
    destroyModal();
  }

}
