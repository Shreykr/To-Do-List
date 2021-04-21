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
export class MainService {

  private url = "http://localhost:3000"

  constructor(public http: HttpClient) { }

  public getProjectList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
    return this.http.post(`${this.url}/api/v1/main/view/single`, params)
  }

  public addNewProjectList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
      .set('projectName', data.projectName)

    return this.http.post(`${this.url}/api/v1/main/addNewProjectList`, params)
  }


}
