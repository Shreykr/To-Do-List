
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
  }

  /* Sending the data so as to sign up */
  signUpFunction(f) {
    // TODO: Use EventEmitter with form value
    let data = {
      email: f.controls.userLoginMail.value.toLowerCase(),
      password: f.controls.userLoginPassword.value
    }

    this.appService.loginFunction(data).subscribe((apiResult) => {

      //console.log(`Response from backend: ${apiResult}`);

      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message);
        Cookie.set('authtoken', apiResult.data.authToken);
        Cookie.set('mainUserId', apiResult.data.userDetails.userId);
        this.appService.setUserInfoInLocalStorage(apiResult.data.userDetails)

        this.router.navigate(['/main-home']);
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

}
