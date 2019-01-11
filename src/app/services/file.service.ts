import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import * as jwtDecode from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private linkApi = 'http://localhost:4040/api/file';
  private token;

  constructor(private http: HttpClient) {
    this.token = jwtDecode(localStorage.getItem("AuthToken"));
  }

  //GET All files
  getFile(): Observable<any> {
    return this.http.get(this.linkApi)
  }

}
