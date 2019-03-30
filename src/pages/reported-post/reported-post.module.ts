import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReportedPostPage } from './reported-post';

@NgModule({
  declarations: [
    ReportedPostPage,
  ],
  imports: [
    IonicPageModule.forChild(ReportedPostPage),
  ],
  exports: [
    ReportedPostPage
  ]
})
export class ReportedPostPageModule {}
