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

  //private url = "http://api.to-do-list.live";

  private url = 'http://localhost:3000';

  constructor(public http: HttpClient) { }

  public getProjectList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
    return this.http.post(`${this.url}/api/v1/main/view/single`, params)
  } // end of getProjectList

  public addNewProjectList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
      .set('projectName', data.projectName)

    return this.http.post(`${this.url}/api/v1/main/add-project`, params)
  } // end of addNewProjectList

  public deleteProjectList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
      .set('projectName', data.projectName)

    return this.http.post(`${this.url}/api/v1/main/delete-entry`, params)
  } // end of deleteProjectList

  public getItemList(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
    return this.http.post(`${this.url}/api/v1/main/view/single`, params)
  } // end of getItemList

  public addNewItemToProject(data): Observable<any> {
    const params = new HttpParams()
      .set('userId', data.userId)
      .set('authToken', data.authToken)
      .set('projectName', data.projectName)
      .set('itemName', data.itemName)

    return this.http.post(`${this.url}/api/v1/main/add-item`, params)
  } // end of addNewItemToProject

  public updateItemInList(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)
    params = params.set('status', data.status)
    for (let i of data.subItemsList) {
      params = params.append('subItems', i)
    }
    return this.http.post(`${this.url}/api/v1/main/add-sub-item`, params)
  } // end of updateItemInList

  public markTaskAsDone(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)
    params = params.set('status', data.status)
    for (let i of data.subItemsList) {

      params = params.append('subItems', i)
    }
    return this.http.post(`${this.url}/api/v1/main/status-update`, params)
  } // end of markTaskAsDone

  public editItemList(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)
    params = params.set('newItemName', data.newItemName)
    params = params.set('status', data.status)
    for (let i of data.subItemsList) {

      params = params.append('subItems', i)
    }
    return this.http.post(`${this.url}/api/v1/main/edit-item`, params)
  } // end of editItemList

  public deleteTask(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    params = params.set('projectName', data.projectName)
    params = params.set('itemName', data.itemName)

    return this.http.post(`${this.url}/api/v1/main/delete-item`, params)
  } // end of deleteTask

  public verifyNotification(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('fromId', data.fromId)
    params = params.set('toId', data.toId)
    params = params.set('type', data.type)
    params = params.set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/main/notifications-verify`, params)
  } // end of verifyNotification

  public getAllUserNotifications(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)
    return this.http.post(`${this.url}/api/v1/main/notifications-user`, params)
  } // end of getAllUserNotifications

  public checkFriend(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('fromId', data.fromId)
    params = params.set('toId', data.toId)
    params = params.set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/main/check-friend`, params)
  } // end of checkFriend

  public addFriend(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('fromId', data.fromId)
    params = params.set('toId', data.toId)
    params = params.set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/main/add-friend`, params)
  } // end of addFriend

  public removeFriend(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('mainId', data.mainId)
    params = params.set('friendId', data.friendId)
    params = params.set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/main/remove-friend`, params)
  } // end of addFriend

  public getUserFriendList(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/main/user-friends`, params)
  } // end of getUserFriendList

  public checkForFriendship(data): Observable<any> {
    var params = new HttpParams();
    params = params.set('mainUserId', data.mainUserId)
    params = params.set('userId', data.userId)
    params = params.set('authToken', data.authToken)

    return this.http.post(`${this.url}/api/v1/main/check-friendship`, params)
  } // end of checkForFriendship
}
