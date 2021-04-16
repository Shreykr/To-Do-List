import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AppService } from './../../app.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import * as $ from 'jquery';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  // Creation of form group
  profileSignupForm = new FormGroup({

    userFirstName: new FormControl(null, [Validators.required, Validators.pattern("([a-zA-Z]{2,30}\s*)+")]),
    userLastName: new FormControl(null, [Validators.pattern("([a-zA-Z]{2,30}\s*)+")]),
    userMobileNumber: new FormControl(null, [Validators.required, Validators.pattern("^[1-9][0-9]{5,15}$")]),
    userCountry: new FormControl(null, [Validators.required]),
    userMail: new FormControl(null, [Validators.required, Validators.email]),
    userPassword: new FormControl(null, [Validators.required, Validators.pattern("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$")]),
    userConfirmPassword: new FormControl(null, [Validators.required, Validators.pattern("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$")])
  });

  // Stores result after comparing passwords
  public result: boolean = false;

  public countryList: any = ["Afghanistan", "Aland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda", "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bonaire, Saint Eustatius and Saba ", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil", "British Indian Ocean Territory", "British Virgin Islands", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos Islands", "Colombia", "Comoros", "Cook Islands", "Costa Rica", "Croatia", "Cuba", "Curacao", "Cyprus", "Czech Republic", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Ethiopia", "Falkland Islands", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana", "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland", "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and McDonald Islands", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Isle of Man", "Israel", "Italy", "Ivory Coast", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao", "Macedonia", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "North Korea", "Northern Mariana Islands", "Norway", "Oman", "Pakistan", "Palau", "Palestinian Territory", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn", "Poland", "Portugal", "Puerto Rico", "Qatar", "Republic of the Congo", "Reunion", "Romania", "Russia", "Rwanda", "Saint Barthelemy", "Saint Helena", "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin", "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Sint Maarten", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "U.S. Virgin Islands", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican", "Venezuela", "Vietnam", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"]

  // Stores the value to update the progress bar
  public percentageValue: any = 0;
  public resultPercentage: String = "0%";

  // To track which inputs the progress bar updated for. 
  // Takes values 1 or 0.
  public updateObj = {
    firstName: 0,
    mobileNumber: 0,
    country: 0,
    email: 0,
    password: 0,
    confirmPassword: 0
  }

  constructor(
    public appService: AppService,
    public router: Router,
    public toastr: ToastrService,
    vcr: ViewContainerRef
  ) { }

  ngOnInit(): void {
    //this.profileSignupForm.controls.userConfirmPassword.disable()
  }

  /* Compares passwords */
  public verify = () => {
    if (this.profileSignupForm.controls.userPassword.value == this.profileSignupForm.controls.userConfirmPassword.value) {
      this.result = true;
    }
    else {
      this.result = false;
    }
    // if (this.profileSignupForm.controls.userPassword.valid) {
    //   this.profileSignupForm.controls.userConfirmPassword.enable()
    // }
    // else {
    //   this.profileSignupForm.controls.userConfirmPassword.disable()
    // }
  }

  public updateProgressBar = () => {

    if ((this.profileSignupForm.controls.userFirstName.dirty && this.profileSignupForm.controls.userFirstName.valid) && (this.updateObj.firstName !== 1)) {
      this.percentageValue += 16.6666667;
      this.updateObj['firstName'] = 1;
    }
    else if ((this.updateObj.firstName == 1) && this.profileSignupForm.controls.userFirstName.invalid) {
      this.updateObj['firstName'] = 0;
      this.percentageValue -= 16.6666667;
    }

    if ((this.profileSignupForm.controls.userMobileNumber.dirty && this.profileSignupForm.controls.userMobileNumber.valid) && (this.updateObj.mobileNumber !== 1)) {
      this.percentageValue += 16.6666667;
      this.updateObj['mobileNumber'] = 1;
    }
    else if ((this.updateObj.mobileNumber == 1) && this.profileSignupForm.controls.userMobileNumber.invalid) {
      this.updateObj['mobileNumber'] = 0;
      this.percentageValue -= 16.6666667;
    }

    if ((this.profileSignupForm.controls.userCountry.dirty && this.profileSignupForm.controls.userCountry.valid) && (this.updateObj.country !== 1)) {
      this.percentageValue += 16.6666667;
      this.updateObj['country'] = 1;
    }
    else if ((this.updateObj.country == 1) && this.profileSignupForm.controls.userCountry.invalid) {
      this.updateObj['country'] = 0;
      this.percentageValue -= 16.6666667;
    }

    if ((this.profileSignupForm.controls.userMail.dirty && this.profileSignupForm.controls.userMail.valid) && (this.updateObj.email !== 1)) {
      this.percentageValue += 16.6666667;
      this.updateObj['email'] = 1;
    }
    else if ((this.updateObj.email == 1) && this.profileSignupForm.controls.userMail.invalid) {
      this.updateObj['email'] = 0;
      this.percentageValue -= 16.6666667;
    }

    if ((this.profileSignupForm.controls.userPassword.dirty && this.profileSignupForm.controls.userPassword.valid) && (this.updateObj.password !== 1)) {
      this.percentageValue += 16.6666667;
      this.updateObj['password'] = 1;

    }
    else if ((this.updateObj.password == 1) && this.profileSignupForm.controls.userPassword.invalid) {
      this.updateObj['password'] = 0;
      this.percentageValue -= 16.6666667;
    }


    if ((this.profileSignupForm.controls.userConfirmPassword.dirty && this.profileSignupForm.controls.userConfirmPassword.valid) && (this.updateObj.confirmPassword !== 1) && this.result) {
      this.percentageValue += 16.6666667;
      this.updateObj['confirmPassword'] = 1;
      console.log(9);
    }
    else if (((this.updateObj.confirmPassword == 1) && (this.profileSignupForm.controls.userConfirmPassword.invalid)) || ((this.updateObj.confirmPassword == 1) && (this.profileSignupForm.controls.userPassword.dirty || this.profileSignupForm.controls.userConfirmPassword.dirty) && !this.result)) {
      this.updateObj['confirmPassword'] = 0;
      this.percentageValue -= 16.6666667;
      console.log(10)
    }

    this.resultPercentage = this.percentageValue + "%"

  } //end of updateProgressBar logic


  public goToLogin = (): any => {
    this.router.navigate(['/login'])
  }

  /* Sending the data so as to sign up */
  signUpFunction(f) {
    // TODO: Use EventEmitter with form value
    let data = {
      firstName: f.controls.userFirstName.value,
      lastName: f.controls.userLastName.value,
      mobileNumber: f.controls.userMobileNumber.value,
      country: f.controls.userCountry.value,
      email: f.controls.userMail.value,
      password: f.controls.userPassword.value

    }

    this.appService.signupFunction(data).subscribe((apiResult) => {

      //console.log(`Response from backend: ${apiResult}`);

      if (apiResult.status === 200) {
        this.toastr.success(apiResult.message);
        setTimeout(() => {
          this.goToLogin();
        }, 2000);
      } else {
        this.toastr.error(apiResult.message)
      }
    }, (err) => {
      this.toastr.error("Some Error Occured");
    })
  }

}
