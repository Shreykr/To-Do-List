import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { AppService } from './../../app.service';
import { MainService } from './../../main.service';
import { Cookie } from 'ng2-cookies/ng2-cookies';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { CheckUser } from './../../CheckUser';
import * as $ from 'jquery';

declare const openNavgationBarv1: any;
declare const closeNavigationBarv1: any;
declare const openNavgationBarv2: any;
declare const closeNavigationBarv2: any;
declare const destroyModal: any;


@Component({
  selector: 'app-view-task',
  templateUrl: './view-task.component.html',
  styleUrls: ['./view-task.component.css']
})
export class ViewTaskComponent implements OnInit, CheckUser {

  scrHeight = window.innerHeight;
  scrWidth = window.innerWidth;

  //main values
  public key: any;
  public projectName;
  public itemName: any;
  public subItemName: any;
  public itemNamesList: any = [];
  public subItemsList: any = [];
  public status: any;
  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public toggleMainMessage = 0;
  public flag = 0;
  public authToken: any;
  public userInfo: any;

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
    'itemName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]{1,13}$')])
  })

  subItemModalForm = new FormGroup({
    'subItemName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]{1,13}$')])
  })

  constructor(
    public _route: ActivatedRoute,
    public router: Router,
    private location: Location,
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
    this.projectName = this._route.snapshot.paramMap.get('projectName')

    // checking the user
    this.checkStatus();

    // getting all the project lists
    this.getItemList()
  }

  public checkStatus: any = () => {
    if (this.authToken === undefined || this.authToken === '' || this.authToken === null) {
      this.router.navigate(['/']);
      return false;
    } else {
      return true;
    }
  } //end of check status

  public goToMainHome() {
    this.location.back();
  }

  // Function to execute when create project is selected and submitted.
  getItemList() {
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken
    }
    this.mainService.getItemList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        console.log(apiResult)
        for (let i in apiResult.data.projects) {
          for (let j in apiResult.data.projects[i].items) {
            if (apiResult.data.projects[i].name === this.projectName) {
              this.itemNamesList.push(apiResult.data.projects[i].items[j].itemName)
              console.log(this.itemNamesList)
              if (apiResult.data.projects[i].items.length === 0) {
                this.toggleMainMessage = 0;
                break;
              }
              else {
                this.toggleMainMessage = 1;
                if (apiResult.data.projects[i].items[j].sub_items.length !== 0) {
                  for (let subItems of apiResult.data.project[i].items[j].sub_items) {
                    this.subItemsList.push(subItems);
                  }
                }
              }
            }
            else {
              continue;
            }
          }
          if (apiResult.data.projects[i].name === this.projectName) {
            this.toastr.success("Tasks updated!")
          }
        }
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

  // receiving project name in modal.
  itemModalFormSubmit() {
    this.itemName = this.itemModalForm.controls.itemName.value;

    this.destroysItemModal();

    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName
    }
    this.mainService.addNewItemToProject(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toggleMainMessage = 1;
        this.itemNamesList.push(this.itemName)
        this.toastr.success(apiResult.message)
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
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
