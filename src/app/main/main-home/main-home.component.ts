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

  public key: any;
  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public flag = 0;
  public projectValue: any;
  public authToken: any;
  public userInfo: any;
  public populateDropdown: boolean;
  public flagDropdown = 1;
  public projectNamesList: any = [];
  public flagItemList = 1;

  @HostListener('window:resize', ['$event'])
  getScreenSize(event?) {
    this.scrHeight = window.innerHeight;
    this.scrWidth = window.innerWidth;
  }
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.key = event.keyCode;
    if (this.key === 109) {
      this.toggleNav();
    }
  }

  //Form group for project name
  projectModalForm = new FormGroup({
    'projectName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]{1,13}$')])
  })

  // Form Arry for the project list
  mainProjectForm = new FormGroup({
    'mainProjectList': new FormArray([])
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
    this.getProjectList()
  }

  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  } //end of check status

  getProjectList() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.mainService.getProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        console.log(apiResult.data.projects[0])
        if (apiResult.data.projects.length === 0) {
          this.flagDropdown = 0;
        }
        else {
          this.flagDropdown = 1;
          for (let projectNames of apiResult.data.projects) {
            this.projectNamesList.push(projectNames.name)
          }
          for (let names of this.projectNamesList) {
            this.addMainProjectList(names);
          }
        }

        this.toastr.success(apiResult.message)
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }
  addMainProjectList(value) {
    const control = new FormControl(value);
    (<FormArray>this.mainProjectForm.get('mainProjectList')).push(control);
  }

  getMainProjectList() {
    return (<FormArray>this.mainProjectForm.get('mainProjectList')).controls
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

  destroysProfileModal() {
    destroyModal();
  }

  // receiving project name in modal.
  mainModalFormSubmit() {
    // this.projectValue = this.projectModalForm.controls.projectName.value;
    // this.addMainProjectList(this.projectValue);
    this.destroysProfileModal();

    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectValue,
    }

    this.mainService.addNewProjectList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.flagDropdown = 1;
        this.toastr.success(apiResult.message)
        this.getProjectList();
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })

  }

}
