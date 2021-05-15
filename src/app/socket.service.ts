import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/toPromise';

import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from "@angular/common/http";

@Injectable()
export class SocketService {

  //private url = 'http://api.to-do-list.live';

  private url = 'http://localhost:3000';

  private socket;

  constructor(public http: HttpClient) {
    this.socket = io(this.url, { 'transports': ['websocket'] });
  }

  public startConnection = () => {
    return Observable.create((observer) => {
      this.socket = io(this.url);
      observer.next();
    })
  } // end of startConnection

  public verifyUser = () => {
    return Observable.create((observer) => {
      this.socket.on('verifyUser', (data) => {
        observer.next(data);
      });
    });
  } // end of verifyUser

  public setUser = (authToken) => {
    this.socket.emit('set-user', authToken);
  } // end of setUser

  public receiveRealTimeNotifications = (userId) => {
    return Observable.create((observer) => {
      this.socket.on(userId, (data) => {
        observer.next(data);
      })
    })
  } // end of receiveRealTimeNotifications

  public sendRequestNotification = (notificationObject) => {
    this.socket.emit('friend-request-notification', notificationObject)
  } // end of sendRequestNotification

  public sendFriendAcceptNotification = (notificationObject) => {
    this.socket.emit('friend-accept-notification', notificationObject)
  } // end of sendFriendAcceptNotification

  public sendFriendRemovalNotification = (notificationObject) => {
    this.socket.emit('friend-removed-notification', notificationObject)
  } // end of sendFriendAcceptNotification

  public sendConnectionStatusNotification = (notificationObject) => {
    this.socket.emit('friend-connect-notification', notificationObject)
  } // end of sendConnectionStatusNotification

  public receiveGroupNotifications = () => {
    return Observable.create((observer) => {
      this.socket.on('friend-group-notification', (data) => {
        observer.next(data)
      })
    })
  } // end of receiveGroupNotifications

  public sendGroupEditsNotification = (notificationObject) => {
    this.socket.emit('friend-edits-notification', notificationObject)
  } // end of sendGroupEditsNotification

  public disconnectFriend = (notificationObject) => {
    this.socket.emit('disconnectFriend', notificationObject)
  } // end of disconnectFriend

  public exitSocket = () => {
    this.socket.disconnect();
  } // end of exitSocket

  private handleError(err: HttpErrorResponse) {

    let errorMessage = '';
    if (err.error instanceof Error) {
      errorMessage = `An error occurred: ${err.error.message}`;
    } else {
      errorMessage = `Server returned code: ${err.status}, error message is: ${err.message}`;
    }
    return Observable.throw(errorMessage);
  }
} // end of handleError
