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

    return this.http.post(`${this.url}/api/v1/main/add-project`, params)
  }

  public getItemList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
    return this.http.post(`${this.url}/api/v1/main/view/single`, params)
  }

  public addNewItemToProject(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
      .set('projectName', data.projectName)
      .set('itemName', data.itemName)

    return this.http.post(`${this.url}/api/v1/main/add-item`, params)
  }

  public updateItemInList(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)
    params = params.set('status', data.status)
    for (let i of data.subItemsList) {
      console.log(i)
      params = params.append('subItems', i)
    }
    return this.http.post(`${this.url}/api/v1/main/add-sub-item`, params)
  }

  public markTaskAsDone(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)
    params = params.set('status', data.status)
    console.log(data.subItemsList)
    for (let i of data.subItemsList) {
      console.log(i)
      params = params.append('subItems', i)
    }
    return this.http.post(`${this.url}/api/v1/main/status-update`, params)
  }

  public editItemList(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)
    params = params.set('newItemName', data.newItemName)
    params = params.set('status', data.status)
    for (let i of data.subItemsList) {
      console.log(i)
      params = params.append('subItems', i)
    }
    return this.http.post(`${this.url}/api/v1/main/edit-item`, params)
  }

  public deleteTask(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)

    return this.http.post(`${this.url}/api/v1/main/delete-item`, params)
  }
}
