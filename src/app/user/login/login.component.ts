
import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AppService } from './../../app.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Cookie } from 'ng2-cookies/ng2-cookies'
import * as $ from 'jquery';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  // Creation of form group
  profileLoginForm = new FormGroup({
    userLoginMail: new FormControl(null, [Validators.required, Validators.email]),
    userLoginPassword: new FormControl(null, [Validators.required, Validators.pattern("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$")]),
  });

  constructor(
    public appService: AppService,
    public router: Router,
    public toastr: ToastrService,
    vcr: ViewContainerRef
  ) { }

  ngOnInit(): void {
  }

  //function to send the recovery mail
  sendRecoveryMail() {
    let data = {
      email: this.profileLoginForm.controls.userLoginMail.value.toLowerCase()
    }
    this.appService.sendMail(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message);
      }
      else {
        this.toastr.error(apiResult.message);
      }
    }, (err) => {

      this.toastr.error("Some Error Occured");
    })
  } // end of sendRecoveryMail

  /* Sending the data so as to login user */
  loginFunction(f) {
    let data = {
      email: f.controls.userLoginMail.value.toLowerCase(),
      password: f.controls.userLoginPassword.value
    }
    this.appService.loginFunction(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        //this.toastr.success(apiResult.message);
        Cookie.set('authtoken', apiResult.data.authToken);
        Cookie.set('userId', apiResult.data.userDetails.userId);
        this.appService.setUserInfoInLocalStorage(apiResult.data.userDetails)
        this.router.navigate(['/main-home']);
      }
      else if (apiResult.status === 404) {
        this.toastr.error(apiResult.message);
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        this.router.navigate(['server-error', 500])
      }
      else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
      this.router.navigate(['server-error', 500])
    })
  }
}
