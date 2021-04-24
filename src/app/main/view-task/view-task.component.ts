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
  public status: Boolean = false;
  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public toggleMainMessage = 0;
  public flag = 0;
  public authToken: any;
  public userInfo: any;
  public statusMapping: any = {}
  public subTaskMapping: any = {}

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

  editItemModalForm = new FormGroup({
    'editItemName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]{1,13}$')])
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

  // function to execute when component first loads
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
            console.log(this.subTaskMapping)
            this.subItemsList.splice(0, this.subItemsList.length)
          }
        }
        this.toastr.success("Tasks updated")
      } else {
        this.toastr.error(apiResult.message)
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
      userId: this.userInfo.userId,
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
        this.toastr.success(apiResult.message)
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

  // to set the item value before making updates on the item
  getItemName(value) {
    this.itemName = value
  }

  // function to execute when sub toDo task is added
  subItemModalFormSubmit() {
    this.subItemName = this.subItemModalForm.controls.subItemName.value;
    if (this.subTaskMapping[this.itemName] !== undefined) {
      for (let i of this.subTaskMapping[this.itemName]) {
        this.subItemsList.push(i)
      }
    }
    this.subItemsList.push(this.subItemName)

    this.destroysItemModal();

    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName,
      status: this.statusMapping[this.itemName],
      subItemsList: this.subItemsList
    }
    this.mainService.updateItemInList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message)
        this.subItemsList.splice(0, this.subItemsList.length);
        delete this.subTaskMapping[this.itemName];
        this.updateSubItemsInDom();
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

  // function to execute when sub items are to be updated on DOM
  updateSubItemsInDom() {
    let data = {
      userId: this.userInfo.userId,
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
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

  // function to execute when item is marked as Done
  markedAsDone(value) {
    console.log(1)
    this.itemName = value;
    if (this.subTaskMapping[this.itemName] !== undefined) {
      for (let i of this.subTaskMapping[this.itemName]) {
        this.subItemsList.push(i)
      }
    }

    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName,
      status: this.statusMapping[this.itemName],
      subItemsList: this.subItemsList
    }

    this.mainService.markTaskAsDone(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.statusMapping[this.itemName] = true;
        console.log(this.statusMapping)
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
      }
      else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

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
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName,
      newItemName: newItemName,
      status: this.statusMapping[this.itemName],
      subItemsList: this.subItemsList
    }
    console.log(data)
    this.mainService.editItemList(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
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
                    console.log(1)
                    this.itemNamesList[i] = newItemName;
                  }
                }
              }
            }
            else {
              continue;
            }
            console.log(this.statusMapping)
            console.log(this.subTaskMapping)
            console.log(this.itemNamesList)
            this.subItemsList.splice(0, this.subItemsList.length)
          }
        }
        this.toastr.success(apiResult.message, '', { timeOut: 1250 })
        this.itemName = newItemName;
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

  // function to delete 
  deleteTask(value) {
    this.itemName = value;
    let data = {
      userId: this.userInfo.userId,
      authToken: this.authToken,
      projectName: this.projectName,
      itemName: this.itemName
    }
    this.mainService.deleteTask(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {

        delete this.statusMapping[this.itemName];
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
      }
      else {
        this.toastr.error(apiResult.message, '', { timeOut: 1250 })
      }
    }, (err) => {
      this.toastr.error("Some error occured", '', { timeOut: 1250 })
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
