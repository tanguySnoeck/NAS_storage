import { Component, OnInit } from '@angular/core';
import { AdminService } from './admin.service'

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  private users;

  constructor(private adminService: AdminService ) {}

  public ngOnInit() {
    this.adminService.getAllNonActiveUsers().subscribe(res => {
      this.users = res;
    });
  }

  onSubmit(){
    const req = [];

    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].status != 'Waiting') {
        req.push({
          "_id" : this.users[i]._id,
          "newStatus" : this.users[i].status
        });
      }

      if (this.users[i].status == 'Waiting' && this.users[i].status == 'Deactivated')
        return
    }
    
    this.adminService.setStatus(req).subscribe(res => {
      console.log(res)
    });
  }
}


