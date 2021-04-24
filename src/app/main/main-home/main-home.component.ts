import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { AppService } from './../../app.service';
import { MainService } from './../../main.service';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CheckUser } from './../../CheckUser';
import * as $ from 'jquery';

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
export class MainHomeComponent implements OnInit, CheckUser {

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
  projectModalForm = new FormGroup({
    'projectName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9][a-zA-Z0-9 ]{0,25}$')])
  })

  constructor(
    public router: Router,
    public appService: AppService,
    public mainService: MainService,
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
  } //end of check status

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
  }// end of getProjectLists function

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
  }

  // navigate to view task component
  goToViewTask(projectNameSelected) {
    this.router.navigate(['/view-task', projectNameSelected])
  }

  getAllUsers() {
    this.appService.getSpecificUsersDetails().subscribe((apiResult) => {
      if (apiResult.status === 200) {
        var tempList = []
        for (let i of apiResult.data) {
          tempList.push(i)
          this.allUserList = [...new Set(tempList)]
        }
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error('Some error occured', '', { timeOut: 1250 })
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
        this.router.navigate(['/']);
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    })
  }

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
  destroysProfileModal() {
    destroyModal();
  }
}
