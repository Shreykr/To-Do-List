import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppService } from 'src/app/app.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import * as $ from 'jquery';

@Component({
  selector: 'app-password-recovery',
  templateUrl: './password-recovery.component.html',
  styleUrls: ['./password-recovery.component.css']
})
export class PasswordRecoveryComponent implements OnInit {

  public authToken = this._route.snapshot.paramMap.get('authToken');
  public userId = this._route.snapshot.paramMap.get('userId');

  // Creation of form group
  passwordEditForm = new FormGroup({
    newPassword: new FormControl(null, [Validators.required, Validators.pattern("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,30}$")])
  })

  constructor(
    private _route: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {
  }

  public goToLogin = (): any => {
    this.router.navigate(['/login'])
  }
  editUserPassword(f) {
    let data = {
      authToken: this.authToken,
      userId: this.userId,
      newPassword: f.controls.newPassword.value
    }
    this.appService.editUserPassword(data).subscribe((apiResult) => {
      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message)
        setTimeout(() => {
          this.goToLogin();
        }, 2000);
      }
      else if (apiResult.status === 404) {
        apiResult.message = "This link is either invalid or expired."
        this.toastr.error(apiResult.message);
        this.router.navigate(['not-found']);
      }
      else if (apiResult.status === 500) {
        apiResult.message = "This link is either invalid or expired."
        this.toastr.error(apiResult.message);
        this.router.navigate(['not-found'])
      }
      else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }
}
