import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Observable } from 'rxjs';
import { Cookie } from 'ng2-cookies/ng2-cookies';


import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';

@Injectable({
  providedIn: 'root'
})
export class AppService {

  private url = 'http://localhost:3000'

  constructor(
    public http: HttpClient
  ) { }

  //get user info from local storage
  public getUserInfoFromLocalstorage = () => {
    return JSON.parse(localStorage.getItem('userInfo'));
  }

  //set user info on local storage 
  public setUserInfoInLocalStorage = (data) => {
    localStorage.setItem('userInfo', JSON.stringify(data))
  }

  public signupFunction(data): Observable<any> {

    const params = new HttpParams()
      .set('firstName', data.firstName)
      .set('lastName', data.lastName)
      .set('mobileNumber', data.mobileNumber)
      .set('country', data.country)
      .set('email', data.email)
      .set('password', data.password)


    return this.http.post(`${this.url}/api/v1/users/signup`, params);
  } // end of signup function.

  public loginFunction(data): Observable<any> {
    const params = new HttpParams()
      .set('email', data.email)
      .set('password', data.password);

    return this.http.post(`${this.url}/api/v1/users/login`, params);

  } //end of login function

  public logoutFunction(): Observable<any> {
    const params = new HttpParams()
      .set('authToken', Cookie.get('authToken'))

    return this.http.post(`${this.url}/api/v1/users/logout`, params);
  } //end of logout function

  private handleErrorFunction(err: HttpErrorResponse) {

    let errorMessage = '';
    if (err.error instanceof Error) {
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    } // end of if condition

    console.error(errorMessage);

    return Observable.throw(errorMessage);

  }  // end of handleError function


}

