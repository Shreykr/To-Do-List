import { Component, HostListener, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
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
export class MainHomeComponent implements OnInit {

  scrHeight = window.innerHeight;
  scrWidth = window.innerWidth;

  public key: any;

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

  public toggle_1: any = 0;
  public toggle_2: any = 0;
  public flag = 0;
  public projectValue: any;

  projectModalForm = new FormGroup({
    'projectName': new FormControl(null, [Validators.required, Validators.pattern('^[a-zA-Z0-9]{1,13}$')])
  })

  mainProjectForm = new FormGroup({
    'mainProjectList': new FormArray([])
  })

  constructor(

  ) { this.getScreenSize(); }

  ngOnInit(): void {
    if (this.scrWidth <= 750) {
      this.toggle_2 = 1;
      this.flag = 1;
    }
    else {
      this.flag = 0;
      this.toggle_1 = 1;
    }

  }

  onSubmitForm(f) {
    console.log(f);
  }

  mainModalFormSubmit() {
    console.log(1)
    this.projectValue = this.projectModalForm.controls.projectName.value;
    console.log(this.projectValue);
    this.addMainProjectList(this.projectValue);
    this.destroysProfileModal();

    // Subscribe to api call to update project list on backend.
  }

  addMainProjectList(value) {
    const control = new FormControl(value);
    (<FormArray>this.mainProjectForm.get('mainProjectList')).push(control);
  }

  getMainProjectList() {
    return (<FormArray>this.mainProjectForm.get('mainProjectList')).controls
  }

  toggleNav() {
    console.log(`toggle_1: ${this.toggle_1}`)
    console.log(`toggle_2: ${this.toggle_2}`)

    if (this.toggle_1 === 1 && this.flag === 0) {
      console.log(1);
      this.closeNav_1();
      this.toggle_1 = 0;
    }
    else if (this.toggle_2 === 1 && this.flag === 1) {
      console.log(2);
      this.openNav_2();
      this.toggle_2 = 0;
    }
    else if (this.toggle_1 === 0 && this.flag === 0) {
      console.log(3);
      this.openNav_1();
      this.toggle_1 = 1;
    }
    else if (this.toggle_2 === 0 && this.flag === 1) {
      console.log(4);
      this.closeNav_2();
      this.toggle_2 = 1;
    }
    console.log(`toggle_1: ${this.toggle_1}`)
    console.log(`toggle_2: ${this.toggle_2}`)

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
    console.log("gg")
    destroyModal();
  }

}
